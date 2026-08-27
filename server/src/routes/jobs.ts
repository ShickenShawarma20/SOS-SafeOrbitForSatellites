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

  // Progress through realistic simulation stages
  if (job.status === "queued" && elapsed > 1.5) {
    job.status = "running";
    job.progress = 15;
    job.stage = "loading ephemeris";
  }
  if (job.status === "running" && elapsed > 3.5) {
    job.progress = 40;
    job.stage = "propagating post-burn trajectory";
  }
  if (job.status === "running" && elapsed > 5.5) {
    job.progress = 70;
    job.stage = "secondary conjunction screening";
  }
  if (job.status === "running" && elapsed > 7.5) {
    job.progress = 90;
    job.stage = "computing Pc";
  }
  if (job.status === "running" && elapsed > 9) {
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
