import { Router } from "express";

const router = Router();

let settings: Record<string, unknown> = {
  alertThresholds: {
    criticalPc: 1e-4,
    highPc: 1e-5,
    mediumPc: 1e-6,
    lowPc: 1e-7,
    missDistanceWarningM: 1000,
    missDistanceCriticalM: 500,
  },
  screeningVolumes: {
    leo: [10, 10, 10],
    meo: [25, 25, 25],
    geo: [50, 50, 50],
    heo: [30, 30, 30],
  },
  notificationPrefs: {
    email: true,
    desktop: true,
    criticalOnly: false,
    digestIntervalHours: 4,
  },
  layerDefaults: {
    showTrajectory: true,
    showDebris: true,
    showConjunction: true,
    showGroundStations: true,
    showCoverage: false,
  },
};

router.get("/", (req, res) => {
  res.json(settings);
});

router.put("/", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

export default router;
