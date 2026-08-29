import type { GMSTime } from '../../common-types.js';
import type { WasmModuleBase } from '../runtimes/wasm-module-interfaces.js';
import type { Calculator } from './calculator-interface.js';
/**
 * Calculator for GMST (Greenwich Mean Sidereal Time), required for many coordinate transforms.
 *
 * Raw output format:
 *   - `Float64Array`, packed as [gmst0, gmst1, ...] for each date. Not duplicated per satellite.
 *
 * Provides formatted output as a number under `gmst` property.
 */
export declare class GmstCalculator implements Calculator<'gmst', 0, [], Float64Array, GMSTime> {
    readonly name = "gmst";
    readonly dependencies: [];
    private module;
    private outputPointer;
    private datesCount;
    getOutputBufferSize(_satellitesCount: number, datesCount: number): number;
    init(module: WasmModuleBase, outputPointer: number, _satellitesCount: number, datesCount: number): void;
    getRawOutput(): Float64Array;
    getFormattedOutput(_satelliteIndex: number, dateIndex: number): GMSTime;
    getExecutionDescriptor(): {
        gmstEnabled: boolean;
        gmstValues: number;
    };
}
