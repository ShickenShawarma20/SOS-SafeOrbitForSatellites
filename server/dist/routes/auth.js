"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
let currentOperator = {
    name: "Alex Morgan",
    role: "Mission Controller",
    initials: "AM",
};
router.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        throw new error_js_1.AppError(400, "INVALID_INPUT", "Username and password are required");
    }
    const token = `so-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    res.json({
        token,
        operator: currentOperator,
    });
});
router.post("/logout", (req, res) => {
    res.json({ success: true });
});
router.get("/me", (req, res) => {
    res.json(currentOperator);
});
exports.default = router;
//# sourceMappingURL=auth.js.map