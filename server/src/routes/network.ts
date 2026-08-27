import { Router } from "express";
import { groundStations } from "../data/groundstations.js";

const router = Router();

router.get("/status", (req, res) => {
  const online = groundStations.filter(g => g.status === "online").length;
  const offline = groundStations.filter(g => g.status === "offline").length;
  const total = groundStations.length;
  // Coverage estimate: fraction of stations online, scaled to a realistic
  // global-coverage figure (more stations → higher coverage).
  const coveragePct = total > 0
    ? Math.round((online / total) * 1000) / 10
    : 0;
  // Simulated average latency (lower with more online stations).
  const latencySec = Math.max(0.4, Math.round((1.5 - online * 0.02) * 10) / 10);
  res.json({
    stationsOnline: online,
    stationsOffline: offline,
    coveragePct,
    latencySec,
  });
});

router.get("/groundstations", (req, res) => {
  res.json(groundStations);
});

router.get("/", (req, res) => {
  res.json(groundStations);
});

export default router;
