"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tle_fetcher_js_1 = require("../services/tle-fetcher.js");
const propagator_js_1 = require("../services/propagator.js");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
/* GET /api/v1/tracking/fleet — returns cached TLEs for the whole fleet. */
router.get("/fleet", (_req, res) => {
    const tles = (0, tle_fetcher_js_1.getCachedFleet)();
    const status = (0, tle_fetcher_js_1.getCacheStatus)();
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
    const status = (0, tle_fetcher_js_1.getCacheStatus)();
    res.json({
        ...status,
        propagation: "active",
        message: status.status === "ok" ? "Orbital data available · propagation active" :
            status.status === "initializing" ? "Loading orbital data…" :
                status.status === "stale" ? "Orbital data stale" :
                    "Orbital data source unavailable",
    });
});
/* GET /api/v1/tracking/:noradId/position — propagated position. */
router.get("/:noradId/position", async (req, res) => {
    const noradId = parseInt(req.params.noradId, 10);
    if (isNaN(noradId))
        throw new error_js_1.AppError(400, "BAD_REQUEST", "Invalid NORAD id");
    const tles = (0, tle_fetcher_js_1.getCachedFleet)();
    const tle = tles.find((t) => t.noradId === noradId);
    if (!tle)
        throw new error_js_1.AppError(404, "NOT_FOUND", `NORAD ${noradId} not in fleet`);
    if (!tle.ok || !tle.line1) {
        res.status(503).json({ error: { code: "NO_TLE", message: "Orbital data unavailable for this satellite" } });
        return;
    }
    const atParam = req.query.at;
    const when = atParam ? new Date(atParam) : new Date();
    const result = await (0, propagator_js_1.propagateAt)(noradId, tle.name, tle.line1, tle.line2, tle.epoch, when);
    if (!result.ok || !result.state) {
        res.status(503).json({ error: { code: "PROPAGATION_ERROR", message: result.error || "Propagation failed" } });
        return;
    }
    res.json(result.state);
});
/* GET /api/v1/tracking/:noradId/trajectory — predicted orbit trail. */
router.get("/:noradId/trajectory", async (req, res) => {
    const noradId = parseInt(req.params.noradId, 10);
    if (isNaN(noradId))
        throw new error_js_1.AppError(400, "BAD_REQUEST", "Invalid NORAD id");
    const tles = (0, tle_fetcher_js_1.getCachedFleet)();
    const tle = tles.find((t) => t.noradId === noradId);
    if (!tle)
        throw new error_js_1.AppError(404, "NOT_FOUND", `NORAD ${noradId} not in fleet`);
    if (!tle.ok || !tle.line1) {
        res.status(503).json({ error: { code: "NO_TLE", message: "Orbital data unavailable for this satellite" } });
        return;
    }
    const steps = Math.min(parseInt(req.query.steps) || 180, 720);
    const stepSec = Math.min(parseInt(req.query.step) || 300, 3600);
    const atParam = req.query.at;
    const when = atParam ? new Date(atParam) : new Date();
    const result = await (0, propagator_js_1.propagateTrajectory)(noradId, tle.name, tle.line1, tle.line2, tle.epoch, when, steps, stepSec);
    if (!result.ok) {
        res.status(503).json({ error: { code: "PROPAGATION_ERROR", message: result.error || "Trajectory generation failed" } });
        return;
    }
    res.json({ noradId, name: tle.name, points: result.points });
});
/* POST /api/v1/tracking/refresh — manually trigger a TLE refresh. */
router.post("/refresh", async (_req, res) => {
    await (0, tle_fetcher_js_1.refreshFleetTles)();
    res.json((0, tle_fetcher_js_1.getCacheStatus)());
});
exports.default = router;
//# sourceMappingURL=tracking.js.map