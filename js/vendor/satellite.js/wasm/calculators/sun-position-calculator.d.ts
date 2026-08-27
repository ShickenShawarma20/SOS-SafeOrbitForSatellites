import type { AU, EciVec3 } from '../../index.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for Sun position in AU (equatorial ECI frame).
 *
 * Output is per-date only (not per-satellite), since the Sun position depends only
 * on the date.
 *
 * Raw output format:
 *   - `Float64Array`, packed as [x0, y0, z0, x1, y1, z1, ...] for each date.
 *
 * Provides formatted output under `sunPosition` property.
 */
export declare class SunPositionCalculator implements Calculator<'sunPosition', 0, [], Float64Array, EciVec3<AU>> {
    readonly name = "sunPosition";
    readonly dependencies: [];
    private module;
    private outputPointer;
    private datesCount;
    getOutputBufferSize(_satellitesCount: number, datesCount: number): number;
    init(module: WasmModuleBase, outputPointer: number, _satellitesCount: number, datesCount: number): void;
    getRawOutput(): Float64Array;
    getFormattedOutput(_satelliteIndex: number, dateIndex: number): EciVec3<AU>;
    getExecutionDescriptor(): {
        sunPositionEnabled: boolean;
        sunPositions: number;
    };
}
