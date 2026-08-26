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
    dataQuality: {
        trackingSources: number;
        latestUpdateMin: number;
        confidence: ConfidenceLevel;
    };
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
    burnWindow: {
        earliest: string;
        latest: string;
    };
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
    modules: {
        name: string;
        status: ModuleStatus;
    }[];
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
export declare const aiAssessments: AiAssessment[];
export declare const aiRecommendations: AiRecommendation[];
export declare const aiActivity: AiActivityEvent[];
export declare const aiModelHealth: AiModelHealth;
export declare const aiDataQuality: AiDataQualityWarning[];
export declare const riskMapPoints: RiskMapPoint[];
export declare const riskMapConjunctions: RiskMapConjunction[];
export declare function aiOverview(): {
    aiStatus: "ONLINE";
    satellitesMonitored: number;
    objectsTracked: number;
    conjunctionsAnalyzed: number;
    activeAssessments: number;
    highRiskEvents: number;
    recommendations: number;
};
//# sourceMappingURL=ai.d.ts.map