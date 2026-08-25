"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/kpis", (req, res) => {
    res.json({
        activeSatellites: 124,
        conjunctionAlerts: 12,
        maneuversPlanned: 3,
        systemHealthPct: 98,
        trackingSourcesOnline: 32,
        dataLatencySec: 1.2,
        coveragePct: 98.7,
    });
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map