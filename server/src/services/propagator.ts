/* SOS — SafeOrbitForSattelites · SGP4 propagation service
 *
 * Uses the `satellite.js` library (v7, ESM-only) for SGP4/SDP4 propagation.
 * Because the server compiles to CommonJS, `satellite.js` is loaded via a
 * dynamic import() which is cached after first call.
 *
 * This module is the single source of truth for orbital propagation.  It is
 * kept separate from UI/route code so it can be reused for conjunction
 * screening and trajectory prediction later.
 *
 * Reusable interfaces (Phase 15 — architecture for future collision detection):
 *   SatelliteState  — current propagated position/velocity + timestamp
 *   TrajectoryPoint — a future position/velocity at a timestamp
 */

export interface SatelliteState {
  noradId: number;
  name: string;
  latitude: number;       // degrees
  longitude: number;      // degrees
  altitudeKm: number;     // km above ellipsoid
  velocityKms: number;    // km/s (magnitude)
  position: [number, number, number];   // ECI km
  velocity: [number, number, number];    // ECI km/s
  timestamp: string;       // ISO 8601 UTC
}

export interface TrajectoryPoint {
  timestamp: string;       // ISO 8601 UTC
  position: [number, number, number];   // ECI km
  velocity: [number, number, number];  // ECI km/s
  latitude: number;        // degrees
  longitude: number;      // degrees
  altitudeKm: number;      // km
}

export type PropagationStatus = "ok" | "no_tle" | "propagation_error";

export interface PropagationResult {
  ok: boolean;
  status: PropagationStatus;
  state?: SatelliteState;
  error?: string;
}

// satellite.js is ESM-only → dynamic import, cached as a singleton.
type SatelliteJs = typeof import("satellite.js");
let satelliteJsPromise: Promise<SatelliteJs> | null = null;

async function getSatelliteJs(): Promise<SatelliteJs> {
  if (!satelliteJsPromise) {
    satelliteJsPromise = import("satellite.js");
  }
  return satelliteJsPromise;
}

// Cache compiled satrec objects so we don't re-parse TLEs on every propagation.
/* eslint-disable @typescript-eslint/no-explicit-any */
const satrecCache = new Map<number, { satrec: any; epoch: string }>();

/* Build (or fetch from cache) a satellite.js satrec from a TLE pair. */
async function getSatrec(noradId: number, line1: string, line2: string, epoch: string): Promise<any | null> {
  const cached = satrecCache.get(noradId);
  if (cached && cached.epoch === epoch) return cached.satrec;
  try {
    const s = await getSatelliteJs();
    const satrec = s.twoline2satrec(line1, line2) as any;
    if (!satrec || (satrec.satellite === null && satrec.error)) return null;
    satrecCache.set(noradId, { satrec, epoch });
    return satrec;
  } catch {
    return null;
  }
}

/* Propagate a single satellite to a specific UTC time. */
export async function propagateAt(
  noradId: number,
  name: string,
  line1: string,
  line2: string,
  epoch: string,
  when: Date
): Promise<PropagationResult> {
  if (!line1 || !line2) return { ok: false, status: "no_tle", error: "No TLE data" };
  const satrec = await getSatrec(noradId, line1, line2, epoch);
  if (!satrec) return { ok: false, status: "propagation_error", error: "Invalid TLE" };

  try {
    const s = await getSatelliteJs();
    const result: any = s.propagate(satrec, when);
    const pos = result?.position;
    const vel = result?.velocity;
    if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x)) {
      return { ok: false, status: "propagation_error", error: "Propagation returned NaN" };
    }
    const gmst = s.gstime(when);
    const geo = s.eciToGeodetic(pos, gmst);
    const vMag = vel ? Math.hypot(vel.x, vel.y, vel.z) : 0;

    const state: SatelliteState = {
      noradId,
      name,
      latitude: s.degreesLat(geo.latitude),
      longitude: s.degreesLong(geo.longitude),
      altitudeKm: geo.height,
      velocityKms: vMag,
      position: [pos.x, pos.y, pos.z],
      velocity: vel ? [vel.x, vel.y, vel.z] : [0, 0, 0],
      timestamp: when.toISOString(),
    };
    return { ok: true, status: "ok", state };
  } catch (e) {
    return { ok: false, status: "propagation_error", error: (e as Error).message };
  }
}

/* Propagate now (current UTC). */
export async function propagateNow(
  noradId: number,
  name: string,
  line1: string,
  line2: string,
  epoch: string
): Promise<PropagationResult> {
  return propagateAt(noradId, name, line1, line2, epoch, new Date());
}

/* Generate a predicted trajectory (orbit trail) from a TLE.
 * Produces `steps` points at `stepSec` intervals starting from `startWhen`.
 * For a LEO satellite, ~180 points × 300 s covers a full ~90 min orbit.
 * For GEO/GSO, the caller should pass a longer step or fewer points. */
export async function propagateTrajectory(
  noradId: number,
  name: string,
  line1: string,
  line2: string,
  epoch: string,
  startWhen: Date,
  steps: number,
  stepSec: number
): Promise<{ ok: boolean; points: TrajectoryPoint[]; error?: string }> {
  if (!line1 || !line2) return { ok: false, points: [], error: "No TLE data" };
  const satrec = await getSatrec(noradId, line1, line2, epoch);
  if (!satrec) return { ok: false, points: [], error: "Invalid TLE" };

  try {
    const s = await getSatelliteJs();
    const points: TrajectoryPoint[] = [];
    const startTime = startWhen.getTime();
    for (let i = 0; i < steps; i++) {
      const t = new Date(startTime + i * stepSec * 1000);
      const result: any = s.propagate(satrec, t);
      const pos = result?.position;
      const vel = result?.velocity;
      if (!pos || typeof pos.x !== "number" || !Number.isFinite(pos.x)) continue;
      const gmst = s.gstime(t);
      const geo = s.eciToGeodetic(pos, gmst);
      points.push({
        timestamp: t.toISOString(),
        position: [pos.x, pos.y, pos.z],
        velocity: vel ? [vel.x, vel.y, vel.z] : [0, 0, 0],
        latitude: s.degreesLat(geo.latitude),
        longitude: s.degreesLong(geo.longitude),
        altitudeKm: geo.height,
      });
    }
    return { ok: true, points };
  } catch (e) {
    return { ok: false, points: [], error: (e as Error).message };
  }
}
