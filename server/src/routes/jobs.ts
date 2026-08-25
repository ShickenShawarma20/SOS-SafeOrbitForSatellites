import { Router } from "express";
import type { SimulationJob } from "../types.js";
import { AppError } from "../middleware/error.js";

const router = Router();
const jobs = new Map<string, SimulationJob>();

router.get("/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) throw new AppError(404, "NOT_FOUND", `Job ${req.params.id} not found`);

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

export function registerJob(job: SimulationJob) {
  jobs.set(job.id, job);
}

export default router;
