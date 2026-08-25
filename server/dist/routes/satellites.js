"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const satellites_js_1 = require("../data/satellites.js");
const conjunctions_js_1 = require("../data/conjunctions.js");
const events_js_1 = require("../data/events.js");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status;
    const type = req.query.type;
    const q = (req.query.q || "").toLowerCase();
    let filtered = [...satellites_js_1.satellites];
    if (status)
        filtered = filtered.filter(s => s.status === status);
    if (type)
        filtered = filtered.filter(s => s.type.toLowerCase().includes(type.toLowerCase()));
    if (q)
        filtered = filtered.filter(s => s.id.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.noradId.toString().includes(q));
    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    const response = { items, total, page, limit };
    res.json(response);
});
router.get("/:id", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    res.json(sat);
});
router.get("/:id/conjunctions", (req, res) => {
    const { id } = req.params;
    const severity = req.query.severity;
    const active = req.query.active === "true";
    let items = conjunctions_js_1.conjunctions.filter(c => c.satelliteId === id);
    if (severity)
        items = items.filter(c => c.severity === severity);
    if (active)
        items = items.filter(c => {
            const tca = new Date(c.tca);
            return tca > new Date() || c.acknowledged === false;
        });
    res.json(items);
});
router.get("/:id/tle", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    res.json({
        line1: sat.elements.tle.line1,
        line2: sat.elements.tle.line2,
        epoch: sat.elements.tle.epoch,
    });
});
router.get("/:id/subsystems", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    res.json(sat.subsystems);
});
router.get("/:id/events", (req, res) => {
    const items = events_js_1.feedEvents.filter(e => e.satelliteId === req.params.id);
    res.json(items);
});
router.get("/:id/passes", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    const hours = parseInt(req.query.hours) || 24;
    const stationNames = ["Svalbard", "Fairbanks", "Wallops", "Santiago", "Pine Gap", "Kwajalein", "Misawa"];
    const now = new Date();
    const passes = Array.from({ length: Math.min(hours, 12) }, (_, i) => {
        const aosOffset = (i + 1) * (hours / Math.min(hours, 12)) * 3600 * 1000;
        const aos = new Date(now.getTime() + aosOffset);
        const durationSec = 300 + Math.floor(Math.random() * 600);
        const los = new Date(aos.getTime() + durationSec * 1000);
        return {
            id: `PASS-${req.params.id}-${i}`,
            satelliteId: req.params.id,
            stationName: stationNames[i % stationNames.length],
            aos: aos.toISOString(),
            los: los.toISOString(),
            durationSec,
            maxElevationDeg: Math.round(20 + Math.random() * 70),
        };
    });
    res.json(passes);
});
router.get("/:id/telemetry/latest", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    res.json({
        satelliteId: req.params.id,
        timestamp: new Date().toISOString(),
        position: sat.elements.eciPosition,
        velocity: sat.elements.eciVelocity,
        temperatures: {
            battery: 22.5,
            solar_panel: 45.2,
            avionics: 18.7,
            propulsion: 15.3,
        },
        power: {
            solarGenerationW: 420,
            batteryChargeW: 380,
            loadW: 310,
            batteryPct: sat.fuel.pctRemaining,
        },
    });
});
router.get("/:id/track", (req, res) => {
    const sat = satellites_js_1.satellites.find(s => s.id === req.params.id);
    if (!sat)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Satellite ${req.params.id} not found`);
    const pos = sat.elements.eciPosition || [0, 0, 0];
    const vel = sat.elements.eciVelocity || [0, 0, 0];
    const stepSec = parseInt(req.query.step || "60") || 60;
    const totalPoints = Math.floor(24 * 3600 / stepSec);
    const points = Array.from({ length: Math.min(totalPoints, 1440) }, (_, i) => {
        const t = i * stepSec;
        const angle = (t / sat.elements.periodMin / 60) * 2 * Math.PI;
        return {
            time: new Date(Date.now() + t * 1000).toISOString(),
            position: [
                pos[0] * Math.cos(angle) - pos[1] * Math.sin(angle),
                pos[0] * Math.sin(angle) + pos[1] * Math.cos(angle),
                pos[2] * Math.cos(angle * 0.1),
            ],
            velocity: [
                vel[0] * Math.cos(angle) - vel[1] * Math.sin(angle),
                vel[0] * Math.sin(angle) + vel[1] * Math.cos(angle),
                vel[2] * Math.cos(angle * 0.1),
            ],
        };
    });
    res.json({ satelliteId: req.params.id, points });
});
router.get("/:id/files", (req, res) => {
    const fileTypes = ["ICD", "Manual", "SOP", "Calibration", "Spec Sheet", "Test Report", "Requirement", "Design Doc", "Interface Control", "Procedure"];
    const files = Array.from({ length: 23 }, (_, i) => ({
        id: `FILE-${String(i + 1).padStart(3, "0")}`,
        name: `${req.params.id}_${fileTypes[i % fileTypes.length].replace(/\s+/g, "_")}_v${Math.floor(i / 5) + 1}.${i % 3 === 0 ? "pdf" : i % 3 === 1 ? "docx" : "xlsx"}`,
        type: i % 3 === 0 ? "pdf" : i % 3 === 1 ? "docx" : "xlsx",
        size: Math.round(50000 + Math.random() * 500000),
        uploadedAt: new Date(Date.now() - i * 86400000 * (1 + Math.random() * 30)).toISOString(),
    }));
    res.json(files);
});
exports.default = router;
//# sourceMappingURL=satellites.js.map