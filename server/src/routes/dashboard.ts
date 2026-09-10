import { Router } from "express";
import type { Satellite, Conjunction, CdmRecord, ManeuverPlan } from "../types.js";
import { satellites } from "../data/satellites.js";
import { debrisObjects } from "../data/debris.js";
import { conjunctions, cdmRecords } from "../data/conjunctions.js";
import { ISRO_FLEET } from "../data/isro-fleet.js";
import { getCachedFleet, getCacheStatus } from "../services/tle-fetcher.js";
import { maneuverPlans } from "../data/maneuvers.js";
import { groundStations } from "../data/groundstations.js";

const router = Router();

function satStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "operational") return "#10b981";
  if (s === "degraded") return "#f59e0b";
  if (s === "standby") return "#eab308";
  return "#6b7280";
}

router.get("/kpis", (req, res) => {
  const now = new Date();

  /* --- Active satellites (online/operational from fleet cache) --- */
  const cachedFleet = getCachedFleet();
  const onlineSatCount = cachedFleet.filter((t) => t.ok).length;
  const totalFleetCount = ISRO_FLEET.length;

  /* --- Real conjunction alerts (unacknowledged, upcoming) --- */
  const tcaCutoff = new Date(Date.now() + 48 * 3600 * 1000);
  const activeConjunctions = conjunctions.filter((c) => !c.acknowledged && new Date(c.tca) <= tcaCutoff);
  const criticalAlerts = activeConjunctions.filter((c) => c.severity === "critical").length;
  const highAlerts = activeConjunctions.filter((c) => c.severity === "high").length;
  const mediumAlerts = activeConjunctions.filter((c) => c.severity === "medium").length;

  /* --- Maneuvers in progress / planned --- */
  const plannedManeuvers = maneuverPlans.filter((p) => p.approvalStatus !== "executed").length;

  /* --- System health from TLE cache quality --- */
  const okCount = cachedFleet.filter((t) => t.ok).length;
  const systemHealthPct = totalFleetCount > 0 ? Math.round((okCount / totalFleetCount) * 100) : 100;

  /* --- Tracking sources online (ground stations) --- */
  const trackingSourcesOnline = groundStations.filter((gs) => gs.status === "online").length;

  /* --- Data latency from freshest TLE epoch --- */
  let dataLatencySec = 1.2;
  const newestEpoch = getCacheStatus().newestEpoch;
  if (newestEpoch) {
    dataLatencySec = Math.max(0, (now.getTime() - new Date(newestEpoch).getTime()) / 1000);
  }

  /* --- Coverage percentage from ground station footprint --- */
  const coveragePct = trackingSourcesOnline > 0 ? Math.round((trackingSourcesOnline / groundStations.length) * 100) : 100;

  res.json({
    activeSatellites: onlineSatCount,
    conjunctionAlerts: criticalAlerts + highAlerts + mediumAlerts,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    maneuversPlanned: plannedManeuvers,
    systemHealthPct,
    trackingSourcesOnline,
    dataLatencySec: dataLatencySec.toFixed(1),
    coveragePct,
  });
});

export default router;
