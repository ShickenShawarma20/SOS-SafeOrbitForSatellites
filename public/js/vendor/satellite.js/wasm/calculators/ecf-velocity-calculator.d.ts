import type { EcfVec3, KilometerPerSecond } from '../../common-types.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for ECF (Earth-Centered Fixed) velocity.
 *
 * Depends on:
 * @see EciBaseCalculator
 * @see GmstCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [vx0, vy0, vz0, vx1, vy1, vz1, ...] for each satellite/date pair
 *
 * Provides formatted output under `ecfVelocity` property.
 */
export declare class EcfVelocityCalculator implements Calculator<'ecfVelocity', 2, [
    'eci',
    'gmst'
], Float64Array, EcfVec3<KilometerPerSecond>> {
    readonly name = "ecfVelocity";
    readonly dependencies: ['eci', 'gmst'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): EcfVec3<KilometerPerSecond>;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getRawOutput(): Float64Array<ArrayBufferLike>;
    getExecutionDescriptor(): {
        ecfVelocityEnabled: boolean;
        ecfVelocities: number;
    };
}
