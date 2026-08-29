import type { WasmModuleBase } from './runtimes/wasm-module-interfaces.js';
export declare function allocateDatesArray(module: WasmModuleBase, datesCount: number): number;
export declare function writeDatesArray(module: WasmModuleBase, pointer: number, dates: readonly Date[]): void;
