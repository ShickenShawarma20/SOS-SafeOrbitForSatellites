/* SOS — Vercel serverless function: /api/v1/tracking/status
 * Returns data-source freshness and propagation status.
 * Self-contained for Vercel compatibility.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const FLEET_COUNT = 19;
const SNAPSHOT: { noradId: number; line1: string }[] = [
  { noradId: 51656, line1: "1 51656U 22013A   26238.81095876  .00001619  00000+0  96109-4 0  9998" },
  { noradId: 44804, line1: "1 44804U 19081A   26238.89478500  .00002451  00000+0  11938-3 0  9993" },
  { noradId: 54361, line1: "1 54361U 22158A   26238.83316725  .00001454  00000+0  87843-4 0  9991" },
  { noradId: 40930, line1: "1 40930U 15052A   26238.38963726  .00003069  00000+0  17562-3 0  9992" },
  { noradId: 58990, line1: "1 58990U 24033A   26238.77330219  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 45026, line1: "1 45026U 20005A   26238.85231014  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 52898, line1: "1 52898U 22065E   26238.81996584  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 44035, line1: "1 44035U 19007B   26238.76654214  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 43864, line1: "1 43864U 18105A   26238.88239149  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 41752, line1: "1 41752U 16054A   26238.88239149  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 56759, line1: "1 56759U 23076A   26238.78274889  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 39635, line1: "1 39635U 14017A   26235.00100750  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 40269, line1: "1 40269U 14061A   26238.60742545  .00000000  00000+0  00000+0 0  9999" },
  { noradId: 44233, line1: "1 44233U 19028A   26238.58274944  .00001234  00000+0  70000-4 0  9991" },
  { noradId: 44857, line1: "1 44857U 19089F   26238.84929586  .00001234  00000+0  70000-4 0  9991" },
  { noradId: 37387, line1: "1 37387U 11015A   26238.82373933  .00001000  00000+0  60000-4 0  9991" },
  { noradId: 41877, line1: "1 41877U 16074A   26238.80503962  .00001000  00000+0  60000-4 0  9991" },
  { noradId: 42767, line1: "1 42767U 17036C   26238.84804411  .00001200  00000+0  65000-4 0  9991" },
  { noradId: 39086, line1: "1 39086U 13009A   26238.84756950  .00000800  00000+0  50000-4 0  9991" },
];

const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000;

function tleEpochToIso(epochField: string): string {
  const year = parseInt(epochField.slice(0, 2), 10);
  const dayOfYear = parseFloat(epochField.slice(2));
  const fullYear = year >= 57 ? 1900 + year : 2000 + year;
  const jan1 = Date.UTC(fullYear, 0, 1);
  return new Date(jan1 + (dayOfYear - 1) * 86400000).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const okCount = SNAPSHOT.length;
  let newestEpoch: string | null = null;
  for (const snap of SNAPSHOT) {
    const iso = tleEpochToIso(snap.line1.substring(18, 32));
    if (!newestEpoch || iso > newestEpoch) newestEpoch = iso;
  }
  const isStale = newestEpoch && Date.now() - new Date(newestEpoch).getTime() > STALE_THRESHOLD_MS;
  const status = okCount > 0 ? (isStale ? "stale" : "stale") : "error";
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({
    status,
    fetchedAt: new Date().toISOString(),
    newestEpoch,
    count: FLEET_COUNT,
    okCount,
    propagation: "active",
    message: okCount > 0
      ? "Orbital data available · propagation active (cached)"
      : "Orbital data source unavailable",
  });
}
