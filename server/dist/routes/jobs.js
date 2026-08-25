"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerJob = registerJob;
const express_1 = require("express");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
const jobs = new Map();
router.get("/:id", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job)
        throw new error_js_1.AppError(404, "NOT_FOUND", `Job ${req.params.id} not found`);
    const created = new Date(job.createdAt).getTime();
    const elapsed = (Date.now() - created) / 1000;
    if (job.status === "queued" && elapsed > 2) {
        job.status = "running";
        job.progress = 20;
        job.stage = "propagating";
    }
    if (job.status === "running" && elapsed > 5) {
        job.progress = 60;
        job.stage = "conjunction筛查";
    }
    if (job.status === "running" && elapsed > 8) {
        job.status = "completed";
        job.progress = 100;
        job.stage = "completed";
        job.completedAt = new Date().toISOString();
    }
    res.json(job);
});
function registerJob(job) {
    jobs.set(job.id, job);
}
exports.default = router;
//# sourceMappingURL=jobs.js.map