/* SOS — SafeOrbitForSattelites · Tracking API routes
 *
 * Endpoints:
 *   GET /api/v1/tracking/fleet        — cached TLE fleet + cache status
 *   GET /api/v1/tracking/status       — data-source freshness / propagation status
 *   GET /api/v1/tracking/:noradId/position      — propagated position at current UTC (or ?at=ISO)
 *   GET /api/v1/tracking/:noradId/trajectory     — predicted orbit trail (?steps=180&step=300)
 *
 * The frontend fetches the fleet TLE set ONCE (and on refresh), then
 * propagates positions locally every second.  These endpoints are the
 * authoritative source of orbital elements; position endpoints are provided
 * for server-side validation and future conjunction screening.
 */

import { Router } from "express";
import { getCachedFleet, getCacheStatus, refreshFleetTles } from "../services/tle-fetcher.js";
import { propagateAt, propagateTrajectory } from "../services/propagator.js";
import { AppError } from "../middleware/error.js";

const router = Router();

/* GET /api/v1/tracking/fleet — returns cached TLEs for the whole fleet. */
router.get("/fleet", (_req, res) => {
  const tles = getCachedFleet();
  const status = getCacheStatus();
  res.json({
    status: status.status,
    fetchedAt: status.fetchedAt,
    newestEpoch: status.newestEpoch,
    count: status.count,
    okCount: status.okCount,
    satellites: tles.map((t) => ({
      noradId: t.noradId,
      name: t.name,
      alias: t.alias,
      operator: t.operator,
      category: t.category,
      source: t.source,
      line1: t.line1,
      line2: t.line2,
      epoch: t.epoch,
      fetchedAt: t.fetchedAt,
      ok: t.ok,
    })),
  });
});

/* GET /api/v1/tracking/status — data-source freshness. */
router.get("/status", (_req, res) => {
  const status = getCacheStatus();
  res.json({
    ...status,
    propagation: "active",
    message:
      status.status === "ok" ? "Orbital data available · propagation active" :
      status.status === "initializing" ? "Loading orbital data…" :
      status.status === "stale" ? "Orbital data stale" :
      "Orbital data source unavailable",
  });
});

/* GET /api/v1/tracking/:noradId/position — propagated position. */
router.get("/:noradId/position", async (req, res) => {
  const noradId = parseInt(req.params.noradId, 10);
  if (isNaN(noradId)) throw new AppError(400, "BAD_REQUEST", "Invalid NORAD id");
  const tles = getCachedFleet();
  const tle = tles.find((t) => t.noradId === noradId);
  if (!tle) throw new AppError(404, "NOT_FOUND", `NORAD ${noradId} not in fleet`);
  if (!tle.ok || !tle.line1) {
    res.status(503).json({ error: { code: "NO_TLE", message: "Orbital data unavailable for this satellite" } });
    return;
  }
  const atParam = req.query.at as string | undefined;
  const when = atParam ? new Date(atParam) : new Date();
  const result = await propagateAt(noradId, tle.name, tle.line1, tle.line2, tle.epoch, when);
  if (!result.ok || !result.state) {
    res.status(503).json({ error: { code: "PROPAGATION_ERROR", message: result.error || "Propagation failed" } });
    return;
  }
  res.json(result.state);
});

/* GET /api/v1/tracking/:noradId/trajectory — predicted orbit trail. */
router.get("/:noradId/trajectory", async (req, res) => {
  const noradId = parseInt(req.params.noradId, 10);
  if (isNaN(noradId)) throw new AppError(400, "BAD_REQUEST", "Invalid NORAD id");
  const tles = getCachedFleet();
  const tle = tles.find((t) => t.noradId === noradId);
  if (!tle) throw new AppError(404, "NOT_FOUND", `NORAD ${noradId} not in fleet`);
  if (!tle.ok || !tle.line1) {
    res.status(503).json({ error: { code: "NO_TLE", message: "Orbital data unavailable for this satellite" } });
    return;
  }
  const steps = Math.min(parseInt(req.query.steps as string) || 180, 720);
  const stepSec = Math.min(parseInt(req.query.step as string) || 300, 3600);
  const atParam = req.query.at as string | undefined;
  const when = atParam ? new Date(atParam) : new Date();
  const result = await propagateTrajectory(noradId, tle.name, tle.line1, tle.line2, tle.epoch, when, steps, stepSec);
  if (!result.ok) {
    res.status(503).json({ error: { code: "PROPAGATION_ERROR", message: result.error || "Trajectory generation failed" } });
    return;
  }
  res.json({ noradId, name: tle.name, points: result.points });
});

/* POST /api/v1/tracking/refresh — manually trigger a TLE refresh. */
router.post("/refresh", async (_req, res) => {
  await refreshFleetTles();
  res.json(getCacheStatus());
});

export default router;
