import type { GeodeticLocation, LookAngles } from '../../common-types.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for Look Angles (azimuth, elevation, rangeSat).
 *
 * Requires observer location as a parameter for `BulkPropagator.run()` method.
 *
 * Depends on:
 * @see EcfPositionCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [az0, el0, range0, az1, el1, range1, ...]
 * for each satellite/date pair
 *
 * Provides formatted output under `lookAngles` property.
 *
 * @example
 * ```ts
 * bulkPropagator.run({
 *   dates: [...],
 *   lookAngles: {
 *     observer: {
 *      latitude: degreesToRadians(41),
 *      longitude: degreesToRadians(-71),
 *      height: 0.1,
 *    }
 *   }
 * });
 *
 * bulkPropagator.getFormattedOutput(satelliteIndex, dateIndex).lookAngles.azimuth;
 * ```
 */
export declare class LookAnglesCalculator implements Calculator<'lookAngles', 1, [
    'ecfPosition'
], Float64Array, LookAngles, {
    observer: GeodeticLocation;
}> {
    readonly name = "lookAngles";
    readonly dependencies: ['ecfPosition'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): LookAngles;
    getRawOutput(): Float64Array<ArrayBufferLike>;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getExecutionDescriptor(runParameters: {
        observer: GeodeticLocation;
    }): {
        lookAnglesEnabled: true;
        latitudeRadians: number;
        longitudeRadians: number;
        heightKm: number;
        lookAngles: number;
    };
}
