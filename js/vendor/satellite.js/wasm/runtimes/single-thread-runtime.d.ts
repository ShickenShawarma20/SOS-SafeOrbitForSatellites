import type { WasmModuleSingleThread } from './wasm-module-interfaces.js';
import type { SingleThreadRuntime } from './wasm-runtime.js';
export declare function createSingleThreadRuntimeFromModule(wasmModule: WasmModuleSingleThread): Promise<SingleThreadRuntime>;
