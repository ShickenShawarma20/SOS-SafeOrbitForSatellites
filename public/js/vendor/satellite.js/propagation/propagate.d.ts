import type { PositionAndVelocity } from '../common-types.js';
import { type SatRec } from './SatRec.js';
export interface PropagateOptions {
    /**
     * Opt in to the community fix for satellites that decayed long ago, which SGP4
     * would otherwise propagate to meaningless positions instead of reporting as
     * decayed.
     *
     * This check is NOT part of the official SGP4 algotithm, so if you need completely compliant
     * SGP4 output *despite* it sometimes giving garbage positions for decayed satellites,
     * you should NOT use it.
     */
    communityDecayCheckEnabled: boolean;
}
export declare function propagate(satrec: SatRec, date: Date, options?: PropagateOptions): PositionAndVelocity | null;
export declare function propagate(satrec: SatRec, year: number, month: number, day: number, hour: number, minute: number, second: number, options?: PropagateOptions): PositionAndVelocity | null;
export declare function propagate(satrec: SatRec, year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number | undefined, options?: PropagateOptions): PositionAndVelocity | null;
