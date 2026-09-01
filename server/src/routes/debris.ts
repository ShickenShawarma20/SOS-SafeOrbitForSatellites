import { Router } from "express";
import type { DebrisObject, PaginatedResponse } from "../types.js";
import { debrisObjects } from "../data/debris.js";
import { conjunctions } from "../data/conjunctions.js";
import { AppError } from "../middleware/error.js";
import {
  orbitRing,
  elementsToKepler,
} from "../services/kepler.js";

const router = Router();

/* Build a 3D ECI orbit ring (closed, km) from catalog orbital elements. */
function ringFromElements(el: DebrisObject["elements"], steps = 96): [number, number, number][] {
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

router.get("/", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const type = req.query.type as string | undefined;
  const risk = req.query.risk as string | undefined;
  const q = (req.query.q as string || "").toLowerCase();

  let filtered = [...debrisObjects];
  if (type) filtered = filtered.filter(d => d.type === type);
  if (risk) filtered = filtered.filter(d => d.riskLevel === risk);
  if (q) filtered = filtered.filter(d =>
    d.id.toLowerCase().includes(q) ||
    d.name.toLowerCase().includes(q) ||
    d.noradId?.toString().includes(q) ||
    d.origin.toLowerCase().includes(q) ||
    d.sourceMission.toLowerCase().includes(q)
  );

  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);

  const response: PaginatedResponse<DebrisObject> = { items, total, page, limit };
  res.json(response);
});

router.get("/:id", (req, res) => {
  const debris = debrisObjects.find(d => d.id === req.params.id);
  if (!debris) throw new AppError(404, "NOT_FOUND", `Debris ${req.params.id} not found`);
  res.json(debris);
});

router.get("/:id/geometry", (req, res) => {
  const debris = debrisObjects.find(d => d.id === req.params.id);
  if (!debris) throw new AppError(404, "NOT_FOUND", `Debris ${req.params.id} not found`);
  const ring = ringFromElements(debris.elements);
  res.json({
    id: debris.id,
    noradId: debris.noradId,
    type: debris.type,
    orbitalElements: debris.elements,
    orbitRing: ring,
  });
});

router.get("/:id/conjunctions", (req, res) => {
  const debris = debrisObjects.find(d => d.id === req.params.id);
  if (!debris) throw new AppError(404, "NOT_FOUND", `Debris ${req.params.id} not found`);
  const related = conjunctions.filter(c => c.objectId === debris.id);
  res.json(related);
});

export default router;
