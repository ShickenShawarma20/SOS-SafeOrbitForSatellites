import { Router } from "express";
import type { SimulationJob, ManeuverPlan } from "../types.js";
import { maneuverPlans } from "../data/maneuvers.js";
import { conjunctions } from "../data/conjunctions.js";
import { satellites } from "../data/satellites.js";
import { debrisObjects } from "../data/debris.js";
import { AppError } from "../middleware/error.js";
import { registerJob } from "./jobs.js";
import {
  generateCandidatePlans,
  postBurnOrbitRing,
  postBurnTrajectory,
  type ManeuverInputs,
} from "../services/maneuver.js";

const router = Router();

/* ---------- Helpers ---------- */

function findConjunction(id: string) {
  return conjunctions.find((c) => c.id === id);
}

function findSatellite(satelliteId: string) {
  return satellites.find((s) => s.id === satelliteId);
}

/* Build ManeuverInputs for a conjunction, pulling satellite physical params
 * and orbital elements from the catalog. */
function buildInputs(conjId: string): ManeuverInputs | null {
  const c = findConjunction(conjId);
  if (!c) return null;
  const sat = findSatellite(c.satelliteId);
  const deb = debrisObjects.find((d) => d.id === c.objectId);
  const satEl = sat ? sat.elements : null;
  if (!satEl) return null;
  return {
    primaryElements: {
      altitudeKm: satEl.altitudeKm,
      inclinationDeg: satEl.inclinationDeg,
      raanDeg: satEl.raanDeg,
      eccentricity: satEl.eccentricity,
      argPerigeeDeg: satEl.argPerigeeDeg,
      periodMin: satEl.periodMin,
    },
    missDistanceMeters: c.missDistanceMeters,
    relativeVelocityKms: c.relativeVelocityKms,
    hardBodyRadiusM: c.hardBodyRadiusM,
    covariance: c.covariance || { sigma1: 1.05, sigma2: 0.74, orientationDeg: 90 },
    probabilityOfCollision: c.probabilityOfCollision,
    massKg: sat ? sat.massKg : 1000,
    thrustN: 1.1,
    ispSec: sat ? sat.fuel.ispSec : 230,
    burnBeforeTcaSec: 2 * 3600, // burn 2 hours before TCA
  };
}

/* Generate 3 ManeuverPlan records for a conjunction using real CW/Tsiolkovsky. */
function generatePlans(conjId: string): ManeuverPlan[] {
  const inputs = buildInputs(conjId);
  if (!inputs) return [];
  const c = findConjunction(conjId);
  if (!c) return [];
  const results = generateCandidatePlans(inputs);
  const labels = ["PLAN A", "PLAN B", "PLAN C"];
  const dirs = ["prograde", "prograde", "prograde"] as const;
  const notes = [
    "Burn window keeps satellite inside ground-station visibility for real-time monitoring. Recovery to nominal orbit can be executed within 14 days.",
    "Lower delta-V option. Provides adequate but reduced margin. May require secondary maneuver if Pc trends upward.",
    "Maximum safety option. Highest fuel cost but provides best margin of safety against catalogued and uncatalogued objects.",
  ];
  return results.map((r, i) => ({
    id: `MAN-${conjId.slice(-4)}-${String.fromCharCode(65 + i)}`,
    conjunctionId: conjId,
    satelliteId: c.satelliteId,
    label: labels[i],
    recommended: i === 0,
    direction: dirs[i],
    burnWindow: {
      earliest: new Date(new Date(c.tca).getTime() - 2.5 * 3600 * 1000).toISOString(),
      latest: new Date(new Date(c.tca).getTime() - 1.5 * 3600 * 1000).toISOString(),
    },
    deltaVmps: r.deltaVmps,
    burnDurationSec: r.burnDurationSec,
    thrustN: 1.1,
    fuelImpactPct: r.fuelImpactPct,
    fuelImpactKg: r.fuelImpactKg,
    newMissDistanceKm: r.newMissDistanceKm,
    riskReductionPct: r.riskReductionPct,
    postBurnPc: r.postBurnPc,
    altitudeChangeKm: r.altitudeChangeKm,
    groundTrackShiftKm: r.groundTrackShiftKm,
    secondaryScreeningClear: r.newMissDistanceKm > 1.0,
    notes: notes[i],
    approvalStatus: "draft" as const,
  }));
}

/* Cache dynamically generated plans so /simulate and /export can find them. */
const dynamicPlanCache = new Map<string, ManeuverPlan>();

function getPlansForConjunction(conjId: string): ManeuverPlan[] {
  // Static seed first
  const staticPlans = maneuverPlans.filter((p) => p.conjunctionId === conjId);
  if (staticPlans.length > 0) return staticPlans;
  // Try cache
  const cached = Array.from(dynamicPlanCache.values()).filter((p) => p.conjunctionId === conjId);
  if (cached.length > 0) return cached;
  // Generate and cache
  const generated = generatePlans(conjId);
  generated.forEach((p) => dynamicPlanCache.set(p.id, p));
  return generated;
}

function findPlan(planId: string): ManeuverPlan | undefined {
  return maneuverPlans.find((p) => p.id === planId)
    || dynamicPlanCache.get(planId);
}

/* Get the ManeuverResult (computed physics) for a plan, for visualization. */
function getPlanResult(plan: ManeuverPlan) {
  const inputs = buildInputs(plan.conjunctionId);
  if (!inputs) return null;
  // Recompute with the plan's actual ΔV
  const { computeManeuver } = require("../services/maneuver.js");
  // Derive LVLH components from direction + deltaV (prograde = along-track)
  const dv = { T: plan.deltaVmps, R: 0, N: 0 };
  return computeManeuver(dv, inputs);
}

/* ---------- Routes ---------- */

router.get("/next", (req, res) => {
  const all = [...maneuverPlans, ...Array.from(dynamicPlanCache.values())];
  const next = all
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
  if (conjunctionId) {
    res.json(getPlansForConjunction(conjunctionId));
  } else {
    res.json([...maneuverPlans, ...Array.from(dynamicPlanCache.values())]);
  }
});

router.get("/plans/:planId", (req, res) => {
  const plan = findPlan(req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  res.json(plan);
});

/* Return the post-burn orbit ring + computed physics for visualization. */
router.get("/plans/:planId/geometry", (req, res) => {
  const plan = findPlan(req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  const c = findConjunction(plan.conjunctionId);
  if (!c) throw new AppError(404, "NOT_FOUND", `Conjunction not found`);
  const sat = findSatellite(c.satelliteId);
  const satEl = sat ? sat.elements : null;
  if (!satEl) throw new AppError(404, "NOT_FOUND", "Satellite elements not found");

  const result = getPlanResult(plan);
  if (!result) throw new AppError(500, "COMPUTE_ERROR", "Could not compute maneuver");

  const postBurnRing = postBurnOrbitRing(result, {
    altitudeKm: satEl.altitudeKm,
    inclinationDeg: satEl.inclinationDeg,
    raanDeg: satEl.raanDeg,
    eccentricity: satEl.eccentricity,
    argPerigeeDeg: satEl.argPerigeeDeg,
  });

  res.json({
    planId: plan.id,
    conjunctionId: plan.conjunctionId,
    currentOrbit: {
      altitudeKm: satEl.altitudeKm,
      inclinationDeg: satEl.inclinationDeg,
      raanDeg: satEl.raanDeg,
      eccentricity: satEl.eccentricity,
      argPerigeeDeg: satEl.argPerigeeDeg,
    },
    postBurnOrbit: {
      altitudeKm: result.postBurnElements.altitudeKm,
      eccentricity: result.postBurnElements.eccentricity,
      periodMin: result.postBurnElements.periodMin,
      altitudeChangeKm: result.altitudeChangeKm,
    },
    postBurnRing: postBurnRing,
    physics: {
      deltaVmps: result.deltaVmps,
      burnDurationSec: result.burnDurationSec,
      fuelImpactKg: result.fuelImpactKg,
      fuelImpactPct: result.fuelImpactPct,
      newMissDistanceKm: result.newMissDistanceKm,
      missImprovementKm: result.missImprovementKm,
      riskReductionPct: result.riskReductionPct,
      postBurnPc: result.postBurnPc,
      altitudeChangeKm: result.altitudeChangeKm,
      groundTrackShiftKm: result.groundTrackShiftKm,
      newPeriodMin: result.newPeriodMin,
    },
    secondaryScreeningClear: plan.secondaryScreeningClear,
  });
});

router.post("/simulate", (req, res) => {
  const { planId } = req.body || {};
  const plan = findPlan(planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${planId} not found`);

  // Compute real post-burn trajectory for the simulation result
  const inputs = buildInputs(plan.conjunctionId);
  let simResult: Record<string, unknown> = { summary: "Simulation ready.", secondaryScreeningClear: true };
  if (inputs) {
    const { computeManeuver } = require("../services/maneuver.js");
    const result = computeManeuver({ T: plan.deltaVmps, R: 0, N: 0 }, inputs);
    const c = findConjunction(plan.conjunctionId);
    const sat = c ? findSatellite(c.satelliteId) : null;
    const satEl = sat ? sat.elements : null;
    if (satEl) {
      const traj = postBurnTrajectory(result, {
        altitudeKm: satEl.altitudeKm,
        inclinationDeg: satEl.inclinationDeg,
        raanDeg: satEl.raanDeg,
        eccentricity: satEl.eccentricity,
        argPerigeeDeg: satEl.argPerigeeDeg,
      });
      simResult = {
        summary: traj.summary,
        secondaryScreeningClear: traj.secondaryScreeningClear,
        postBurnTrajectory: traj.points,
        newMissDistanceKm: result.newMissDistanceKm,
        postBurnPc: result.postBurnPc,
        riskReductionPct: result.riskReductionPct,
      };
    }
  }

  const jobId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const job: SimulationJob = {
    id: jobId,
    planId,
    status: "queued",
    progress: 0,
    stage: "queued",
    result: simResult,
    createdAt: new Date().toISOString(),
  };
  registerJob(job);
  res.json({ jobId });
});

router.post("/plans/:planId/submit", (req, res) => {
  const plan = findPlan(req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  plan.approvalStatus = "pending_approval";
  res.json(plan);
});

router.get("/plans/:planId/export", (req, res) => {
  const plan = findPlan(req.params.planId);
  if (!plan) throw new AppError(404, "NOT_FOUND", `Plan ${req.params.planId} not found`);
  res.json({ format: (req.query.format as string) || "json", plan });
});

export default router;
