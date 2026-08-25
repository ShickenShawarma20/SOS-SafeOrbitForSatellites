import { Router } from "express";
import type { Conjunction } from "../types.js";
import { conjunctions, cdmRecords } from "../data/conjunctions.js";
import { AppError } from "../middleware/error.js";

const router = Router();

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
  const satPos = [2847.3, -4521.8, 4012.1];
  const objPos = [2800, -4480, 3990];
  const trajectory1 = Array.from({ length: 20 }, (_, i) => {
    const t = (i - 10) * 0.5;
    return [satPos[0] + t * 2.14, satPos[1] + t * 5.82, satPos[2] + t * -4.31];
  });
  const trajectory2 = Array.from({ length: 20 }, (_, i) => {
    const t = (i - 10) * 0.5;
    return [objPos[0] + t * 2.12, objPos[1] + t * 5.78, objPos[2] + t * -4.28];
  });
  res.json({
    satelliteTrajectory: trajectory1,
    objectTrajectory: trajectory2,
    covariance: c.covariance || { sigma1: 0.85, sigma2: 0.43, orientationDeg: 42.5 },
    screeningVolume: c.screeningVolumeKm,
    hardBodyRadiusM: c.hardBodyRadiusM,
  });
});

router.get("/:id/objects", (req, res) => {
  const c = conjunctions.find(c => c.id === req.params.id);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction ${req.params.id} not found`);
  res.json({
    satellite: {
      id: c.satelliteId,
      orbitalElements: {
        altitudeKm: 450,
        inclinationDeg: 97.6,
        raanDeg: 132.4,
        eccentricity: 0.000126,
        periodMin: 92.67,
        argPerigeeDeg: 91.2,
      },
    },
    object: {
      id: c.objectId,
      orbitalElements: {
        altitudeKm: 448,
        inclinationDeg: 97.4,
        raanDeg: 132.6,
        eccentricity: 0.00018,
        periodMin: 92.58,
        argPerigeeDeg: 89.5,
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
