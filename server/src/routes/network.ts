import { Router } from "express";
import { groundStations } from "../data/groundstations.js";

const router = Router();

router.get("/status", (req, res) => {
  const online = groundStations.filter(g => g.status === "online").length;
  const offline = groundStations.filter(g => g.status === "offline").length;
  res.json({
    stationsOnline: online,
    stationsOffline: offline,
    coveragePct: 98.7,
    latencySec: 1.2,
  });
});

router.get("/groundstations", (req, res) => {
  res.json(groundStations);
});

router.get("/", (req, res) => {
  res.json(groundStations);
});

export default router;
