export interface CachedTle {
    noradId: number;
    name: string;
    alias?: string;
    operator: string;
    category: string;
    source: string;
    line1: string;
    line2: string;
    epoch: string;
    fetchedAt: string;
    ok: boolean;
}
export interface FleetCache {
    fetchedAt: string | null;
    tles: Map<number, CachedTle>;
    status: "initializing" | "ok" | "stale" | "error";
}
export declare function refreshFleetTles(): Promise<void>;
export declare function startTleRefreshLoop(): void;
export declare function getCachedFleet(): CachedTle[];
export declare function getCachedTle(noradId: number): CachedTle | undefined;
export declare function getCacheStatus(): {
    status: string;
    fetchedAt: string | null;
    newestEpoch: string | null;
    count: number;
    okCount: number;
};
//# sourceMappingURL=tle-fetcher.d.ts.map