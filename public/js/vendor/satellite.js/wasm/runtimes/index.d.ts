import type { MultiThreadRuntime, SingleThreadRuntime } from './wasm-runtime.js';
export declare function createSingleThreadRuntime(): Promise<SingleThreadRuntime>;
export declare function createMultiThreadRuntime(options: {
    threadsCount: number;
}): Promise<MultiThreadRuntime>;
