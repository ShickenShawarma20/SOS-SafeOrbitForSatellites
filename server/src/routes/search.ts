import { Router } from "express";
import { satellites } from "../data/satellites.js";
import { debrisObjects } from "../data/debris.js";
import { conjunctions } from "../data/conjunctions.js";

const router = Router();

router.get("/", (req, res) => {
  const q = (req.query.q as string || "").toLowerCase();
  if (!q) {
    res.json({ satellites: [], objects: [], conjunctions: [] });
    return;
  }

  const matchedSatellites = satellites.filter(s =>
    s.id.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.noradId.toString().includes(q)
  );

  const matchedObjects = debrisObjects.filter(o =>
    o.id.toLowerCase().includes(q) ||
    (o.noradId && o.noradId.toString().includes(q))
  );

  const matchedConjunctions = conjunctions.filter(c =>
    c.id.toLowerCase().includes(q) ||
    c.satelliteId.toLowerCase().includes(q) ||
    c.objectId.toLowerCase().includes(q)
  );

  res.json({
    satellites: matchedSatellites,
    objects: matchedObjects,
    conjunctions: matchedConjunctions,
  });
});

export default router;
