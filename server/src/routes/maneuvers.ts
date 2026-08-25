import { Router } from "express";
import type { SimulationJob } from "../types.js";
import { maneuverPlans } from "../data/maneuvers.js";
import { AppError } from "../middleware/error.js";
import { registerJob } from "./jobs.js";

const router = Router();

router.get("/next", (req, res) => {
  const next = maneuverPlans
    .filter(p => p.approvalStatus === "draft" || p.approvalStatus === "approved")
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return new Date(a.burnWindow.earliest).getTime() - new Date(b.burnWindow.earliest).getTime();
    })[0];
  if (!next) throw new AppError(404, "NOT_FOUND", "No upcoming maneuvers");
  res.json(next);
});

router.get("/plans", (req, res) => {
  const conjunctionId = req.query.conjunctionId as string | undefined;
  let plans = [...maneuverPlans];
  if (conjunctionId) plans = plans.filter(p => p.conjunctionId === conjunctionId);
  res.json(plans);
});

router.get("/plans/:planId", (req, res) => {
  const plan = maneuverPlans.find(p => p.id === req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  res.json(plan);
});

router.post("/simulate", (req, res) => {
  const { planId } = req.body || {};
  const plan = maneuverPlans.find(p => p.id === planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${planId} not found`);
  const jobId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const job: SimulationJob = {
    id: jobId,
    planId,
    status: "queued",
    progress: 0,
    stage: "queued",
    createdAt: new Date().toISOString(),
  };
  registerJob(job);
  res.json({ jobId });
});

router.post("/plans/:planId/submit", (req, res) => {
  const plan = maneuverPlans.find(p => p.id === req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  plan.approvalStatus = "pending_approval";
  res.json(plan);
});

router.get("/plans/:planId/export", (req, res) => {
  const plan = maneuverPlans.find(p => p.id === req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  res.json({ format: (req.query.format as string) || "json", plan });
});

export default router;
