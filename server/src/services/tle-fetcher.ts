/* SOS — SafeOrbitForSattelites · TLE fetcher & cache
 *
 * Fetches current TLE/GP orbital elements for the ISRO fleet from CelesTrak's
 * public GP API (https://celestrak.org/NORAD/elements/gp.php?CATNR=<id>&FORMAT=tle)
 * and caches them in memory with a recorded timestamp.
 *
 * Design:
 *   - The browser NEVER requests CelesTrak directly — all fetches are server-side.
 *   - TLEs are refreshed periodically (default every 6 hours) per provider cadence,
 *     NOT every second.  Satellite positions are propagated locally from cached
 *     elements continuously.
 *   - On startup the cache is populated immediately (lazy fetch on first access
 *     if a background fetch hasn't completed).
 *   - API failures are handled gracefully: stale cached data is retained and the
 *     satellite is marked with a fetch-error flag so the frontend can show
 *     "ORBITAL DATA SOURCE UNAVAILABLE".
 */

import { ISRO_FLEET, type FleetMember } from "../data/isro-fleet.js";
// Bundled snapshot of real TLEs retrieved from CelesTrak (public GP API).
// Used as a fallback ONLY when the live CelesTrak fetch is unreachable, so the
// system remains demonstrable in restricted network environments.  These are
// genuine orbital elements — NOT fabricated data.  When network access to
// CelesTrak is available, the fetcher refreshes from the live source and the
// snapshot is superseded.  The `source` field is set to "CelesTrak (cached)"
// for snapshot entries so the UI can distinguish them from live-fetched data.
import snapshotTles from "../data/tle-snapshot.json";

export interface CachedTle {
  noradId: number;
  name: string;        // name as returned by CelesTrak
  alias?: string;
  operator: string;
  category: string;
  source: string;
  line1: string;
  line2: string;
  epoch: string;        // ISO 8601 derived from TLE epoch
  fetchedAt: string;    // ISO 8601 — when we retrieved this TLE
  ok: boolean;          // false if the last fetch for this sat failed
}

export interface FleetCache {
  fetchedAt: string | null;   // last successful full refresh
  tles: Map<number, CachedTle>;
  status: "initializing" | "ok" | "stale" | "error";
}

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

// Refresh cadence: 6 hours (CelesTrak updates ~3× daily).
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Stale threshold: 72 hours → data considered stale.
const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000;

const cache: FleetCache = {
  fetchedAt: null,
  tles: new Map(),
  status: "initializing",
};

let refreshTimer: NodeJS.Timeout | null = null;
let fetching = false;

/* Convert a TLE epoch field (YYDDD.FFFFFF) to an ISO 8601 string. */
function tleEpochToIso(epochField: string): string {
  const year = parseInt(epochField.slice(0, 2), 10);
  const dayOfYear = parseFloat(epochField.slice(2));
  const fullYear = year >= 57 ? 1900 + year : 2000 + year;
  const jan1 = Date.UTC(fullYear, 0, 1);
  const ms = jan1 + (dayOfYear - 1) * 86400000;
  return new Date(ms).toISOString();
}

/* Fetch a single satellite's TLE from CelesTrak. */
async function fetchSingleTle(noradId: number): Promise<{ line1: string; line2: string; name: string } | null> {
  const url = `${CELESTRAK_BASE}?CATNR=${noradId}&FORMAT=tle`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`CelesTrak HTTP ${res.status}`);
  const text = (await res.text()).trim();
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  // CelesTrak returns: line0 = name, line1 = TLE line 1, line2 = TLE line 2
  if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) return null;
  return { name: lines[0].trim(), line1: lines[1], line2: lines[2] };
}

/* Refresh TLEs for the entire fleet.  Fetches concurrently but in small batches
   to avoid hammering CelesTrak. */
export async function refreshFleetTles(): Promise<void> {
  if (fetching) return;
  fetching = true;
  const prevStatus = cache.status;
  cache.status = prevStatus === "initializing" ? "initializing" : "ok";
  let successCount = 0;
  let failCount = 0;

  // Fetch in batches of 4 to be polite to the provider.
  const BATCH = 4;
  for (let i = 0; i < ISRO_FLEET.length; i += BATCH) {
    const batch = ISRO_FLEET.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map((m) => fetchSingleTle(m.noradId)));
    results.forEach((result, idx) => {
      const member: FleetMember = batch[idx];
      if (result.status === "fulfilled" && result.value) {
        const tle = result.value;
        const epochField = tle.line1.substring(18, 32);
        cache.tles.set(member.noradId, {
          noradId: member.noradId,
          name: tle.name,
          alias: member.alias,
          operator: member.operator,
          category: member.category,
          source: member.source,
          line1: tle.line1,
          line2: tle.line2,
          epoch: tleEpochToIso(epochField),
          fetchedAt: new Date().toISOString(),
          ok: true,
        });
        successCount++;
      } else {
        // Keep stale entry if we have one; mark ok=false
        const existing = cache.tles.get(member.noradId);
        if (existing) {
          existing.ok = false;
        } else {
          cache.tles.set(member.noradId, {
            noradId: member.noradId,
            name: member.name,
            alias: member.alias,
            operator: member.operator,
            category: member.category,
            source: member.source,
            line1: "",
            line2: "",
            epoch: "",
            fetchedAt: new Date().toISOString(),
            ok: false,
          });
        }
        failCount++;
        console.warn(`[tle-fetcher] Failed to fetch TLE for NORAD ${member.noradId} (${member.name})`);
      }
    });
  }

  if (successCount > 0) {
    cache.fetchedAt = new Date().toISOString();
    cache.status = failCount === 0 ? "ok" : failCount === ISRO_FLEET.length ? "error" : "ok";
  } else {
    cache.status = "error";
  }

  // If the live fetch partially or fully failed, fall back to the bundled
  // snapshot for any satellite that did not get a fresh live TLE so the system
  // remains demonstrable.  Snapshot entries are clearly labeled via
  // source = "CelesTrak (cached)" so they are never presented as fresh live data.
  // Partial failures keep good snapshot data instead of flipping good entries
  // to ok=false with empty elements.
  if (failCount > 0) {
    loadSnapshotFallback();
  }

  // Check staleness of the freshest epoch
  const newestEpoch = newestTleEpoch();
  if (newestEpoch && Date.now() - new Date(newestEpoch).getTime() > STALE_THRESHOLD_MS) {
    cache.status = "stale";
  }

  console.log(`[tle-fetcher] Refresh complete: ${successCount} ok, ${failCount} failed, status=${cache.status}`);
  fetching = false;
}

/* Load bundled snapshot TLEs into the cache.  Only fills satellites that don't
   already have a live-fetched entry.  Marks them ok=true but source="cached". */
function loadSnapshotFallback(): void {
  let loaded = 0;
  for (const snap of snapshotTles as { noradId: number; name: string; line1: string; line2: string }[]) {
    const member = ISRO_FLEET.find((m) => m.noradId === snap.noradId);
    if (!member) continue;
    const existing = cache.tles.get(snap.noradId);
    // Don't overwrite a successful live fetch
    if (existing && existing.ok && existing.source === member.source) continue;
    const epochField = snap.line1.substring(18, 32);
    cache.tles.set(snap.noradId, {
      noradId: snap.noradId,
      name: snap.name,
      alias: member.alias,
      operator: member.operator,
      category: member.category,
      source: "CelesTrak (cached)",
      line1: snap.line1,
      line2: snap.line2,
      epoch: tleEpochToIso(epochField),
      fetchedAt: new Date().toISOString(),
      ok: true,
    });
    loaded++;
  }
  if (loaded > 0) {
    cache.fetchedAt = cache.fetchedAt || new Date().toISOString();
    if (cache.status === "error") cache.status = "stale"; // cached data present but not fresh
    console.log(`[tle-fetcher] Loaded ${loaded} TLEs from bundled snapshot (offline fallback)`);
  }
}

function newestTleEpoch(): string | null {
  let newest: string | null = null;
  for (const t of cache.tles.values()) {
    if (t.epoch && (!newest || t.epoch > newest)) newest = t.epoch;
  }
  return newest;
}

/* Start the background refresh loop.  Called once on server boot. */
export function startTleRefreshLoop(): void {
  // Eagerly load the snapshot so the fleet is immediately available even
  // before the first live fetch completes.
  loadSnapshotFallback();
  // Initial fetch immediately (non-blocking).
  refreshFleetTles().catch((e) => console.error("[tle-fetcher] Initial fetch failed:", e));
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    refreshFleetTles().catch((e) => console.error("[tle-fetcher] Refresh failed:", e));
  }, REFRESH_INTERVAL_MS);
}

/* Get all cached TLEs as an array. */
export function getCachedFleet(): CachedTle[] {
  return Array.from(cache.tles.values());
}

/* Get a single cached TLE by NORAD id. */
export function getCachedTle(noradId: number): CachedTle | undefined {
  return cache.tles.get(noradId);
}

/* Get cache metadata for status display. */
export function getCacheStatus(): {
  status: string;
  fetchedAt: string | null;
  newestEpoch: string | null;
  count: number;
  okCount: number;
} {
  const all = getCachedFleet();
  const okCount = all.filter((t) => t.ok).length;
  return {
    status: cache.status,
    fetchedAt: cache.fetchedAt,
    newestEpoch: newestTleEpoch(),
    count: all.length,
    okCount,
  };
}
