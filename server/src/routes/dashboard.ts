import { Router } from "express";

const router = Router();

router.get("/kpis", (req, res) => {
  res.json({
    activeSatellites: 124,
    conjunctionAlerts: 12,
    maneuversPlanned: 3,
    systemHealthPct: 98,
    trackingSourcesOnline: 32,
    dataLatencySec: 1.2,
    coveragePct: 98.7,
  });
});

export default router;
