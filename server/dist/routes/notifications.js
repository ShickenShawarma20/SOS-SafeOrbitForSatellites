"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_js_1 = require("../data/notifications.js");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    const unread = req.query.unread;
    let items = [...notifications_js_1.notifications];
    if (unread === "true")
        items = items.filter(n => !n.read);
    res.json(items);
});
router.post("/:id/read", (req, res) => {
    const n = notifications_js_1.notifications.find(n => n.id === req.params.id);
    if (!n)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Notification ${req.params.id} not found`);
    n.read = true;
    res.json(n);
});
router.post("/read-all", (req, res) => {
    notifications_js_1.notifications.forEach(n => { n.read = true; });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=notifications.js.map