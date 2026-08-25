"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const satellites_js_1 = require("../data/satellites.js");
const debris_js_1 = require("../data/debris.js");
const conjunctions_js_1 = require("../data/conjunctions.js");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    const q = (req.query.q || "").toLowerCase();
    if (!q) {
        res.json({ satellites: [], objects: [], conjunctions: [] });
        return;
    }
    const matchedSatellites = satellites_js_1.satellites.filter(s => s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.noradId.toString().includes(q));
    const matchedObjects = debris_js_1.debrisObjects.filter(o => o.id.toLowerCase().includes(q) ||
        (o.noradId && o.noradId.toString().includes(q)));
    const matchedConjunctions = conjunctions_js_1.conjunctions.filter(c => c.id.toLowerCase().includes(q) ||
        c.satelliteId.toLowerCase().includes(q) ||
        c.objectId.toLowerCase().includes(q));
    res.json({
        satellites: matchedSatellites,
        objects: matchedObjects,
        conjunctions: matchedConjunctions,
    });
});
exports.default = router;
//# sourceMappingURL=search.js.map