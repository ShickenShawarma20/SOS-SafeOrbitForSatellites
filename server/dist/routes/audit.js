"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_js_1 = require("../data/audit.js");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json(audit_js_1.auditLog);
});
exports.default = router;
//# sourceMappingURL=audit.js.map