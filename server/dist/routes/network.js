"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groundstations_js_1 = require("../data/groundstations.js");
const router = (0, express_1.Router)();
router.get("/status", (req, res) => {
    const online = groundstations_js_1.groundStations.filter(g => g.status === "online").length;
    const offline = groundstations_js_1.groundStations.filter(g => g.status === "offline").length;
    res.json({
        stationsOnline: online,
        stationsOffline: offline,
        coveragePct: 98.7,
        latencySec: 1.2,
    });
});
router.get("/groundstations", (req, res) => {
    res.json(groundstations_js_1.groundStations);
});
router.get("/", (req, res) => {
    res.json(groundstations_js_1.groundStations);
});
exports.default = router;
//# sourceMappingURL=network.js.map