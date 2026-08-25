"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
router.post("/assess", (req, res) => {
    const { conjunctionId } = req.body || {};
    if (!conjunctionId) {
        throw new error_js_1.AppError(400, "INVALID_INPUT", "conjunctionId is required");
    }
    const directive = {
        conjunctionId,
        flightDirective: "MANEUVER_RECOMMENDED",
        burnEpoch: new Date(Date.now() + 3600000 * 2).toISOString(),
        deltaVVect: [0.42, 0.0, -0.15],
        deltaVMagMps: 0.45,
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
        confidenceScore: 0.94,
        rationale: "Pc exceeds 10^-4 threshold. Prograde burn at T-CA-3h provides 2.45 km miss distance with 92.1% risk reduction. Burn window maintains Svalbard ground station visibility for real-time monitoring.",
    };
    res.json(directive);
});
router.post("/chat", (req, res) => {
    const { sessionId, message } = req.body || {};
    if (!message) {
        throw new error_js_1.AppError(400, "INVALID_INPUT", "message is required");
    }
    const responses = {
        default: "Based on current orbital mechanics analysis, the recommended approach for conjunction CD-2024-0526-0417 involves a prograde maneuver with a delta-V of 0.42 m/s. This will shift the orbital period by approximately 0.3 seconds, resulting in a miss distance improvement from 742m to 2.45km at the time of closest approach.",
        maneuver: "The recommended burn window is between 2024-05-26T02:10:00Z and 2024-05-26T02:45:00Z. A prograde burn direction is optimal given the relative geometry of the two objects. The burn duration will be approximately 154 seconds with a thrust of 1.1 N.",
        risk: "Current collision probability is 2.8×10^-4, which exceeds the 10^-4 maneuver threshold. The combined uncertainty is 1.28 km. With the recommended maneuver, the post-burn Pc drops to 2.2×10^-6, a 92.1% risk reduction.",
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