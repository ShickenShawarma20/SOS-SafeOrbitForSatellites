export declare function topologicalSort<const T extends string>(items: {
    provides: T;
    hasDependencies: readonly T[];
}[]): T[];
