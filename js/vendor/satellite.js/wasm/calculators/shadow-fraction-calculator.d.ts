import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for shadow fraction.
 *
 * Computes the fraction of the Sun's disc obscured by the Earth as seen from a satellite
 * at a date. This is the WASM equivalent of the pure-JS `shadowFunction`.
 *
 * Depends on:
 * @see EciBaseCalculator
 * @see SunPositionCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [shadow0, shadow1, ...] for each satellite/date pair
 *     where 0 = fully lit, 1 = umbra, 0–1 = penumbra fraction
 *
 * Provides formatted output as a number under `shadowFraction` property.
 */
export declare class ShadowFractionCalculator implements Calculator<'shadowFraction', 2, [
    'eci',
    'sunPosition'
], Float64Array, number> {
    readonly name = "shadowFraction";
    readonly dependencies: ['eci', 'sunPosition'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): number;
    getRawOutput(): Float64Array;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getExecutionDescriptor(): {
        shadowFractionEnabled: boolean;
        shadowFractionValues: number;
    };
}
