import type { WasmModuleMultiThread } from './wasm-module-interfaces.js';
import type { MultiThreadRuntime } from './wasm-runtime.js';
export declare function createMultiThreadRuntimeFromModule(wasmModule: WasmModuleMultiThread, options: {
    threadsCount: number;
}): Promise<MultiThreadRuntime>;
