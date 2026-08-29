import type { EcfVec3, Kilometer } from '../../common-types.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for Doppler factor.
 *
 * Depends on:
 * @see EcfPositionCalculator
 * @see EcfVelocityCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [dopplerFactor0, dopplerFactor1, ...] for each satellite/date pair
 *
 * Provides formatted output as a number under `dopplerFactor` property.
 */
export declare class DopplerFactorCalculator implements Calculator<'dopplerFactor', 2, [
    'ecfPosition',
    'ecfVelocity'
], Float64Array, number, {
    observer: EcfVec3<Kilometer>;
}> {
    readonly name = "dopplerFactor";
    readonly dependencies: ['ecfPosition', 'ecfVelocity'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): number;
    getRawOutput(): Float64Array<ArrayBufferLike>;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getExecutionDescriptor(runParameters: {
        observer: EcfVec3<Kilometer>;
    }): {
        dopplerFactorEnabled: boolean;
        observerEcfX: number;
        observerEcfY: number;
        observerEcfZ: number;
        dopplerFactors: number;
    };
}
