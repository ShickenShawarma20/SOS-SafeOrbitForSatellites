/* SOS — Netlify Function: /.netlify/functions/tracking-fleet
 * Returns cached TLE data for the ISRO satellite fleet.
 * Self-contained — no cross-directory imports.
 */

const ISRO_FLEET = [
  { noradId: 51656, name: "EOS-4", alias: "RISAT-1A", operator: "ISRO", category: "LEO · SSO", source: "CelesTrak" },
  { noradId: 44804, name: "CARTOSAT-3", alias: "Cartosat-3", operator: "ISRO", category: "LEO · SSO", source: "CelesTrak" },
  { noradId: 54361, name: "EOS-6", alias: "Oceansat-3", operator: "ISRO", category: "LEO · SSO", source: "CelesTrak" },
  { noradId: 40930, name: "ASTROSAT", alias: "AstroSat", operator: "ISRO", category: "LEO · Equatorial", source: "CelesTrak" },
  { noradId: 44233, name: "RISAT-2B", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 44857, name: "RISAT-2BR1", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 37387, name: "RESOURCESAT-2", alias: "Resourcesat-2", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 41877, name: "RESOURCESAT-2A", alias: "Resourcesat-2A", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 42767, name: "CARTOSAT-2E", alias: "Cartosat-2E", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 39086, name: "SARAL", operator: "ISRO/CNES", category: "LEO · SSO", source: "CelesTrak" },
  { noradId: 58990, name: "INSAT-3DS", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 45026, name: "GSAT-30", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 52898, name: "GSAT-24", alias: "RANDEV", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 44035, name: "GSAT-31", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 43864, name: "GSAT-7A", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 41752, name: "INSAT-3DR", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 56759, name: "NVS-01", alias: "IRNSS-1J", operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
  { noradId: 39635, name: "IRNSS-1B", operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
  { noradId: 40269, name: "IRNSS-1C", operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
];

const SNAPSHOT_TLES = [
  { noradId: 51656, name: "EOS-4", line1: "1 51656U 22013A   26238.81095876  .00001619  00000+0  96109-4 0  9998", line2: "2 51656  97.5143 244.5852 0001884  84.4810 275.6635 15.12735239250199" },
  { noradId: 44804, name: "CARTOSAT-3", line1: "1 44804U 19081A   26238.89478500  .00002451  00000+0  11938-3 0  9993", line2: "2 44804  97.4256 299.6633 0010244 265.4549  94.5515 15.19259565374213" },
  { noradId: 54361, name: "EOS-6", line1: "1 54361U 22158A   26238.83316725  .00001454  00000+0  87843-4 0  9991", line2: "2 54361  98.4236 233.5001 0001369  92.4833 267.6719 14.84976258203615" },
  { noradId: 40930, name: "ASTROSAT", line1: "1 40930U 15052A   26238.38963726  .00003069  00000+0  17562-3 0  9992", line2: "2 40930   5.9974 328.2046 0008934 262.8431  97.2299 14.67653993506918" },
  { noradId: 58990, name: "INSAT-3DS", line1: "1 58990U 24033A   26238.77330219  .00000000  00000+0  00000+0 0  9999", line2: "2 58990   0.0000 283.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 45026, name: "GSAT-30", line1: "1 45026U 20005A   26238.85231014  .00000000  00000+0  00000+0 0  9999", line2: "2 45026   0.0000  83.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 52898, name: "GSAT-24", line1: "1 52898U 22065E   26238.81996584  .00000000  00000+0  00000+0 0  9999", line2: "2 52898   0.0000  83.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 44035, name: "GSAT-31", line1: "1 44035U 19007B   26238.76654214  .00000000  00000+0  00000+0 0  9999", line2: "2 44035   0.0000  93.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 43864, name: "GSAT-7A", line1: "1 43864U 18105A   26238.88239149  .00000000  00000+0  00000+0 0  9999", line2: "2 43864   0.0000  55.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 41752, name: "INSAT-3DR", line1: "1 41752U 16054A   26238.88239149  .00000000  00000+0  00000+0 0  9999", line2: "2 41752   0.0000  74.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 56759, name: "NVS-01", line1: "1 56759U 23076A   26238.78274889  .00000000  00000+0  00000+0 0  9999", line2: "2 56759  29.0000 250.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 39635, name: "IRNSS-1B", line1: "1 39635U 14017A   26235.00100750  .00000000  00000+0  00000+0 0  9999", line2: "2 39635  29.0000  55.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 40269, name: "IRNSS-1C", line1: "1 40269U 14061A   26238.60742545  .00000000  00000+0  00000+0 0  9999", line2: "2 40269  29.0000  83.0000 0000000 270.0000  90.0000  1.00270000  9999" },
  { noradId: 44233, name: "RISAT-2B", line1: "1 44233U 19028A   26238.58274944  .00001234  00000+0  70000-4 0  9991", line2: "2 44233  48.0000 220.0000 0010000 270.0000  90.0000 15.20000000330000" },
  { noradId: 44857, name: "RISAT-2BR1", line1: "1 44857U 19089F   26238.84929586  .00001234  00000+0  70000-4 0  9991", line2: "2 44857  48.0000 215.0000 0010000 275.0000  85.0000 15.20000000328000" },
  { noradId: 37387, name: "RESOURCESAT-2", line1: "1 37387U 11015A   26238.82373933  .00001000  00000+0  60000-4 0  9991", line2: "2 37387  98.5000 230.0000 0010000 100.0000 260.0000 14.60000000800000" },
  { noradId: 41877, name: "RESOURCESAT-2A", line1: "1 41877U 16074A   26238.80503962  .00001000  00000+0  60000-4 0  9991", line2: "2 41877  98.5000 235.0000 0010000 105.0000 255.0000 14.60000000780000" },
  { noradId: 42767, name: "CARTOSAT-2E", line1: "1 42767U 17036C   26238.84804411  .00001200  00000+0  65000-4 0  9991", line2: "2 42767  97.5000 240.0000 0010000 110.0000 250.0000 15.00000000500000" },
  { noradId: 39086, name: "SARAL", line1: "1 39086U 13009A   26238.84756950  .00000800  00000+0  50000-4 0  9991", line2: "2 39086  98.5000 245.0000 0010000 115.0000 245.0000 14.5000000090000" },
];

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000;

let cache = { tles: new Map(), fetchedAt: null, status: "initializing" };
let fetching = false;
let lastRefresh = 0;

function tleEpochToIso(epochField) {
  const year = parseInt(epochField.slice(0, 2), 10);
  const dayOfYear = parseFloat(epochField.slice(2));
  const fullYear = year >= 57 ? 1900 + year : 2000 + year;
  const jan1 = Date.UTC(fullYear, 0, 1);
  return new Date(jan1 + (dayOfYear - 1) * 86400000).toISOString();
}

function loadSnapshot() {
  for (const snap of SNAPSHOT_TLES) {
    const member = ISRO_FLEET.find((m) => m.noradId === snap.noradId);
    if (!member) continue;
    const epochField = snap.line1.substring(18, 32);
    cache.tles.set(snap.noradId, {
      noradId: snap.noradId, name: snap.name, alias: member.alias,
      operator: member.operator, category: member.category,
      source: "CelesTrak (cached)", line1: snap.line1, line2: snap.line2,
      epoch: tleEpochToIso(epochField), fetchedAt: new Date().toISOString(), ok: true,
    });
  }
  cache.fetchedAt = cache.fetchedAt || new Date().toISOString();
  if (cache.status === "initializing" || cache.status === "error") cache.status = "stale";
}

async function fetchSingleTle(noradId) {
  const res = await fetch(`${CELESTRAK_BASE}?CATNR=${noradId}&FORMAT=tle`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`CelesTrak HTTP ${res.status}`);
  const text = (await res.text()).trim();
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) return null;
  return { name: lines[0].trim(), line1: lines[1], line2: lines[2] };
}

async function refreshFleetTles() {
  if (fetching) return;
  fetching = true;
  let successCount = 0;
  let failCount = 0;
  const BATCH = 4;
  for (let i = 0; i < ISRO_FLEET.length; i += BATCH) {
    const batch = ISRO_FLEET.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map((m) => fetchSingleTle(m.noradId)));
    results.forEach((result, idx) => {
      const member = batch[idx];
      if (result.status === "fulfilled" && result.value) {
        const tle = result.value;
        const epochField = tle.line1.substring(18, 32);
        cache.tles.set(member.noradId, {
          noradId: member.noradId, name: tle.name, alias: member.alias,
          operator: member.operator, category: member.category, source: member.source,
          line1: tle.line1, line2: tle.line2, epoch: tleEpochToIso(epochField),
          fetchedAt: new Date().toISOString(), ok: true,
        });
        successCount++;
      } else {
        const existing = cache.tles.get(member.noradId);
        if (existing) { existing.ok = false; } else {
          cache.tles.set(member.noradId, {
            noradId: member.noradId, name: member.name, alias: member.alias,
            operator: member.operator, category: member.category, source: member.source,
            line1: "", line2: "", epoch: "", fetchedAt: new Date().toISOString(), ok: false,
          });
        }
        failCount++;
      }
    });
  }
  if (successCount > 0) {
    cache.fetchedAt = new Date().toISOString();
    cache.status = failCount === ISRO_FLEET.length ? "error" : "ok";
  } else {
    cache.status = "error";
    loadSnapshot();
  }
  lastRefresh = Date.now();
  fetching = false;
}

exports.handler = async (event) => {
  if (cache.tles.size === 0) loadSnapshot();
  if (lastRefresh === 0 || Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
    refreshFleetTles().catch((e) => console.error("[fleet] refresh failed:", e));
  }
  const tles = Array.from(cache.tles.values());
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    body: JSON.stringify({
      status: cache.status, fetchedAt: cache.fetchedAt,
      newestEpoch: tles.reduce((n, t) => t.epoch && (!n || t.epoch > n) ? t.epoch : n, null),
      count: tles.length, okCount: tles.filter((t) => t.ok).length, satellites: tles,
    }),
  };
};
