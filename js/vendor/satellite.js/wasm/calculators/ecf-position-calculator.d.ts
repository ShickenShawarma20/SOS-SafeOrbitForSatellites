import type { EcfVec3, Kilometer } from '../../index.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for ECF (Earth-Centered Fixed) position.
 *
 * Depends on:
 * @see EciBaseCalculator
 * @see GmstCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [x0, y0, z0, x1, y1, z1, ...] for each satellite/date pair
 *
 * Provides formatted output under `ecfPosition` property.
 */
export declare class EcfPositionCalculator implements Calculator<'ecfPosition', 2, [
    'eci',
    'gmst'
], Float64Array, EcfVec3<Kilometer>> {
    readonly name = "ecfPosition";
    readonly dependencies: ['eci', 'gmst'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): EcfVec3<Kilometer>;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getRawOutput(): Float64Array<ArrayBufferLike>;
    getExecutionDescriptor(): {
        ecfPositionEnabled: boolean;
        ecfPositions: number;
    };
}
