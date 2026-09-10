import { Router } from "express";
import type { GroundStation } from "../types.js";

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
  aiConfig: {
    conjunctionScreening: true,
    continuousRiskAssessment: true,
    maneuverRecommendations: true,
    automaticSimulation: true,
    autonomousExecution: false,
    thresholds: {
      criticalPc: 1e-4,
      highRiskPc: 1e-5,
      minimumMissDistanceM: 1000,
      maximumPredictionHorizonH: 72,
      minimumDataConfidence: 0.8,
    },
  },
};

router.get("/", (req, res) => {
  res.json(settings);
});

router.put("/", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

router.get("/coverage", (req, res) => {
  const gs: GroundStation[] = require("../data/groundstations.ts").groundStations;
  const online = gs.filter((s) => s.status === "online");
  const total = gs.length;
  const coveragePct = Math.round((online.length / total) * 100);
  res.json({
    totalStations: total,
    onlineStations: online.length,
    coveragePct,
    stations: online.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon })),
  });
});

export default router;
