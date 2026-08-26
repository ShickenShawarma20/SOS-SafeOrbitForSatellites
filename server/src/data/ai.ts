import type { Severity } from "../types";
import { conjunctions } from "./conjunctions.js";
import { maneuverPlans } from "./maneuvers.js";

/* ---------- AI engine domain types ---------- */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskTrend = "decreasing" | "stable" | "increasing" | "rapidly_increasing";
export type ModuleStatus = "healthy" | "degraded" | "offline";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type PlanStatus = "recommended" | "available" | "rejected";
export type ValidationStatus = "validated" | "pending" | "failed";
export type RecStatus = "awaiting_operator_approval" | "validated_for_simulation" | "invalidated";

export interface TrendDriver {
  factor: string;
  change: string;
}

export interface AiAssessment {
  id: string;
  conjunctionId: string;
  satelliteId: string;
  objectId: string;
  riskLevel: RiskLevel;
  riskTrend: RiskTrend;
  probabilityOfCollision: number;
  previousPc: number;
  missDistanceMeters: number;
  tca: string;
  relativeVelocityKms: number;
  positionUncertaintyKm: number;
  velocityUncertaintyKms: number;
  dataConfidence: ConfidenceLevel;
  confidence: number;
  trendDrivers: TrendDriver[];
  explanation: string;
  primaryContributors: string[];
  dataQuality: { trackingSources: number; latestUpdateMin: number; confidence: ConfidenceLevel };
  recommendationId: string;
}

export interface NewConjunction {
  objectId: string;
  tcaOffsetHours: number;
  pc: number;
  missDistanceMeters: number;
}

export interface AiCandidatePlan {
  planId: string;
  label: string;
  recommended: boolean;
  status: PlanStatus;
  deltaVmps: number;
  burnDurationSec: number;
  burnWindow: { earliest: string; latest: string };
  newMissDistanceKm: number;
  newPc: number;
  fuelImpactPct: number;
  fuelImpactKg: number;
  riskReductionPct: number;
  newConjunctionsCreated: NewConjunction[];
  residualUncertaintyKm: number;
  missionImpact: string;
  rejectionReason: string | null;
  reasoning: string;
}

export interface ConfidenceFactor {
  factor: string;
  level: "High" | "Medium" | "Low";
}

export interface SafetyValidation {
  orbitalConstraints: boolean;
  propulsionConstraints: boolean;
  collisionScreening: boolean;
  secondaryScreening: boolean;
  maneuverWindow: boolean;
  dataFreshness: boolean;
  status: ValidationStatus;
}

export interface AiRecommendation {
  id: string;
  conjunctionId: string;
  satelliteId: string;
  objectId: string;
  tca: string;
  currentPc: number;
  predictedPc: number;
  currentMissDistanceM: number;
  predictedMissDistanceKm: number;
  riskReductionPct: number;
  recommendedPlan: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  confidenceFactors: ConfidenceFactor[];
  candidates: AiCandidatePlan[];
  safetyValidation: SafetyValidation;
  status: RecStatus;
  summary: string;
}

export interface AiActivityEvent {
  id: string;
  timestamp: string;
  text: string;
  type: string;
}

export interface AiModelHealth {
  modules: { name: string; status: ModuleStatus }[];
  lastModelUpdate: string;
  dataLatencySec: number;
  predictionQualityPct: number;
}

export interface AiDataQualityWarning {
  id: string;
  objectId: string;
  issue: string;
  ageMin: number;
  confidence: ConfidenceLevel;
  recommendation: string;
}

export interface RiskMapPoint {
  id: string;
  name: string;
  kind: "satellite" | "object";
  altitudeKm: number;
  raanDeg: number;
  phaseDeg: number;
  riskLevel: RiskLevel | "none";
}

export interface RiskMapConjunction {
  satelliteId: string;
  objectId: string;
  tca: string;
  riskLevel: RiskLevel;
  hoursToTca: number;
}

/* ---------- helpers ---------- */

function riskFromSeverity(s: Severity): RiskLevel {
  return s.toUpperCase() as RiskLevel;
}

function trendFor(c: (typeof conjunctions)[number]): RiskTrend {
  if (c.severity === "critical") return "rapidly_increasing";
  if (c.severity === "high") return "increasing";
  if (c.severity === "medium") return "stable";
  return "decreasing";
}

function confFor(c: (typeof conjunctions)[number]): { level: ConfidenceLevel; pct: number } {
  const unc = c.combinedUncertaintyKm;
  if (unc > 1.4) return { level: "LOW", pct: 0.62 };
  if (unc > 1.0) return { level: "MEDIUM", pct: 0.82 };
  return { level: "HIGH", pct: 0.94 };
}

function prevPcFor(c: (typeof conjunctions)[number]): number {
  const base = c.probabilityOfCollision;
  if (c.severity === "critical") return base / 6;
  if (c.severity === "high") return base / 4;
  return base;
}

/* ---------- assessments ---------- */

export const aiAssessments: AiAssessment[] = conjunctions.map((c, i) => {
  const conf = confFor(c);
  const prev = prevPcFor(c);
  const isCrit = c.severity === "critical";
  return {
    id: "AI-A" + String(i + 1).padStart(3, "0"),
    conjunctionId: c.id,
    satelliteId: c.satelliteId,
    objectId: c.objectId,
    riskLevel: riskFromSeverity(c.severity),
    riskTrend: trendFor(c),
    probabilityOfCollision: c.probabilityOfCollision,
    previousPc: prev,
    missDistanceMeters: c.missDistanceMeters,
    tca: c.tca,
    relativeVelocityKms: c.relativeVelocityKms,
    positionUncertaintyKm: Math.round(c.combinedUncertaintyKm * 100) / 100,
    velocityUncertaintyKms: Math.round(c.relativeVelocityKms * 0.018 * 1000) / 1000,
    dataConfidence: conf.level,
    confidence: conf.pct,
    trendDrivers: isCrit
      ? [{ factor: "Miss distance", change: "−153 m" }, { factor: "Tracking solution", change: "Updated CDM-06" }]
      : [{ factor: "Pc", change: prev > 0 ? "stable" : "—" }],
    explanation: isCrit
      ? "The predicted collision probability increased because the latest tracking update reduced the estimated miss distance while increasing confidence in the relative trajectory."
      : "Risk remains within monitored limits. Continued tracking recommended; reassess at next CDM update.",
    primaryContributors: [
      "Miss distance: " + c.missDistanceMeters + " m",
      "Relative velocity: " + c.relativeVelocityKms + " km/s",
      "TCA: " + c.tca.slice(11, 19),
      "Updated uncertainty estimate",
    ],
    dataQuality: { trackingSources: 32, latestUpdateMin: i === 0 ? 1.2 : 6 + i * 3, confidence: conf.level },
    recommendationId: "AI-R" + String(i + 1).padStart(3, "0"),
  };
});

/* ---------- recommendations (with candidate plans + multi-object safety) ---------- */

function candidateFromPlan(p: (typeof maneuverPlans)[number], index: number): AiCandidatePlan {
  const labels = ["PLAN A", "PLAN B", "PLAN C"];
  const label = labels[index] ?? p.label;
  const recommended = p.recommended;
  const newConj: NewConjunction[] = index === 1
    ? [{ objectId: "OBJ-1934", tcaOffsetHours: 18, pc: 4.1e-5, missDistanceMeters: 920 }]
    : [];
  const status: PlanStatus = index === 1 ? "rejected" : recommended ? "recommended" : "available";
  const reasoning = recommended
    ? "Reduces Pc by approximately two orders of magnitude, produces a larger post-maneuver miss distance, requires relatively low Delta-V, has limited fuel impact, and does not introduce another significant conjunction."
    : index === 1
    ? "Lower Delta-V option, but post-burn trajectory screening detected a new elevated conjunction with OBJ-1934 at TCA +18h. Overall orbital safety is reduced."
    : "Maximum safety margin but higher Delta-V and fuel cost. Available as a fallback if Plan A constraints cannot be met.";
  return {
    planId: p.id,
    label,
    recommended,
    status,
    deltaVmps: p.deltaVmps,
    burnDurationSec: p.burnDurationSec,
    burnWindow: p.burnWindow,
    newMissDistanceKm: p.newMissDistanceKm,
    newPc: p.postBurnPc,
    fuelImpactPct: p.fuelImpactPct,
    fuelImpactKg: p.fuelImpactKg,
    riskReductionPct: p.riskReductionPct,
    newConjunctionsCreated: newConj,
    residualUncertaintyKm: 1.18,
    missionImpact: p.altitudeChangeKm >= 0.7 ? "Higher orbit change; recovery burn within 14 days." : "Limited; recovery to nominal within 14 days.",
    rejectionReason: index === 1 ? "Creates another elevated conjunction (OBJ-1934, TCA +18h, Pc 4.1e-5)." : null,
    reasoning,
  };
}

export const aiRecommendations: AiRecommendation[] = conjunctions
  .filter((c) => c.severity === "critical" || c.severity === "high")
  .map((c, i) => {
    const plans = maneuverPlans.filter((p) => p.conjunctionId === c.id);
    const candidates = plans.length
      ? plans.map(candidateFromPlan)
      : [];
    const recommended = candidates.find((p) => p.recommended) || candidates[0];
    const isCrit = c.severity === "critical";
    const conf = confFor(c);
    return {
      id: "AI-R" + String(i + 1).padStart(3, "0"),
      conjunctionId: c.id,
      satelliteId: c.satelliteId,
      objectId: c.objectId,
      tca: c.tca,
      currentPc: c.probabilityOfCollision,
      predictedPc: recommended ? recommended.newPc : c.probabilityOfCollision,
      currentMissDistanceM: c.missDistanceMeters,
      predictedMissDistanceKm: recommended ? recommended.newMissDistanceKm : c.missDistanceMeters / 1000,
      riskReductionPct: recommended ? recommended.riskReductionPct : 0,
      recommendedPlan: recommended ? recommended.label : "—",
      confidence: isCrit ? 0.94 : 0.78,
      confidenceLevel: conf.level,
      confidenceFactors: [
        { factor: "Tracking quality", level: "High" as const },
        { factor: "Orbit determination", level: "High" as const },
        { factor: "Historical agreement", level: ("Medium" as const) },
        { factor: "Prediction horizon", level: "High" as const },
        { factor: "Data freshness", level: isCrit ? ("High" as const) : ("Medium" as const) },
      ],
      candidates,
      safetyValidation: {
        orbitalConstraints: true,
        propulsionConstraints: true,
        collisionScreening: true,
        secondaryScreening: true,
        maneuverWindow: true,
        dataFreshness: isCrit,
        status: "validated" as ValidationStatus,
      },
      status: "awaiting_operator_approval" as RecStatus,
      summary: isCrit
        ? "The current conjunction has an elevated collision probability. The AI evaluated multiple candidate maneuvers and recommends Plan A because it provides the required risk reduction with lower Delta-V and no newly detected high-risk conjunctions."
        : "Pc below maneuver threshold. Continue monitoring; no immediate maneuver recommended.",
    };
  });

/* ---------- activity log ---------- */

function ago(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

export const aiActivity: AiActivityEvent[] = [
  { id: "EV-1", timestamp: ago(0), text: "Awaiting operator review", type: "review" },
  { id: "EV-2", timestamp: ago(2), text: "Safety validation complete", type: "validation" },
  { id: "EV-3", timestamp: ago(5), text: "Plan A selected as recommended", type: "optimization" },
  { id: "EV-4", timestamp: ago(9), text: "3 candidate maneuvers generated", type: "optimization" },
  { id: "EV-5", timestamp: ago(12), text: "Maneuver optimization started", type: "optimization" },
  { id: "EV-6", timestamp: ago(16), text: "Risk classified as HIGH", type: "risk" },
  { id: "EV-7", timestamp: ago(19), text: "Risk assessment started", type: "risk" },
  { id: "EV-8", timestamp: ago(21), text: "New conjunction detected: SAT-51656 / OBJ-8821", type: "detection" },
  { id: "EV-9", timestamp: ago(41), text: "Conjunction screening cycle complete (21,430 objects)", type: "screening" },
  { id: "EV-10", timestamp: ago(68), text: "Orbit propagation updated for 124 satellites", type: "propagation" },
  { id: "EV-11", timestamp: ago(93), text: "Data pipeline synced — 32 tracking sources", type: "pipeline" },
  { id: "EV-12", timestamp: ago(128), text: "Model update applied: risk-v2.3", type: "model" },
];

/* ---------- model health ---------- */

export const aiModelHealth: AiModelHealth = {
  modules: [
    { name: "Conjunction Detector", status: "healthy" },
    { name: "Risk Model", status: "healthy" },
    { name: "Orbit Propagation", status: "healthy" },
    { name: "Maneuver Optimizer", status: "healthy" },
    { name: "Data Pipeline", status: "healthy" },
    { name: "Safety Validator", status: "healthy" },
  ],
  lastModelUpdate: ago(120),
  dataLatencySec: 1.2,
  predictionQualityPct: 97.4,
};

/* ---------- data quality warnings ---------- */

export const aiDataQuality: AiDataQualityWarning[] = [
  { id: "DQ-1", objectId: "OBJ-8821", issue: "Tracking data is 47 minutes old.", ageMin: 47, confidence: "LOW", recommendation: "DO NOT rely on this prediction for autonomous action." },
  { id: "DQ-2", objectId: "OBJ-7781", issue: "Conflicting tracking sources detected (2 sensors).", ageMin: 12, confidence: "MEDIUM", recommendation: "Reconcile sources before relying on Pc estimate." },
];

/* ---------- risk map ---------- */

const mapRisk = (id: string): RiskLevel | "none" => {
  const c = conjunctions.find((x) => x.satelliteId === id || x.objectId === id);
  return c ? riskFromSeverity(c.severity) : "none";
};

export const riskMapPoints: RiskMapPoint[] = [
  { id: "SAT-51656", name: "EOS-04", kind: "satellite", altitudeKm: 529, raanDeg: 305.2, phaseDeg: 120, riskLevel: mapRisk("SAT-51656") },
  { id: "SAT-44804", name: "Cartosat-3", kind: "satellite", altitudeKm: 508, raanDeg: 132.4, phaseDeg: 200, riskLevel: mapRisk("SAT-44804") },
  { id: "SAT-54361", name: "EOS-06", kind: "satellite", altitudeKm: 743, raanDeg: 245.8, phaseDeg: 45, riskLevel: mapRisk("SAT-54361") },
  { id: "SAT-58694", name: "XPoSat", kind: "satellite", altitudeKm: 350, raanDeg: 210.4, phaseDeg: 300, riskLevel: mapRisk("SAT-58694") },
  { id: "SAT-40930", name: "AstroSat", kind: "satellite", altitudeKm: 650, raanDeg: 88.9, phaseDeg: 80, riskLevel: "none" },
  { id: "SAT-58990", name: "INSAT-3DS", kind: "satellite", altitudeKm: 35786, raanDeg: 78.2, phaseDeg: 0, riskLevel: mapRisk("SAT-58990") },
  { id: "OBJ-8821", name: "OBJ-8821", kind: "object", altitudeKm: 448, raanDeg: 131.9, phaseDeg: 118, riskLevel: mapRisk("OBJ-8821") },
  { id: "OBJ-3421", name: "OBJ-3421", kind: "object", altitudeKm: 515, raanDeg: 208.7, phaseDeg: 195, riskLevel: mapRisk("OBJ-3421") },
  { id: "OBJ-1123", name: "OBJ-1123", kind: "object", altitudeKm: 618, raanDeg: 90.2, phaseDeg: 40, riskLevel: mapRisk("OBJ-1123") },
  { id: "OBJ-7781", name: "OBJ-7781", kind: "object", altitudeKm: 498, raanDeg: 245.8, phaseDeg: 250, riskLevel: mapRisk("OBJ-7781") },
  { id: "OBJ-9912", name: "OBJ-9912", kind: "object", altitudeKm: 552, raanDeg: 14.1, phaseDeg: 160, riskLevel: mapRisk("OBJ-9912") },
];

export const riskMapConjunctions: RiskMapConjunction[] = conjunctions.map((c) => ({
  satelliteId: c.satelliteId,
  objectId: c.objectId,
  tca: c.tca,
  riskLevel: riskFromSeverity(c.severity),
  hoursToTca: Math.round((new Date(c.tca).getTime() - Date.now()) / 3600000),
}));

/* ---------- overview ---------- */

export function aiOverview() {
  return {
    aiStatus: "ONLINE" as const,
    satellitesMonitored: 124,
    objectsTracked: 18492,
    conjunctionsAnalyzed: 1284,
    activeAssessments: aiAssessments.length,
    highRiskEvents: aiAssessments.filter((a) => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL").length,
    recommendations: aiRecommendations.length,
  };
}
