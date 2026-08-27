export interface SatelliteState {
    noradId: number;
    name: string;
    latitude: number;
    longitude: number;
    altitudeKm: number;
    velocityKms: number;
    position: [number, number, number];
    velocity: [number, number, number];
    timestamp: string;
}
export interface TrajectoryPoint {
    timestamp: string;
    position: [number, number, number];
    velocity: [number, number, number];
    latitude: number;
    longitude: number;
    altitudeKm: number;
}
export type PropagationStatus = "ok" | "no_tle" | "propagation_error";
export interface PropagationResult {
    ok: boolean;
    status: PropagationStatus;
    state?: SatelliteState;
    error?: string;
}
export declare function propagateAt(noradId: number, name: string, line1: string, line2: string, epoch: string, when: Date): Promise<PropagationResult>;
export declare function propagateNow(noradId: number, name: string, line1: string, line2: string, epoch: string): Promise<PropagationResult>;
export declare function propagateTrajectory(noradId: number, name: string, line1: string, line2: string, epoch: string, startWhen: Date, steps: number, stepSec: number): Promise<{
    ok: boolean;
    points: TrajectoryPoint[];
    error?: string;
}>;
//# sourceMappingURL=propagator.d.ts.map