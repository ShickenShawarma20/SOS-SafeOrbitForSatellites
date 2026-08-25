import { Router } from "express";
import { debrisObjects } from "../data/debris.js";

const router = Router();

router.get("/stats", (req, res) => {
  res.json({
    trackedObjects: 21430,
    lastTleUpdate: "2024-05-26T04:11:00Z",
  });
});

router.get("/", (req, res) => {
  const q = (req.query.q as string || "").toLowerCase();
  const regime = req.query.regime as string | undefined;
  const type = req.query.type as string | undefined;

  let items = [...debrisObjects];
  if (q) items = items.filter(o =>
    o.id.toLowerCase().includes(q) ||
    (o.noradId && o.noradId.toString().includes(q))
  );
  if (type) items = items.filter(o => o.type === type);
  if (regime) items = items.filter(o => {
    const alt = o.elements.altitudeKm;
    if (regime === "LEO") return alt < 2000;
    if (regime === "MEO") return alt >= 2000 && alt < 35786;
    if (regime === "GEO") return alt >= 35786 && alt <= 35786;
    if (regime === "HEO") return o.elements.eccentricity > 0.1;
    return true;
  });
  res.json(items);
});

export default router;
