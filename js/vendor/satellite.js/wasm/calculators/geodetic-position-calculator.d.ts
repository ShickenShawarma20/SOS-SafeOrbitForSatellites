import type { GeodeticLocation } from '../../common-types.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for Geodetic position (latitude, longitude, height).
 *
 * Depends on:
 * @see EciBaseCalculator
 * @see GmstCalculator
 *
 * Raw outputs are always sorted by satellite index first, then by date index, and packed as:
 *   - `Float64Array`, packed as [lat0, lon0, height0, lat1, lon1, height1, ...]
 * for each satellite/date pair
 *
 * Provides formatted output under `geodeticPosition` property,
 * @see GeodeticPositionFormattedOutput.
 */
export declare class GeodeticPositionCalculator implements Calculator<'geodeticPosition', 2, [
    'eci',
    'gmst'
], Float64Array, GeodeticLocation> {
    readonly name = "geodeticPosition";
    readonly dependencies: ['eci', 'gmst'];
    private satellitesCount;
    private datesCount;
    private module;
    private outputPointer;
    init(module: WasmModuleBase, outputPointer: number, satellitesCount: number, datesCount: number): void;
    getFormattedOutput(satelliteIndex: number, dateIndex: number): GeodeticLocation;
    getOutputBufferSize(satellitesCount: number, datesCount: number): number;
    getRawOutput(): Float64Array<ArrayBufferLike>;
    getExecutionDescriptor(): {
        geodeticPositionEnabled: boolean;
        geodeticPositions: number;
    };
}
