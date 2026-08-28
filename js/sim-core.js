/* SOS · SafeOrbitForSattelites — conjunction physics core (pure functions)
 *
 * 3D two-body propagation (RK4) from classical orbital elements, time-of-closest-
 * approach (TCA) search, encounter-plane (B-plane) kinematics, and numerical
 * collision-probability estimation.  Works for any pair of catalogued objects
 * via their real Keplerian elements (inclination, RAAN, altitude, eccentricity).
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.SOSSim = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MU = 398600.4418;   // km^3/s^2 (WGS-84)
  const RE = 6371.0;        // km, mean Earth radius
  const EARTH_R = 6378.0;   // km, equatorial radius (for a = R + alt)
  const DEG = Math.PI / 180;

  /* ---------- Keplerian elements → ECI state ---------- */

  // Solve Kepler's equation M = E − e·sinE (Newton-Raphson) → true anomaly ν.
  function meanToTrue(M, e) {
    let E = M;
    for (let k = 0; k < 12; k++) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      E -= f / fp;
    }
    return 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
  }

  // Perifocal → ECI rotation R = Rz(Ω)·Rx(i)·Rz(ω). Applies to any vector.
  function periToECI(px, py, pz, inc, raan, omega) {
    const cO = Math.cos(omega), sO = Math.sin(omega);
    const ci = Math.cos(inc), si = Math.sin(inc);
    const cR = Math.cos(raan), sR = Math.sin(raan);
    const x1 = px * cO - py * sO;
    const y1 = px * sO + py * cO;
    const z1 = pz;
    const y2 = y1 * ci - z1 * si;
    const z2 = y1 * si + z1 * ci;
    return [x1 * cR - y2 * sR, x1 * sR + y2 * cR, z2];
  }

  // Classical elements → ECI state {x,y,z, vx,vy,vz} (km, km/s).
  // k = { a_km, e, inc, raan, omega, nu } all angles in radians.
  function keplerToState(k) {
    const p = k.a_km * (1 - k.e * k.e);
    const r = p / (1 + k.e * Math.cos(k.nu));
    const px = r * Math.cos(k.nu);
    const py = r * Math.sin(k.nu);
    const s = Math.sqrt(MU / p);
    const vx = -s * Math.sin(k.nu);
    const vy = s * (k.e + Math.cos(k.nu));
    const [x, y, z] = periToECI(px, py, 0, k.inc, k.raan, k.omega);
    const [vxec, vyec, vzec] = periToECI(vx, vy, 0, k.inc, k.raan, k.omega);
    return { x, y, z, vx: vxec, vy: vyec, vz: vzec };
  }

  // Build a Kepler bundle from catalog-style orbital elements.
  function elementsToKepler(el, nuDeg) {
    return {
      a_km: EARTH_R + el.altitudeKm,
      e: el.eccentricity,
      inc: el.inclinationDeg * DEG,
      raan: el.raanDeg * DEG,
      omega: el.argPerigeeDeg * DEG,
      nu: (nuDeg == null ? 0 : nuDeg) * DEG,
    };
  }

  function periodFromA(aKm) {
    return 2 * Math.PI * Math.sqrt((aKm * aKm * aKm) / MU);
  }

  /* ---------- 3D two-body RK4 propagation ---------- */

  function deriv(s) {
    const r2 = s.x * s.x + s.y * s.y + s.z * s.z;
    const rn = Math.sqrt(r2);
    const f = -MU / (rn * r2);
    return { x: s.vx, y: s.vy, z: s.vz, vx: f * s.x, vy: f * s.y, vz: f * s.z };
  }

  function addScaled(s, d, h) {
    return {
      x: s.x + d.x * h, y: s.y + d.y * h, z: s.z + d.z * h,
      vx: s.vx + d.vx * h, vy: s.vy + d.vy * h, vz: s.vz + d.vz * h,
    };
  }

  function rk4(s, dt) {
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

  function propagate(state, tSec, dtMax) {
    const dt = dtMax || 2;
    let s = { x: state.x, y: state.y, z: state.z || 0, vx: state.vx, vy: state.vy, vz: state.vz || 0 };
    const sign = tSec < 0 ? -1 : 1;
    let remaining = Math.abs(tSec);
    while (remaining > 1e-9) {
      const h = Math.min(dt, remaining) * sign;
      s = rk4(s, h);
      remaining -= Math.min(dt, remaining);
    }
    return s;
  }

  // Sample an ECI trajectory from tStart..tEnd (seconds from epoch state).
  function sampleTrajectory(state, tStart, tEnd, stepSec) {
    const out = [];
    let s = propagate(state, tStart, stepSec);
    const n = Math.round((tEnd - tStart) / stepSec);
    for (let i = 0; i <= n; i++) {
      out.push({ t: tStart + i * stepSec, x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz });
      s = rk4(s, stepSec);
    }
    return out;
  }

  /* ---------- Relative kinematics & TCA (3D) ---------- */

  function relative(sa, sb) {
    return {
      dx: sb.x - sa.x, dy: sb.y - sa.y, dz: (sb.z || 0) - (sa.z || 0),
      dvx: sb.vx - sa.vx, dvy: sb.vy - sa.vy, dvz: (sb.vz || 0) - (sa.vz || 0),
    };
  }

  function rangeOf(rel) { return Math.hypot(rel.dx, rel.dy, rel.dz || 0); }
  function relSpeedOf(rel) { return Math.hypot(rel.dvx, rel.dvy, rel.dvz || 0); }

  function rangeAt(sa0, sb0, t) {
    return rangeOf(relative(propagate(sa0, t), propagate(sb0, t)));
  }

  // Golden-section search for TCA over [tMin, tMax].
  function findTCA(sa0, sb0, tMin, tMax) {
    let bestT = tMin, bestR = Infinity;
    const coarse = Math.max((tMax - tMin) / 4000, 0.5);
    for (let t = tMin; t <= tMax; t += coarse) {
      const r = rangeAt(sa0, sb0, t);
      if (r < bestR) { bestR = r; bestT = t; }
    }
    let lo = bestT - coarse, hi = bestT + coarse;
    const phi = (Math.sqrt(5) - 1) / 2;
    let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo);
    let fc = rangeAt(sa0, sb0, c), fd = rangeAt(sa0, sb0, d);
    for (let i = 0; i < 60; i++) {
      if (fc < fd) { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = rangeAt(sa0, sb0, c); }
      else { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = rangeAt(sa0, sb0, d); }
    }
    const tca = (lo + hi) / 2;
    return { tca, missKm: rangeAt(sa0, sb0, tca) };
  }

  /* ---------- Encounter-plane (B-plane) basis (3D) ---------- */

  // et = along relative velocity (time axis); e1, e2 span the B-plane (miss plane).
  function encounterBasis(rel) {
    const vn = relSpeedOf(rel) || 1;
    const et = [rel.dvx / vn, rel.dvy / vn, (rel.dvz || 0) / vn];
    const ref = Math.abs(et[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const dot = ref[0] * et[0] + ref[1] * et[1] + ref[2] * et[2];
    let e1 = [ref[0] - dot * et[0], ref[1] - dot * et[1], ref[2] - dot * et[2]];
    const n1 = Math.hypot(e1[0], e1[1], e1[2]) || 1;
    e1 = [e1[0] / n1, e1[1] / n1, e1[2] / n1];
    const e2 = [
      et[1] * e1[2] - et[2] * e1[1],
      et[2] * e1[0] - et[0] * e1[2],
      et[0] * e1[1] - et[1] * e1[0],
    ];
    return { et, e1, e2, vn };
  }

  // Project relative position onto encounter plane → { along, xi, zeta } (km).
  function projectBPlane(rel, basis) {
    return {
      along: rel.dx * basis.et[0] + rel.dy * basis.et[1] + (rel.dz || 0) * basis.et[2],
      xi: rel.dx * basis.e1[0] + rel.dy * basis.e1[1] + (rel.dz || 0) * basis.e1[2],
      zeta: rel.dx * basis.e2[0] + rel.dy * basis.e2[1] + (rel.dz || 0) * basis.e2[2],
    };
  }

  /* ---------- Collision probability (Foster 2D method, 1D reduction) ----------
   *
   * Integrates a 2D Gaussian N(μ, Σ) over the combined hard-body disc of radius
   * `hbrKm` centred at the ORIGIN (the primary).  μ = {mx,my} is the predicted
   * B-plane miss offset of the secondary, and Σ is the combined position
   * covariance with 1σ principal axes {sx, sy} and orientation `orient` (degrees,
   * angle of the σ1 axis from the ξ axis).
   *
   * Method: rotate into the covariance principal frame (so the Gaussian
   * factorises), then reduce the disc integral to a 1D quadrature over the
   * marginal of the first axis, evaluating the conditional 1D CDF along the
   * second axis.  This is the standard short-encounter Pc estimator (Foster /
   * Chan) and is exact for a circular hard-body — no coarse-grid disc-aliasing.
   */
  function normCdf(x) {
    // Abramowitz & Stegun 7.1.26 erf approximation → Φ(x).
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const z = Math.abs(x) / Math.SQRT2;
    const t = 1 / (1 + p * z);
    const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    return 0.5 * (1 + sign * erf);
  }

  function collisionProbability(mean, cov, hbrKm) {
    const R = Math.abs(hbrKm);
    if (R <= 0 || !isFinite(R)) return 0;
    const sx = cov.sx, sy = cov.sy;
    if (!sx || !sy || sx <= 0 || sy <= 0 || !isFinite(sx) || !isFinite(sy)) return 0;

    // Rotate the mean into the covariance principal frame.
    const orient = (cov.orient || 0) * Math.PI / 180;
    const c = Math.cos(orient), s = Math.sin(orient);
    const mx = mean.mx * c + mean.my * s;
    const my = -mean.mx * s + mean.my * c;

    // P = ∫_{-R}^{R} f_X(x) · [Φ((√(R²−x²) − my)/sy) − Φ((−√(R²−x²) − my)/sy)] dx
    // Composite Simpson's 1/3 rule over [-R, R].
    const N = 512;            // even; R is tiny (~0.01 km) so this is cheap & exact
    const a = -R, b = R, h = (b - a) / N;
    const invSxSqrt2pi = 1 / (sx * Math.sqrt(2 * Math.PI));
    let sum = 0;
    for (let i = 0; i <= N; i++) {
      const x = a + i * h;
      const rc = Math.sqrt(Math.max(0, R * R - x * x));
      const fx = invSxSqrt2pi * Math.exp(-0.5 * ((x - mx) / sx) * ((x - mx) / sx));
      const cdfDiff = normCdf((rc - my) / sy) - normCdf((-rc - my) / sy);
      const f = fx * cdfDiff;
      const w = (i === 0 || i === N) ? 1 / 3 : (i % 2 === 0 ? 2 / 3 : 4 / 3);
      sum += w * f;
    }
    return Math.max(0, sum * h);
  }

  /* ---------- High-level scenario builders ---------- */

  // Build a close-encounter scenario from a CDM-style conjunction record plus the
  // two objects' real orbital elements.  Uses the linear B-plane encounter model
  // (the standard short-encounter approximation): over the brief encounter the
  // relative motion is a straight line along the relative-velocity axis and the
  // secondary passes the primary at the recorded B-plane miss offset.
  //
  // conj: { missDistanceMeters, relativeVelocityKms, bPlane:{xiKm,zetaKm},
  //         covariance:{sigma1,sigma2,orientationDeg}, hardBodyRadiusM, tca }
  // primaryEl/secondaryEl: catalog OrbitalElements (altitudeKm, inclinationDeg, ...)
  function buildEncounter(conj, primaryEl, secondaryEl, opts) {
    opts = opts || {};
    const windowSec = opts.windowSec || 150;
    const step = opts.step || 1;
    const relV = conj.relativeVelocityKms;
    const xi = conj.bPlane ? conj.bPlane.xiKm : 0;
    const zeta = conj.bPlane ? conj.bPlane.zetaKm : -conj.missDistanceMeters / 1000;
    const missKm = Math.hypot(xi, zeta);
    const hbrKm = (conj.hardBodyRadiusM || 10) / 1000;
    // Covariance in the B-plane.  The catalog stores {sigma1, sigma2, orientation};
    // resolve to the encounter-plane axes (along = sx, cross = sy).
    let sx = 1, sy = 0.5;
    if (conj.covariance) {
      sx = conj.covariance.sigma1;
      sy = conj.covariance.sigma2;
    }
    const cov = { sx, sy };
    const mean = { mx: xi, my: zeta };
    const pc = collisionProbability(mean, cov, hbrKm);

    // Sample the linear relative trajectory in the encounter plane.
    const samples = [];
    for (let t = -windowSec; t <= windowSec; t += step) {
      const along = relV * t;
      samples.push({
        t, alongKm: along, xiKm: xi, zetaKm: zeta,
        rangeKm: Math.hypot(along, xi, zeta),
      });
    }

    // Orbit rings from real elements (for 3D context).
    const primaryRing = primaryEl ? orbitRingFromElements(primaryEl) : null;
    const secondaryRing = secondaryEl ? orbitRingFromElements(secondaryEl) : null;

    return {
      tca: conj.tca,
      tcaSec: 0,
      missKm,
      missMeters: missKm * 1000,
      relSpeedKms: relV,
      relSpeedKmh: relV * 3600,
      bPlane: { xiKm: xi, zetaKm: zeta },
      cov,
      hbrKm,
      pc,
      uncertaintyKm: Math.hypot(sx, sy),
      samples,
      windowSec,
      primaryRing,
      secondaryRing,
      primaryElements: primaryEl,
      secondaryElements: secondaryEl,
    };
  }

  function orbitRingFromElements(el, steps) {
    steps = steps || 96;
    const k = elementsToKepler(el, 0);
    const ring = [];
    for (let i = 0; i <= steps; i++) {
      k.nu = (i / steps) * 2 * Math.PI;
      const s = keplerToState(k);
      ring.push([s.x, s.y, s.z]);
    }
    return ring;
  }

  // Propagate two real orbits from elements and search for a real TCA.  Used when
  // phasing is provided; for the headline encounter the linear B-plane model
  // above is preferred because it reproduces the recorded miss distance exactly.
  function analyzeFromElements(primaryEl, secondaryEl, opts) {
    opts = opts || {};
    const nuA = opts.nuADeg || 0;
    const nuB = opts.nuBDeg || 0;
    const A = keplerToState(elementsToKepler(primaryEl, nuA));
    const B = keplerToState(elementsToKepler(secondaryEl, nuB));
    const tMin = opts.tMin != null ? opts.tMin : 0;
    const tMax = opts.tMax != null ? opts.tMax : 6000;
    const { tca, missKm } = findTCA(A, B, tMin, tMax);
    const ra = propagate(A, tca), rb = propagate(B, tca);
    const rel = relative(ra, rb);
    const basis = encounterBasis(rel);
    const m = projectBPlane(rel, basis);
    const cov = opts.cov || { sx: 1.05, sy: 0.74 };
    const hbrKm = opts.hbrKm || 0.06;
    const pc = collisionProbability({ mx: m.xi, my: m.zeta }, cov, hbrKm);
    return {
      epochStates: { A, B },
      tcaSec: tca, missKm,
      relSpeedKms: basis.vn,
      mean: { mx: m.xi, my: m.zeta },
      cov, pc,
      uncertaintyKm: Math.hypot(cov.sx, cov.sy),
    };
  }

  /* ---------- Legacy 2D reference scenario (backward compatible) ---------- */
  // circState produces a 2D circular state (z=0, vz=0) so the old demo scenario
  // still works through the unified 3D propagator.
  function circState(altKm, phaseRad, retrograde) {
    const a = RE + altKm;
    const v = Math.sqrt(MU / a);
    const dir = retrograde ? -1 : 1;
    return {
      x: a * Math.cos(phaseRad), y: a * Math.sin(phaseRad), z: 0,
      vx: -v * Math.sin(phaseRad) * dir, vy: v * Math.cos(phaseRad) * dir, vz: 0,
    };
  }

  function sampleStates(state, tStart, tEnd, stepSec) {
    const out = [];
    let s = { x: state.x, y: state.y, z: state.z || 0, vx: state.vx, vy: state.vy, vz: state.vz || 0 };
    const n = Math.round((tEnd - tStart) / stepSec);
    for (let i = 0; i <= n; i++) {
      if (i === 0 && tStart !== 0) s = propagate(s, tStart, stepSec);
      else if (i > 0) s = rk4(s, stepSec);
      out.push({ t: tStart + i * stepSec, s });
    }
    return out;
  }

  // Legacy 2D analyze for the original reference scenario (cfg with altAKm/altBKm).
  function analyze(cfg) {
    const A = circState(cfg.altAKm, cfg.phaseA || 0, false);
    const B = circState(cfg.altBKm, cfg.phaseB || 0, !!cfg.retrogradeB);
    const tMin = cfg.tMin != null ? cfg.tMin : 60;
    const tMax = cfg.tMax != null ? cfg.tMax : 2700;
    const { tca, missKm } = findTCA(A, B, tMin, tMax);
    const ra = propagate(A, tca), rb = propagate(B, tca);
    const rel = relative(ra, rb);
    const basis = encounterBasis(rel);
    const cov = cfg.cov || { sx: 1.05, sy: 0.74 };
    const hbrKm = cfg.hbrKm || 0.06;
    // 2D B-plane: use perpendicular in the orbital plane as the miss axis.
    const vn = basis.vn;
    const ex = { x: rel.dvx / vn, y: rel.dvy / vn };
    const ey = { x: -ex.y, y: ex.x };
    const mx = rel.dx * ex.x + rel.dy * ex.y;
    const my = rel.dx * ey.x + rel.dy * ey.y;
    const pc = collisionProbability({ mx, my }, cov, hbrKm);
    return {
      epochStates: { A, B },
      tcaSec: tca, missKm,
      relSpeedKms: vn,
      mean: { mx, my },
      cov, pc,
      uncertaintyKm: Math.hypot(cov.sx, cov.sy),
    };
  }

  return {
    MU, RE, EARTH_R,
    meanToTrue, keplerToState, elementsToKepler, periodFromA,
    rk4, propagate, sampleTrajectory, sampleStates,
    relative, rangeOf, relSpeedOf, rangeAt, findTCA,
    encounterBasis, projectBPlane, collisionProbability,
    buildEncounter, analyzeFromElements, orbitRingFromElements,
    circState, analyze,
  };
});
