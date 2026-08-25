"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const events_js_1 = require("../data/events.js");
const router = (0, express_1.Router)();
router.get("/feed", (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    res.json(events_js_1.feedEvents.slice(0, limit));
});
exports.default = router;
//# sourceMappingURL=events.js.map