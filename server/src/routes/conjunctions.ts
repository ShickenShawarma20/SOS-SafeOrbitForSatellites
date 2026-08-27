import { Router } from "express";
import type { Conjunction, OrbitalElements } from "../types.js";
import { conjunctions, cdmRecords } from "../data/conjunctions.js";
import { satellites } from "../data/satellites.js";
import { debrisObjects } from "../data/debris.js";
import { AppError } from "../middleware/error.js";
import {
  keplerToState,
  orbitRing,
  elementsToKepler,
  propagate,
  type OrbState,
} from "../services/kepler.js";

const router = Router();

/* ---------- Catalog lookups for real orbital elements ---------- */

function findSatelliteElements(id: string): OrbitalElements | null {
  const sat = satellites.find((s) => s.id === id);
  return sat ? sat.elements : null;
}

function findDebrisElements(id: string): { elements: OrbitalElements; type: string; noradId?: number } | null {
  const obj = debrisObjects.find((d) => d.id === id);
  return obj ? { elements: obj.elements, type: obj.type, noradId: obj.noradId } : null;
}

/* Build a 3D ECI orbit ring (closed, km) from catalog orbital elements. */
function ringFromElements(el: OrbitalElements, steps = 96): [number, number, number][] {
  return orbitRing(
    {
      a_km: 6378.0 + el.altitudeKm,
      e: el.eccentricity,
      inc: el.inclinationDeg * (Math.PI / 180),
      raan: el.raanDeg * (Math.PI / 180),
      omega: el.argPerigeeDeg * (Math.PI / 180),
    },
    steps,
  );
}

/* Linear B-plane encounter trajectory (the standard short-encounter model).
 * Over the brief encounter the relative motion is a straight line along the
 * relative-velocity axis; the secondary passes the primary at the recorded
 * B-plane miss offset.  Returns samples { tOffsetSec, alongKm, xiKm, zetaKm, rangeKm }. */
function encounterTrajectory(c: Conjunction, windowSec = 150, step = 1) {
  const relV = c.relativeVelocityKms;                 // km/s
  const xi = c.bPlane ? c.bPlane.xiKm : 0;            // km
  const zeta = c.bPlane ? c.bPlane.zetaKm : -c.missDistanceMeters / 1000;
  const miss = Math.hypot(xi, zeta);                  // km
  const out: { tOffsetSec: number; alongKm: number; xiKm: number; zetaKm: number; rangeKm: number }[] = [];
  for (let t = -windowSec; t <= windowSec; t += step) {
    const along = relV * t;
    out.push({
      tOffsetSec: t,
      alongKm: along,
      xiKm: xi,
      zetaKm: zeta,
      rangeKm: Math.hypot(along, xi, zeta),
    });
  }
  return { samples: out, missKm: miss, windowSec };
}

/* Construct 3D ECI states at TCA for both objects, consistent with the recorded
 * encounter, then propagate ±windowSec to produce ECI trajectory samples that
 * show a real close approach in absolute coordinates. */
function eciEncounter(c: Conjunction, primaryEl: OrbitalElements | null, secondaryEl: OrbitalElements | null, windowSec = 120, step = 2) {
  // Primary on its real orbit at a representative true anomaly.
  const pEl = primaryEl || findSatelliteElements(c.satelliteId);
  const sEl = secondaryEl || findDebrisElements(c.objectId)?.elements || pEl;
  if (!pEl || !sEl) return { primary: [], secondary: [] };
  const pK = elementsToKepler(pEl, 90);
  const stateA: OrbState = keplerToState(pK);
  // Relative velocity direction: head-on (anti-parallel to primary velocity)
  // scaled to the recorded magnitude — this reproduces the CDM rel-V.
  const vA = Math.hypot(stateA.vx, stateA.vy, stateA.vz) || 1;
  const relV = c.relativeVelocityKms;
  const vrel: [number, number, number] = [-(stateA.vx / vA) * relV, -(stateA.vy / vA) * relV, -(stateA.vz / vA) * relV];
  // Miss vector in a B-plane direction perpendicular to v_rel.
  const vrelN = Math.hypot(vrel[0], vrel[1], vrel[2]) || 1;
  const et: [number, number, number] = [vrel[0] / vrelN, vrel[1] / vrelN, vrel[2] / vrelN];
  const ref: [number, number, number] = Math.abs(et[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const dot = ref[0] * et[0] + ref[1] * et[1] + ref[2] * et[2];
  let missDir: [number, number, number] = [ref[0] - dot * et[0], ref[1] - dot * et[1], ref[2] - dot * et[2]];
  const mn = Math.hypot(missDir[0], missDir[1], missDir[2]) || 1;
  missDir = [missDir[0] / mn, missDir[1] / mn, missDir[2] / mn];
  const missKm = c.missDistanceMeters / 1000;
  // Primary + secondary states at TCA.
  const stateAtTcaA: OrbState = { ...stateA };
  const stateAtTcaB: OrbState = {
    x: stateA.x + missDir[0] * missKm,
    y: stateA.y + missDir[1] * missKm,
    z: stateA.z + missDir[2] * missKm,
    vx: stateA.vx + vrel[0],
    vy: stateA.vy + vrel[1],
    vz: stateA.vz + vrel[2],
  };
  const primary: [number, number, number][] = [];
  const secondary: [number, number, number][] = [];
  for (let t = -windowSec; t <= windowSec; t += step) {
    const a = propagate(stateAtTcaA, t, step);
    const b = propagate(stateAtTcaB, t, step);
    primary.push([a.x, a.y, a.z]);
    secondary.push([b.x, b.y, b.z]);
  }
  return { primary, secondary, stateAtTcaA, stateAtTcaB };
}

router.get("/critical", (req, res) => {
  const critical = conjunctions
    .filter(c => c.severity === "critical" && !c.acknowledged)
    .sort((a, b) => new Date(b.tca).getTime() - new Date(a.tca).getTime())[0];
  if (!critical) throw new AppError(404, "NOT_FOUND", "No critical conjunctions");
  res.json(critical);
});

router.get("/summary", (req, res) => {
  const windowHours = parseInt((req.query.window as string)?.replace("h", "")) || 48;
  const cutoff = new Date(Date.now() + windowHours * 3600 * 1000);
  const active = conjunctions.filter(c => new Date(c.tca) <= cutoff);
  res.json({
    critical: active.filter(c => c.severity === "critical").length,
    high: active.filter(c => c.severity === "high").length,
    medium: active.filter(c => c.severity === "medium").length,
    low: active.filter(c => c.severity === "low").length,
    total: active.length,
  });
});

router.get("/upcoming", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const upcoming = conjunctions
    .filter(c => !c.acknowledged)
    .sort((a, b) => new Date(a.tca).getTime() - new Date(b.tca).getTime())
    .slice(0, limit);
  res.json({ items: upcoming, total: conjunctions.length });
});

router.get("/timeline", (req, res) => {
  const windowStr = (req.query.window as string) || "±12h";
  const hours = parseInt(windowStr.replace(/[±h]/g, "")) || 12;
  const now = Date.now();
  const events = conjunctions.map(c => {
    const tcaMs = new Date(c.tca).getTime();
    const offsetMs = tcaMs - now;
    return {
      satelliteId: c.satelliteId,
      objectId: c.objectId,
      time: c.tca,
      offsetHours: Math.round(offsetMs / 3600000 * 10) / 10,
      severity: c.severity,
      probabilityOfCollision: c.probabilityOfCollision,
    };
  }).filter(e => Math.abs(e.offsetHours) <= hours)
    .sort((a, b) => a.offsetHours - b.offsetHours);
  res.json(events);
});

router.get("/", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const total = conjunctions.length;
  const items = conjunctions.slice((page - 1) * limit, page * limit);
  res.json({ items, total, page, limit });
});

router.get("/:id", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  res.json(c);
});

router.get("/:id/geometry", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  const satEl = findSatelliteElements(c.satelliteId);
  const deb = findDebrisElements(c.objectId);
  const objEl = deb ? deb.elements : null;

  const primaryRing = satEl ? ringFromElements(satEl) : [];
  const secondaryRing = objEl ? ringFromElements(objEl) : [];
  const enc = encounterTrajectory(c);
  const eci = eciEncounter(c, satEl, objEl);

  res.json({
    conjunctionId: c.id,
    tca: c.tca,
    missDistanceMeters: c.missDistanceMeters,
    relativeVelocityKms: c.relativeVelocityKms,
    relativeSpeedKmh: c.relativeSpeedKmh,
    bPlane: c.bPlane || { xiKm: 0, zetaKm: -c.missDistanceMeters / 1000 },
    covariance: c.covariance || { sigma1: 0.85, sigma2: 0.43, orientationDeg: 42.5 },
    screeningVolume: c.screeningVolumeKm,
    hardBodyRadiusM: c.hardBodyRadiusM,
    combinedUncertaintyKm: c.combinedUncertaintyKm,
    // Real orbit rings (ECI km) from catalogued elements — for 3D context.
    primary: {
      id: c.satelliteId,
      orbitalElements: satEl || null,
      orbitRing: primaryRing,
    },
    secondary: {
      id: c.objectId,
      type: deb?.type,
      noradId: deb?.noradId,
      orbitalElements: objEl || null,
      orbitRing: secondaryRing,
    },
    // Encounter-plane (B-plane) linear relative trajectory — the core data
    // for the close-approach visualization (computed from the CDM values).
    encounter: {
      tca: c.tca,
      missKm: enc.missKm,
      windowSec: enc.windowSec,
      relativeTrajectory: enc.samples,
    },
    // ECI trajectory samples (±120 s around TCA) for absolute 3D rendering.
    satelliteTrajectory: eci.primary,
    objectTrajectory: eci.secondary,
  });
});

router.get("/:id/objects", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  const satEl = findSatelliteElements(c.satelliteId);
  const deb = findDebrisElements(c.objectId);
  const objEl = deb ? deb.elements : null;
  res.json({
    satellite: {
      id: c.satelliteId,
      orbitalElements: satEl || {
        altitudeKm: 450, inclinationDeg: 97.6, raanDeg: 132.4,
        eccentricity: 0.000126, periodMin: 92.67, argPerigeeDeg: 91.2,
        tle: { line1: "", line2: "", epoch: c.tca },
      },
    },
    object: {
      id: c.objectId,
      type: deb?.type,
      noradId: deb?.noradId,
      orbitalElements: objEl || {
        altitudeKm: 448, inclinationDeg: 97.4, raanDeg: 132.6,
        eccentricity: 0.00018, periodMin: 92.58, argPerigeeDeg: 89.5,
        tle: { line1: "", line2: "", epoch: c.tca },
      },
    },
  });
});

router.get("/:id/history", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  const records = cdmRecords.filter(r => r.conjunctionId === c.id);
  const history = records.map((r, i) => ({
    ...r,
    action: i === 0 ? "initial_cdm" : "cdm_update",
    operator: "System",
  }));
  res.json(history);
});

router.get("/:id/cdms", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  const records = cdmRecords.filter(r => r.conjunctionId === c.id);
  res.json(records);
});

router.get("/:id/bplane", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  res.json({
    conjunctionId: c.id,
    bPlane: c.bPlane || { xiKm: 0.42, zetaKm: -0.87 },
    hardBodyRadiusM: c.hardBodyRadiusM,
    missDistanceMeters: c.missDistanceMeters,
    probabilityOfCollision: c.probabilityOfCollision,
  });
});

router.post("/:id/watchlist", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  c.watchlisted = !c.watchlisted;
  res.json(c);
});

router.post("/:id/acknowledge", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  c.acknowledged = true;
  res.json(c);
});

export default router;
