"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maneuvers_js_1 = require("../data/maneuvers.js");
const error_js_1 = require("../middleware/error.js");
const jobs_js_1 = require("./jobs.js");
const router = (0, express_1.Router)();
router.get("/next", (req, res) => {
    const next = maneuvers_js_1.maneuverPlans
        .filter(p => p.approvalStatus === "draft" || p.approvalStatus === "approved")
        .sort((a, b) => {
        if (a.recommended !== b.recommended)
            return a.recommended ? -1 : 1;
        return new Date(a.burnWindow.earliest).getTime() - new Date(b.burnWindow.earliest).getTime();
    })[0];
    if (!next)
        throw new error_js_1.AppError(404, "NOT_FOUND", "No upcoming maneuvers");
    res.json(next);
});
router.get("/plans", (req, res) => {
    const conjunctionId = req.query.conjunctionId;
    let plans = [...maneuvers_js_1.maneuverPlans];
    if (conjunctionId)
        plans = plans.filter(p => p.conjunctionId === conjunctionId);
    res.json(plans);
});
router.get("/plans/:planId", (req, res) => {
    const plan = maneuvers_js_1.maneuverPlans.find(p => p.id === req.params.planId);
    if (!plan)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
    res.json(plan);
});
router.post("/simulate", (req, res) => {
    const { planId } = req.body || {};
    const plan = maneuvers_js_1.maneuverPlans.find(p => p.id === planId);
    if (!plan)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Plan ${planId} not found`);
    const jobId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const job = {
        id: jobId,
        planId,
        status: "queued",
        progress: 0,
        stage: "queued",
        createdAt: new Date().toISOString(),
    };
    (0, jobs_js_1.registerJob)(job);
    res.json({ jobId });
});
router.post("/plans/:planId/submit", (req, res) => {
    const plan = maneuvers_js_1.maneuverPlans.find(p => p.id === req.params.planId);
    if (!plan)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
    plan.approvalStatus = "pending_approval";
    res.json(plan);
});
router.get("/plans/:planId/export", (req, res) => {
    const plan = maneuvers_js_1.maneuverPlans.find(p => p.id === req.params.planId);
    if (!plan)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
    res.json({ format: req.query.format || "json", plan });
});
exports.default = router;
//# sourceMappingURL=maneuvers.js.map