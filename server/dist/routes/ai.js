"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_js_1 = require("../middleware/error.js");
const jobs_js_1 = require("./jobs.js");
const ai_js_1 = require("../data/ai.js");
const router = (0, express_1.Router)();
/* ---------- overview ---------- */
router.get("/overview", (_req, res) => {
    res.json((0, ai_js_1.aiOverview)());
});
/* ---------- assessments ---------- */
router.get("/assessments", (req, res) => {
    const risk = req.query.risk;
    let items = [...ai_js_1.aiAssessments];
    if (risk)
        items = items.filter((a) => a.riskLevel === risk.toUpperCase());
    items.sort((a, b) => b.confidence - a.confidence);
    res.json({ items, total: ai_js_1.aiAssessments.length });
});
router.get("/assessments/:id", (req, res) => {
    const a = ai_js_1.aiAssessments.find((x) => x.id === req.params.id);
    if (!a)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Assessment ${req.params.id} not found`);
    res.json(a);
});
/* ---------- recommendations ---------- */
router.get("/recommendations", (req, res) => {
    const onlyValidated = req.query.validated === "true";
    let items = [...ai_js_1.aiRecommendations];
    if (onlyValidated)
        items = items.filter((r) => r.safetyValidation.status === "validated");
    res.json({ items, total: ai_js_1.aiRecommendations.length });
});
router.get("/recommendations/:id", (req, res) => {
    const r = ai_js_1.aiRecommendations.find((x) => x.id === req.params.id);
    if (!r)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Recommendation ${req.params.id} not found`);
    res.json(r);
});
/* ---------- activity / health / data quality ---------- */
router.get("/activity", (_req, res) => {
    res.json(ai_js_1.aiActivity);
});
router.get("/health", (_req, res) => {
    res.json(ai_js_1.aiModelHealth);
});
router.get("/data-quality", (_req, res) => {
    res.json(ai_js_1.aiDataQuality);
});
/* ---------- risk map ---------- */
router.get("/risk-map", (req, res) => {
    const risk = req.query.risk;
    const altMax = req.query.altMax ? parseInt(req.query.altMax) : Infinity;
    let points = ai_js_1.riskMapPoints.filter((p) => p.altitudeKm <= altMax);
    let conj = ai_js_1.riskMapConjunctions;
    if (risk) {
        points = points.filter((p) => p.riskLevel === risk.toUpperCase() || p.riskLevel === "none");
        conj = conj.filter((c) => c.riskLevel === risk.toUpperCase());
    }
    res.json({ points, conjunctions: conj });
});
/* ---------- simulation ---------- */
router.post("/simulate", (req, res) => {
    const { recommendationId, planId } = req.body || {};
    const rec = ai_js_1.aiRecommendations.find((r) => r.id === recommendationId);
    if (!rec)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Recommendation ${recommendationId} not found`);
    const plan = rec.candidates.find((c) => c.planId === planId) || rec.candidates.find((c) => c.recommended);
    if (!plan)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Plan ${planId} not found`);
    const jobId = `AISIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    (0, jobs_js_1.registerJob)({
        id: jobId,
        planId: plan.planId,
        status: "queued",
        progress: 0,
        stage: "queued",
        createdAt: new Date().toISOString(),
    });
    res.json({ jobId, planId: plan.planId, label: plan.label, recommendationId });
});
/* ---------- invalidate a recommendation (new tracking data) ---------- */
router.post("/recommendations/:id/invalidate", (req, res) => {
    const r = ai_js_1.aiRecommendations.find((x) => x.id === req.params.id);
    if (!r)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Recommendation ${req.params.id} not found`);
    r.status = "invalidated";
    res.json(r);
});
/* ---------- AI flight-directive assessment (existing) ---------- */
router.post("/assess", (req, res) => {
    const { conjunctionId } = req.body || {};
    if (!conjunctionId)
        throw new error_js_1.AppError(400, "INVALID_INPUT", "conjunctionId is required");
    const rec = ai_js_1.aiRecommendations.find((r) => r.conjunctionId === conjunctionId) || ai_js_1.aiRecommendations[0];
    const plan = rec?.candidates.find((c) => c.recommended) || rec?.candidates[0];
    const directive = {
        conjunctionId,
        flightDirective: "MANEUVER_RECOMMENDED",
        burnEpoch: plan?.burnWindow.earliest || new Date(Date.now() + 3600000 * 2).toISOString(),
        deltaVVect: [0.42, 0.0, -0.15],
        deltaVMagMps: plan?.deltaVmps ?? 0.42,
        urgencyClass: "HIGH",
        telecommandChecklist: [
            "Verify orbital elements and propagation uncertainty",
            "Upload maneuver sequence to flight computer",
            "Confirm ground station visibility during burn window",
            "Execute pre-burn attitude pointing maneuver",
            "Arm propulsion system and verify pressure/temperature",
            "Execute burn at T-CA minus 3 hours",
            "Post-burn attitude stabilization",
            "Upload recovery maneuver plan",
        ],
        confidenceScore: rec?.confidence ?? 0.94,
        rationale: rec?.summary ?? "Maneuver recommended to reduce collision probability below threshold.",
    };
    res.json(directive);
});
/* ---------- AI chat assistant (existing) ---------- */
router.post("/chat", (req, res) => {
    const { sessionId, message } = req.body || {};
    if (!message)
        throw new error_js_1.AppError(400, "INVALID_INPUT", "message is required");
    const responses = {
        default: "Based on current orbital mechanics analysis, the recommended approach for conjunction CD-2024-0526-0417 involves a prograde maneuver with a delta-V of 0.42 m/s. This will shift the orbital period by approximately 0.3 seconds, resulting in a miss distance improvement from 742m to 2.45km at the time of closest approach.",
        maneuver: "The recommended burn window is between 2024-05-26T02:10:00Z and 2024-05-26T02:45:00Z. A prograde burn direction is optimal given the relative geometry of the two objects. The burn duration will be approximately 154 seconds with a thrust of 1.1 N.",
        risk: "Current collision probability is 2.8\u00d710^-4, which exceeds the 10^-4 maneuver threshold. The combined uncertainty is 1.28 km. With the recommended maneuver, the post-burn Pc drops to 2.2\u00d710^-6, a 92.1% risk reduction.",
        fuel: "The proposed maneuver will consume approximately 12.4 kg of fuel (0.08% of remaining fuel). Current fuel reserves are 154.8 kg total / 121.0 kg usable. End-of-life estimate remains 2029 Q3 after maneuver execution.",
    };
    const lowerMsg = message.toLowerCase();
    let response = responses.default;
    if (lowerMsg.includes("maneuver") || lowerMsg.includes("burn"))
        response = responses.maneuver;
    else if (lowerMsg.includes("risk") || lowerMsg.includes("collision"))
        response = responses.risk;
    else if (lowerMsg.includes("fuel") || lowerMsg.includes("propellant"))
        response = responses.fuel;
    res.json({
        sessionId: sessionId || `session-${Date.now()}`,
        response,
        model: "astro-assist-v1",
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=ai.js.map