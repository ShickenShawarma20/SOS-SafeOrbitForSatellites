/* SOS — SafeOrbitForSattelites · 3D Keplerian propagation service
 *
 * Pure-TypeScript two-body propagator.  Converts classical orbital elements
 * to ECI state vectors (position + velocity), propagates with a 4th-order
 * Runge–Kutta integrator in 3D, searches for the time of closest approach
 * (TCA) between two state histories, and builds the encounter-plane (B-plane)
 * geometry used for conjunction screening.
 *
 * This is the deterministic, offline source of truth for the geometry endpoint
 * — it uses the real catalogued orbital elements (inclination, RAAN, altitude,
 * eccentricity) so every conjunction is rendered against the actual orbit
 * geometry of the two involved objects, not a generic circle.
 */

export const MU = 398600.4418; // km^3/s^2 (WGS-84)
export const EARTH_R_KM = 6378.0; // mean Earth radius (km)
const DEG = Math.PI / 180;

export interface OrbState {
  x: number; y: number; z: number;        // ECI position (km)
  vx: number; vy: number; vz: number;     // ECI velocity (km/s)
}

export interface KeplerElements {
  a_km: number;        // semi-major axis (km)
  e: number;          // eccentricity
  inc: number;        // inclination (rad)
  raan: number;       // RAAN (rad)
  omega: number;      // argument of perigee (rad)
  nu: number;         // true anomaly (rad)
}

/* Solve Kepler's equation M = E - e·sinE for true anomaly ν (Newton-Raphson). */
export function meanToTrue(M: number, e: number): number {
  let E = M;
  for (let k = 0; k < 12; k++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    E -= f / fp;
  }
  return 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
}

/* Perifocal → ECI rotation: R = Rz(Ω) · Rx(i) · Rz(ω).  Works for any vector. */
function perifocalToECI(px: number, py: number, pz: number, k: KeplerElements): [number, number, number] {
  const cO = Math.cos(k.omega), sO = Math.sin(k.omega);
  const ci = Math.cos(k.inc), si = Math.sin(k.inc);
  const cR = Math.cos(k.raan), sR = Math.sin(k.raan);
  // Rz(ω)
  const x1 = px * cO - py * sO;
  const y1 = px * sO + py * cO;
  const z1 = pz;
  // Rx(i)
  const y2 = y1 * ci - z1 * si;
  const z2 = y1 * si + z1 * ci;
  // Rz(Ω)
  const X = x1 * cR - y2 * sR;
  const Y = x1 * sR + y2 * cR;
  const Z = z2;
  return [X, Y, Z];
}

/* Classical orbital elements → ECI state vector (position + velocity, km / km·s⁻¹). */
export function keplerToState(k: KeplerElements): OrbState {
  const p = k.a_km * (1 - k.e * k.e);
  const r = p / (1 + k.e * Math.cos(k.nu));
  // Perifocal position & velocity
  const px = r * Math.cos(k.nu);
  const py = r * Math.sin(k.nu);
  const s = Math.sqrt(MU / p);
  const vx = -s * Math.sin(k.nu);
  const vy = s * (k.e + Math.cos(k.nu));
  const [x, y, z] = perifocalToECI(px, py, 0, k);
  const [vxec, vyec, vzec] = perifocalToECI(vx, vy, 0, k);
  return { x, y, z, vx: vxec, vy: vyec, vz: vzec };
}

/* Orbital period from semi-major axis (seconds). */
export function periodFromA(aKm: number): number {
  return 2 * Math.PI * Math.sqrt((aKm * aKm * aKm) / MU);
}

/* ---------- 3D two-body RK4 propagation ---------- */

function deriv(s: OrbState): OrbState {
  const r2 = s.x * s.x + s.y * s.y + s.z * s.z;
  const rn = Math.sqrt(r2);
  const f = -MU / (rn * r2);
  return { x: s.vx, y: s.vy, z: s.vz, vx: f * s.x, vy: f * s.y, vz: f * s.z };
}

function addScaled(s: OrbState, d: OrbState, h: number): OrbState {
  return {
    x: s.x + d.x * h, y: s.y + d.y * h, z: s.z + d.z * h,
    vx: s.vx + d.vx * h, vy: s.vy + d.vy * h, vz: s.vz + d.vz * h,
  };
}

export function rk4(s: OrbState, dt: number): OrbState {
  const k1 = deriv(s);
  const k2 = deriv(addScaled(s, k1, dt / 2));
  const k3 = deriv(addScaled(s, k2, dt / 2));
  const k4 = deriv(addScaled(s, k3, dt));
  return {
    x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: s.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
    vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
    vz: s.vz + (dt / 6) * (k1.vz + 2 * k2.vz + 2 * k3.vz + k4.vz),
  };
}

/* Propagate a state by tSec seconds (fixed step dtMax, sign-aware). */
export function propagate(state: OrbState, tSec: number, dtMax = 2): OrbState {
  const sign = tSec < 0 ? -1 : 1;
  let remaining = Math.abs(tSec);
  let s = { ...state };
  while (remaining > 1e-9) {
    const h = Math.min(dtMax, remaining) * sign;
    s = rk4(s, h);
    remaining -= Math.min(dtMax, remaining);
  }
  return s;
}

/* ---------- Relative kinematics & TCA ---------- */

export interface RelativeState { dx: number; dy: number; dz: number; dvx: number; dvy: number; dvz: number; }

export function relative(a: OrbState, b: OrbState): RelativeState {
  return { dx: b.x - a.x, dy: b.y - a.y, dz: b.z - a.z, dvx: b.vx - a.vx, dvy: b.vy - a.vy, dvz: b.vz - a.vz };
}

export function rangeOf(r: RelativeState): number {
  return Math.hypot(r.dx, r.dy, r.dz);
}

export function relSpeedOf(r: RelativeState): number {
  return Math.hypot(r.dvx, r.dvy, r.dvz);
}

function rangeAt(a0: OrbState, b0: OrbState, t: number): number {
  return rangeOf(relative(propagate(a0, t), propagate(b0, t)));
}

/* Golden-section search for TCA over [tMin, tMax]. */
export function findTCA(a0: OrbState, b0: OrbState, tMin: number, tMax: number): { tca: number; missKm: number } {
  let bestT = tMin, bestR = Infinity;
  const coarse = Math.max((tMax - tMin) / 4000, 0.5);
  for (let t = tMin; t <= tMax; t += coarse) {
    const r = rangeAt(a0, b0, t);
    if (r < bestR) { bestR = r; bestT = t; }
  }
  let lo = bestT - coarse, hi = bestT + coarse;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo);
  let fc = rangeAt(a0, b0, c), fd = rangeAt(a0, b0, d);
  for (let i = 0; i < 60; i++) {
    if (fc < fd) { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = rangeAt(a0, b0, c); }
    else { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = rangeAt(a0, b0, d); }
  }
  const tca = (lo + hi) / 2;
  return { tca, missKm: rangeAt(a0, b0, tca) };
}

/* ---------- Encounter-plane (B-plane) geometry ---------- */

export interface PlaneBasis { et: [number, number, number]; e1: [number, number, number]; e2: [number, number, number]; }

/* Build the encounter-plane basis from the relative velocity at TCA.
 * et = along relative velocity (time axis); e1, e2 span the B-plane (miss plane). */
export function encounterBasis(rel: RelativeState): PlaneBasis {
  const vn = relSpeedOf(rel) || 1;
  const et: [number, number, number] = [rel.dvx / vn, rel.dvy / vn, rel.dvz / vn];
  // Pick a reference direction not parallel to et to build the B-plane axes.
  const ref: [number, number, number] = Math.abs(et[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  // e1 = normalize(ref - (ref·et)·et)
  const dot = ref[0] * et[0] + ref[1] * et[1] + ref[2] * et[2];
  let e1: [number, number, number] = [ref[0] - dot * et[0], ref[1] - dot * et[1], ref[2] - dot * et[2]];
  const n1 = Math.hypot(e1[0], e1[1], e1[2]) || 1;
  e1 = [e1[0] / n1, e1[1] / n1, e1[2] / n1];
  // e2 = et × e1
  const e2: [number, number, number] = [
    et[1] * e1[2] - et[2] * e1[1],
    et[2] * e1[0] - et[0] * e1[2],
    et[0] * e1[1] - et[1] * e1[0],
  ];
  return { et, e1, e2 };
}

/* Project a relative position onto the encounter plane → B-plane coords (km). */
export function projectBPlane(rel: RelativeState, basis: PlaneBasis): { xi: number; zeta: number; along: number } {
  return {
    along: rel.dx * basis.et[0] + rel.dy * basis.et[1] + rel.dz * basis.et[2],
    xi: rel.dx * basis.e1[0] + rel.dy * basis.e1[1] + rel.dz * basis.e1[2],
    zeta: rel.dx * basis.e2[0] + rel.dy * basis.e2[1] + rel.dz * basis.e2[2],
  };
}

/* ---------- Trajectory sampling ---------- */

export interface TrajectorySample { t: number; pos: [number, number, number]; vel: [number, number, number]; }

/* Sample an object's ECI trajectory from tStart..tEnd (seconds, relative to epoch state). */
export function sampleTrajectory(state: OrbState, tStart: number, tEnd: number, stepSec: number): TrajectorySample[] {
  const out: TrajectorySample[] = [];
  let s = propagate(state, tStart, stepSec);
  const n = Math.round((tEnd - tStart) / stepSec);
  for (let i = 0; i <= n; i++) {
    out.push({ t: tStart + i * stepSec, pos: [s.x, s.y, s.z], vel: [s.vx, s.vy, s.vz] });
    s = rk4(s, stepSec);
  }
  return out;
}

/* Build a closed orbit ring (ECI) from elements, sweeping true anomaly 0..2π. */
export function orbitRing(k: Omit<KeplerElements, "nu">, steps = 96): [number, number, number][] {
  const ring: [number, number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const nu = (i / steps) * 2 * Math.PI;
    const s = keplerToState({ ...k, nu });
    ring.push([s.x, s.y, s.z]);
  }
  return ring;
}

/* Build a KeplerElements bundle from the catalog OrbitalElements shape. */
export function elementsToKepler(el: {
  altitudeKm: number; inclinationDeg: number; raanDeg: number;
  eccentricity: number; argPerigeeDeg: number;
}, nuDeg = 0): KeplerElements {
  const a = EARTH_R_KM + el.altitudeKm;
  return {
    a_km: a,
    e: el.eccentricity,
    inc: el.inclinationDeg * DEG,
    raan: el.raanDeg * DEG,
    omega: el.argPerigeeDeg * DEG,
    nu: nuDeg * DEG,
  };
}
