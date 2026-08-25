export type Severity = "critical" | "high" | "medium" | "low";
export type SatelliteStatus = "operational" | "degraded" | "standby" | "offline";
export type OrbitRegime = "LEO" | "MEO" | "GEO" | "HEO";
export type ObjectType = "payload" | "rocket_body" | "fragmentation" | "unknown";
export type ManeuverPurpose = "collision_avoidance" | "station_keeping" | "orbit_raise" | "deorbit";
export type ManeuverDirection = "prograde" | "retrograde" | "radial_in" | "radial_out" | "normal" | "anti_normal";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected" | "executed";
export interface OrbitalElements {
    altitudeKm: number;
    inclinationDeg: number;
    raanDeg: number;
    eccentricity: number;
    periodMin: number;
    argPerigeeDeg: number;
    tle: {
        line1: string;
        line2: string;
        epoch: string;
    };
    eciPosition?: [number, number, number];
    eciVelocity?: [number, number, number];
}
export interface FuelState {
    pctRemaining: number;
    totalKg: number;
    usableKg: number;
    reservedKg: number;
    estEndOfLife: string;
    ispSec: number;
    dryMassKg: number;
}
export interface SubsystemStatus {
    name: string;
    status: "nominal" | "degraded" | "offline";
}
export interface Satellite {
    id: string;
    noradId: number;
    name: string;
    type: string;
    operator: string;
    launchDate: string;
    massKg: number;
    status: SatelliteStatus;
    orbitClass: string;
    elements: OrbitalElements;
    fuel: FuelState;
    subsystems: SubsystemStatus[];
}
export interface DebrisObject {
    id: string;
    noradId?: number;
    type: ObjectType;
    elements: OrbitalElements;
}
export interface Conjunction {
    id: string;
    satelliteId: string;
    objectId: string;
    severity: Severity;
    tca: string;
    probabilityOfCollision: number;
    missDistanceMeters: number;
    relativeVelocityKms: number;
    relativeSpeedKmh: number;
    combinedUncertaintyKm: number;
    screeningVolumeKm: [number, number, number];
    hardBodyRadiusM: number;
    bPlane?: {
        xiKm: number;
        zetaKm: number;
    };
    covariance?: {
        sigma1: number;
        sigma2: number;
        orientationDeg: number;
    };
    assessment: string;
    acknowledged: boolean;
    watchlisted: boolean;
}
export interface CdmRecord {
    id: string;
    conjunctionId: string;
    epoch: string;
    missDistanceMeters: number;
    probabilityOfCollision: number;
    trendPct: number;
}
export interface ManeuverPlan {
    id: string;
    conjunctionId: string;
    satelliteId: string;
    label: string;
    recommended: boolean;
    direction: ManeuverDirection;
    burnWindow: {
        earliest: string;
        latest: string;
    };
    deltaVmps: number;
    burnDurationSec: number;
    thrustN: number;
    fuelImpactPct: number;
    fuelImpactKg: number;
    newMissDistanceKm: number;
    riskReductionPct: number;
    postBurnPc: number;
    altitudeChangeKm: number;
    groundTrackShiftKm: number;
    secondaryScreeningClear: boolean;
    notes: string;
    approvalStatus: ApprovalStatus;
}
export interface FeedEvent {
    id: string;
    type: "alert" | "tracking" | "maneuver" | "tle" | "weather";
    message: string;
    severity: Severity | "info";
    timestamp: string;
    satelliteId?: string;
    objectId?: string;
}
export interface GroundStation {
    id: string;
    name: string;
    lat: number;
    lon: number;
    status: "online" | "offline";
}
export interface Notification {
    id: string;
    type: string;
    message: string;
    severity: Severity | "info";
    read: boolean;
    timestamp: string;
    link?: string;
}
export interface AuditEntry {
    id: string;
    action: string;
    operator: string;
    timestamp: string;
    details: Record<string, unknown>;
}
export interface SpaceWeather {
    f107: number;
    kpIndex: number;
    dragMultiplier: number;
    timestamp: string;
}
export interface SimulationJob {
    id: string;
    planId: string;
    status: "queued" | "running" | "completed" | "failed";
    progress: number;
    stage: string;
    result?: Record<string, unknown>;
    createdAt: string;
    completedAt?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
//# sourceMappingURL=types.d.ts.map