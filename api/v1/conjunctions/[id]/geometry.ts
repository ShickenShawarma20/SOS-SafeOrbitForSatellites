/* SOS — Vercel serverless function: /api/v1/conjunctions/:id/geometry
 * Self-contained close-approach geometry endpoint for Vercel compatibility.
 * Inlines conjunction, satellite, debris data + Kepler math.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ---- Constants ----
const MU = 398600.4418;
const EARTH_R_KM = 6378.0;
const DEG = Math.PI / 180;

// ---- Orbital Elements type ----
interface OrbitalElements {
  altitudeKm: number; inclinationDeg: number; raanDeg: number;
  eccentricity: number; periodMin: number; argPerigeeDeg: number;
  tle: { line1: string; line2: string; epoch: string };
  eciPosition?: [number, number, number]; eciVelocity?: [number, number, number];
}

// ---- Conjunction data ----
interface Conjunction {
  id: string; satelliteId: string; objectId: string; severity: string;
  tca: string; probabilityOfCollision: number; missDistanceMeters: number;
  relativeVelocityKms: number; relativeSpeedKmh: number;
  combinedUncertaintyKm: number; screeningVolumeKm: number[];
  hardBodyRadiusM: number;
  bPlane?: { xiKm: number; zetaKm: number };
  covariance?: { sigma1: number; sigma2: number; orientationDeg: number };
  assessment: string; acknowledged: boolean; watchlisted: boolean;
}

const CONJUNCTIONS: Conjunction[] = [
  { id: "CD-2024-0526-0417", satelliteId: "SAT-51656", objectId: "OBJ-8821", severity: "critical", tca: "2024-05-26T04:32:18Z", probabilityOfCollision: 3.2e-4, missDistanceMeters: 742, relativeVelocityKms: 15.29, relativeSpeedKmh: 55041, combinedUncertaintyKm: 1.29, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 60, bPlane: { xiKm: 0.0, zetaKm: -0.742 }, covariance: { sigma1: 1.05, sigma2: 0.74, orientationDeg: 90 }, assessment: "Pc exceeds the 10\u2074 maneuver threshold.", acknowledged: false, watchlisted: false },
  { id: "CD-2024-0526-0418", satelliteId: "SAT-44804", objectId: "OBJ-3421", severity: "high", tca: "2024-05-26T11:15:42Z", probabilityOfCollision: 7.6e-6, missDistanceMeters: 1200, relativeVelocityKms: 11.2, relativeSpeedKmh: 22400, combinedUncertaintyKm: 0.95, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 1, bPlane: { xiKm: 0.28, zetaKm: -0.54 }, covariance: { sigma1: 0.62, sigma2: 0.38, orientationDeg: 35.2 }, assessment: "Pc below maneuver threshold.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-0419", satelliteId: "SAT-54361", objectId: "OBJ-1123", severity: "medium", tca: "2024-05-26T15:42:09Z", probabilityOfCollision: 1.2e-6, missDistanceMeters: 3800, relativeVelocityKms: 9.8, relativeSpeedKmh: 19600, combinedUncertaintyKm: 1.12, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 1, bPlane: { xiKm: 0.42, zetaKm: -3.78 }, covariance: { sigma1: 0.78, sigma2: 0.80, orientationDeg: 60 }, assessment: "Low probability event.", acknowledged: false, watchlisted: false },
  { id: "CD-2024-0526-0420", satelliteId: "SAT-40930", objectId: "OBJ-5567", severity: "low", tca: "2024-05-26T22:08:55Z", probabilityOfCollision: 4.1e-7, missDistanceMeters: 8200, relativeVelocityKms: 7.5, relativeSpeedKmh: 27000, combinedUncertaintyKm: 0.88, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 1, bPlane: { xiKm: 1.2, zetaKm: -8.1 }, covariance: { sigma1: 0.55, sigma2: 0.33, orientationDeg: 22 }, assessment: "No action required.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0526-0421", satelliteId: "SAT-42767", objectId: "OBJ-7744", severity: "medium", tca: "2024-05-27T03:14:22Z", probabilityOfCollision: 2.8e-6, missDistanceMeters: 2400, relativeVelocityKms: 12.1, relativeSpeedKmh: 43560, combinedUncertaintyKm: 1.05, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 1, bPlane: { xiKm: 0.65, zetaKm: -2.31 }, covariance: { sigma1: 0.72, sigma2: 0.58, orientationDeg: 45 }, assessment: "Monitor closely.", acknowledged: false, watchlisted: false },
  { id: "CD-2024-0526-0422", satelliteId: "SAT-39086", objectId: "OBJ-2298", severity: "high", tca: "2024-05-27T08:55:11Z", probabilityOfCollision: 5.4e-5, missDistanceMeters: 920, relativeVelocityKms: 14.3, relativeSpeedKmh: 51480, combinedUncertaintyKm: 1.18, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 1, bPlane: { xiKm: 0.15, zetaKm: -0.91 }, covariance: { sigma1: 0.88, sigma2: 0.65, orientationDeg: 72 }, assessment: "Maneuver evaluation recommended.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-0423", satelliteId: "SAT-44233", objectId: "OBJ-6612", severity: "low", tca: "2024-05-27T14:30:45Z", probabilityOfCollision: 1.5e-7, missDistanceMeters: 15000, relativeVelocityKms: 6.2, relativeSpeedKmh: 22320, combinedUncertaintyKm: 0.72, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 1, bPlane: { xiKm: 3.5, zetaKm: -14.7 }, covariance: { sigma1: 0.45, sigma2: 0.28, orientationDeg: 15 }, assessment: "No action required.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0526-0424", satelliteId: "SAT-44857", objectId: "OBJ-3344", severity: "medium", tca: "2024-05-27T19:12:33Z", probabilityOfCollision: 3.3e-6, missDistanceMeters: 1800, relativeVelocityKms: 10.5, relativeSpeedKmh: 37800, combinedUncertaintyKm: 0.98, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 1, bPlane: { xiKm: 0.48, zetaKm: -1.72 }, covariance: { sigma1: 0.68, sigma2: 0.52, orientationDeg: 55 }, assessment: "Continue monitoring.", acknowledged: false, watchlisted: false },
  { id: "CD-2024-0526-0425", satelliteId: "SAT-37387", objectId: "OBJ-9901", severity: "high", tca: "2024-05-28T01:45:07Z", probabilityOfCollision: 8.7e-5, missDistanceMeters: 680, relativeVelocityKms: 13.8, relativeSpeedKmh: 49680, combinedUncertaintyKm: 1.22, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 1, bPlane: { xiKm: 0.12, zetaKm: -0.67 }, covariance: { sigma1: 0.92, sigma2: 0.71, orientationDeg: 78 }, assessment: "Collision-avoidance maneuver should be evaluated.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-0426", satelliteId: "SAT-41877", objectId: "OBJ-4455", severity: "low", tca: "2024-05-28T06:22:19Z", probabilityOfCollision: 2.2e-7, missDistanceMeters: 22000, relativeVelocityKms: 5.8, relativeSpeedKmh: 20880, combinedUncertaintyKm: 0.65, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 1, bPlane: { xiKm: 5.2, zetaKm: -21.5 }, covariance: { sigma1: 0.4, sigma2: 0.25, orientationDeg: 10 }, assessment: "No action required.", acknowledged: true, watchlisted: false },
];

// ---- Satellite data (relevant orbital elements only) ----
const SATELLITES: Record<string, { name: string; elements: OrbitalElements }> = {
  "SAT-51656": { name: "EOS-04 (RISAT-1A)", elements: { altitudeKm: 529, inclinationDeg: 97.5, raanDeg: 305.2, eccentricity: 0.00019, periodMin: 95.2, argPerigeeDeg: 178.4, tle: { line1: "1 51656U 22011A   26232.00000000  .00000110  00000-0  78123-4 0  9998", line2: "2 51656  97.5000 305.2000 0001900 178.4000 181.7000 15.12605042 12348", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-44804": { name: "CARTOSAT-3", elements: { altitudeKm: 509, inclinationDeg: 97.4, raanDeg: 299.7, eccentricity: 0.0001, periodMin: 94.8, argPerigeeDeg: 90.1, tle: { line1: "1 44804U 19081A   26232.00000000  .00000200  00000-0  10000-3 0  9990", line2: "2 44804  97.4000 299.7000 0001000  90.1000 270.0000 15.19000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-54361": { name: "EOS-6 (Oceansat-3)", elements: { altitudeKm: 738, inclinationDeg: 98.4, raanDeg: 233.5, eccentricity: 0.00014, periodMin: 99.4, argPerigeeDeg: 92.5, tle: { line1: "1 54361U 22158A   26232.00000000  .00000145  00000-0  87843-4 0  9991", line2: "2 54361  98.4000 233.5000 0001400  92.5000 267.7000 14.85000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-40930": { name: "ASTROSAT", elements: { altitudeKm: 650, inclinationDeg: 6.0, raanDeg: 328.2, eccentricity: 0.0009, periodMin: 97.4, argPerigeeDeg: 262.8, tle: { line1: "1 40930U 15052A   26232.00000000  .00000307  00000-0  17562-3 0  9992", line2: "2 40930   6.0000 328.2000 0009000 262.8000  97.2000 14.67700000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-42767": { name: "CARTOSAT-2E", elements: { altitudeKm: 504, inclinationDeg: 97.5, raanDeg: 240.0, eccentricity: 0.001, periodMin: 94.7, argPerigeeDeg: 110.0, tle: { line1: "1 42767U 17036C   26232.00000000  .00000120  00000-0  65000-4 0  9991", line2: "2 42767  97.5000 240.0000 0010000 110.0000 250.0000 15.00000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-39086": { name: "SARAL", elements: { altitudeKm: 790, inclinationDeg: 98.5, raanDeg: 245.0, eccentricity: 0.001, periodMin: 100.4, argPerigeeDeg: 115.0, tle: { line1: "1 39086U 13009A   26232.00000000  .00000080  00000-0  50000-4 0  9991", line2: "2 39086  98.5000 245.0000 0010000 115.0000 245.0000 14.50000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-44233": { name: "RISAT-2B", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 220.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 270.0, tle: { line1: "1 44233U 19028A   26232.00000000  .00000123  00000-0  70000-4 0  9991", line2: "2 44233  48.0000 220.0000 0010000 270.0000  90.0000 15.20000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-44857": { name: "RISAT-2BR1", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 215.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 275.0, tle: { line1: "1 44857U 19089F   26232.00000000  .00000123  00000-0  70000-4 0  9991", line2: "2 44857  48.0000 215.0000 0010000 275.0000  85.0000 15.20000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-37387": { name: "RESOURCESAT-2", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 230.0, eccentricity: 0.001, periodMin: 101.0, argPerigeeDeg: 100.0, tle: { line1: "1 37387U 11015A   26232.00000000  .00000100  00000-0  60000-4 0  9991", line2: "2 37387  98.5000 230.0000 0010000 100.0000 260.0000 14.60000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
  "SAT-41877": { name: "RESOURCESAT-2A", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 235.0, eccentricity: 0.001, periodMin: 101.0, argPerigeeDeg: 105.0, tle: { line1: "1 41877U 16074A   26232.00000000  .00000100  00000-0  60000-4 0  9991", line2: "2 41877  98.5000 235.0000 0010000 105.0000 255.0000 14.60000000 12340", epoch: "2026-08-20T00:00:00Z" } } },
};

// ---- Debris data (relevant orbital elements only) ----
const DEBRIS: Record<string, { name: string; type: string; noradId?: number; elements: OrbitalElements }> = {
  "OBJ-8821": { name: "Fengyun-1C Fragment #39122", type: "fragmentation", noradId: 39122, elements: { altitudeKm: 448, inclinationDeg: 97.4, raanDeg: 132.6, eccentricity: 0.00018, periodMin: 92.58, argPerigeeDeg: 89.5, tle: { line1: "1 39122U 93072B   24147.52240741  .00002340  00000-0  12345-2 0  9990", line2: "2 39122  97.4000 132.6000 0001800  89.5000 270.7000 15.71000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-3421": { name: "Cosmos 2519 Debris Body", type: "payload", noradId: 41780, elements: { altitudeKm: 560, inclinationDeg: 51.8, raanDeg: 246.2, eccentricity: 0.00042, periodMin: 95.72, argPerigeeDeg: 44.1, tle: { line1: "1 41780U 16082A   24147.52240741  .00000890  00000-0  56789-4 0  9991", line2: "2 41780  51.8000 246.2000 0004200  44.1000 316.1000 15.18000000 12341", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-1123": { name: "COSMOS 2251 Fragment", type: "fragmentation", noradId: 40014, elements: { altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 12.8, eccentricity: 0.0005, periodMin: 100.2, argPerigeeDeg: 180.0, tle: { line1: "1 40014U 94033B   24147.52240741  .00000500  00000-0  30000-4 0  9990", line2: "2 40014  86.4000  12.8000 0005000 180.0000 180.1000 14.52000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-5567": { name: "SL-16 R/B Fragment", type: "rocket_body", noradId: 28059, elements: { altitudeKm: 540, inclinationDeg: 5.9, raanDeg: 280.0, eccentricity: 0.0008, periodMin: 95.3, argPerigeeDeg: 200.0, tle: { line1: "1 28059U 04008B   24147.52240741  .00000600  00000-0  40000-4 0  9990", line2: "2 28059   5.9000 280.0000 0008000 200.0000 160.0000 15.20000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-7744": { name: "FENYUN 1C Debris", type: "fragmentation", noradId: 41188, elements: { altitudeKm: 498, inclinationDeg: 97.5, raanDeg: 195.0, eccentricity: 0.0003, periodMin: 94.5, argPerigeeDeg: 140.0, tle: { line1: "1 41188U 15025B   24147.52240741  .00000400  00000-0  25000-4 0  9990", line2: "2 41188  97.5000 195.0000 0003000 140.0000 220.1000 15.10000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-2298": { name: "ARIANE 4 R/B", type: "rocket_body", noradId: 25520, elements: { altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 160.0, eccentricity: 0.001, periodMin: 100.8, argPerigeeDeg: 90.0, tle: { line1: "1 25520U 98051B   24147.52240741  .00000300  00000-0  20000-4 0  9990", line2: "2 25520  98.6000 160.0000 0010000  90.0000 270.1000 14.48000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-6612": { name: "COSMOS 2251 Debris", type: "fragmentation", noradId: 36508, elements: { altitudeKm: 790, inclinationDeg: 86.3, raanDeg: 280.0, eccentricity: 0.0006, periodMin: 100.3, argPerigeeDeg: 120.0, tle: { line1: "1 36508U 99025E   24147.52240741  .00000450  00000-0  28000-4 0  9990", line2: "2 36508  86.3000 280.0000 0006000 120.0000 240.1000 14.51000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-3344": { name: "FENYUN 1C Fragment", type: "fragmentation", noradId: 42000, elements: { altitudeKm: 545, inclinationDeg: 48.1, raanDeg: 110.0, eccentricity: 0.0005, periodMin: 95.4, argPerigeeDeg: 200.0, tle: { line1: "1 42000U 16065B   24147.52240741  .00000380  00000-0  22000-4 0  9990", line2: "2 42000  48.1000 110.0000 0005000 200.0000 160.1000 15.19000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-9901": { name: "IRIDIUM 33 Debris", type: "fragmentation", noradId: 33322, elements: { altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 85.0, eccentricity: 0.0007, periodMin: 100.3, argPerigeeDeg: 60.0, tle: { line1: "1 33322U 97051B   24147.52240741  .00000520  00000-0  32000-4 0  9990", line2: "2 33322  86.4000  85.0000 0007000  60.0000 300.1000 14.53000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
  "OBJ-4455": { name: "CZ-4C R/B", type: "rocket_body", noradId: 39137, elements: { altitudeKm: 830, inclinationDeg: 98.7, raanDeg: 50.0, eccentricity: 0.0009, periodMin: 101.2, argPerigeeDeg: 170.0, tle: { line1: "1 39137U 13040B   24147.52240741  .00000280  00000-0  18000-4 0  9990", line2: "2 39137  98.7000  50.0000 0009000 170.0000 190.1000 14.45000000 12340", epoch: "2024-05-26T00:00:00Z" } } },
};

// ---- Kepler math (inlined from server/src/services/kepler.ts) ----
interface KeplerElements { a_km: number; e: number; inc: number; raan: number; omega: number; nu: number; }
interface OrbState { x: number; y: number; z: number; vx: number; vy: number; vz: number; }

function keplerToState(k: KeplerElements): OrbState {
  const p = k.a_km * (1 - k.e * k.e);
  const r = p / (1 + k.e * Math.cos(k.nu));
  const px = r * Math.cos(k.nu), py = r * Math.sin(k.nu);
  const s = Math.sqrt(MU / p);
  const vx = -s * Math.sin(k.nu), vy = s * (k.e + Math.cos(k.nu));
  const cO = Math.cos(k.omega), sO = Math.sin(k.omega);
  const ci = Math.cos(k.inc), si = Math.sin(k.inc);
  const cR = Math.cos(k.raan), sR = Math.sin(k.raan);
  const x1 = px * cO - py * sO, y1 = px * sO + py * cO;
  const y2 = y1 * ci, z2 = y1 * si;
  return { x: x1 * cR - y2 * sR, y: x1 * sR + y2 * cR, z: z2, vx: vx * cO * cR - vy * sO * cR, vy: vx * cO * sR + vy * sO * sR, vz: 0 };
}

function elementsToKepler(el: OrbitalElements, nuDeg = 0): KeplerElements {
  return { a_km: EARTH_R_KM + el.altitudeKm, e: el.eccentricity, inc: el.inclinationDeg * DEG, raan: el.raanDeg * DEG, omega: el.argPerigeeDeg * DEG, nu: nuDeg * DEG };
}

function orbitRing(el: OrbitalElements, steps = 96): [number, number, number][] {
  const ring: [number, number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const nu = (i / steps) * 2 * Math.PI;
    const k = elementsToKepler(el, (nu / Math.PI) * 180);
    const s = keplerToState(k);
    ring.push([s.x, s.y, s.z]);
  }
  return ring;
}

function deriv(s: OrbState): OrbState {
  const r2 = s.x * s.x + s.y * s.y + s.z * s.z;
  const rn = Math.sqrt(r2);
  const f = -MU / (rn * r2);
  return { x: s.vx, y: s.vy, z: s.vz, vx: f * s.x, vy: f * s.y, vz: f * s.z };
}

function addScaled(s: OrbState, d: OrbState, h: number): OrbState {
  return { x: s.x + d.x * h, y: s.y + d.y * h, z: s.z + d.z * h, vx: s.vx + d.vx * h, vy: s.vy + d.vy * h, vz: s.vz + d.vz * h };
}

function rk4(s: OrbState, dt: number): OrbState {
  const k1 = deriv(s), k2 = deriv(addScaled(s, k1, dt / 2)), k3 = deriv(addScaled(s, k2, dt / 2)), k4 = deriv(addScaled(s, k3, dt));
  return { x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x), y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y), z: s.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z), vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx), vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy), vz: s.vz + (dt / 6) * (k1.vz + 2 * k2.vz + 2 * k3.vz + k4.vz) };
}

function propagate(state: OrbState, tSec: number, dtMax = 2): OrbState {
  const sign = tSec < 0 ? -1 : 1;
  let remaining = Math.abs(tSec);
  let s = { ...state };
  while (remaining > 1e-9) { const h = Math.min(dtMax, remaining) * sign; s = rk4(s, h); remaining -= Math.min(dtMax, remaining); }
  return s;
}

// ---- Encounter trajectory (linear B-plane model) ----
function encounterTrajectory(c: Conjunction, windowSec = 150, step = 1) {
  const relV = c.relativeVelocityKms;
  const xi = c.bPlane ? c.bPlane.xiKm : 0;
  const zeta = c.bPlane ? c.bPlane.zetaKm : -c.missDistanceMeters / 1000;
  const miss = Math.hypot(xi, zeta);
  const samples: { tOffsetSec: number; alongKm: number; xiKm: number; zetaKm: number; rangeKm: number }[] = [];
  for (let t = -windowSec; t <= windowSec; t += step) {
    const along = relV * t;
    samples.push({ tOffsetSec: t, alongKm: along, xiKm: xi, zetaKm: zeta, rangeKm: Math.hypot(along, xi, zeta) });
  }
  return { samples, missKm: miss, windowSec };
}

// ---- Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const urlParts = (req.query.id as string) || (req.url?.split("?")[0]?.split("/").filter(Boolean).pop() || "");
  const id = urlParts;

  const c = CONJUNCTIONS.find((conj) => conj.id === id);
  if (!c) { res.status(404).json({ error: { code: "NOT_FOUND", message: `Conjunction ${id} not found` } }); return; }

  const sat = SATELLITES[c.satelliteId];
  const deb = DEBRIS[c.objectId];
  const satEl = sat ? sat.elements : null;
  const objEl = deb ? deb.elements : null;

  const primaryRing = satEl ? orbitRing(satEl) : [];
  const secondaryRing = objEl ? orbitRing(objEl) : [];
  const enc = encounterTrajectory(c);

  // ECI encounter trajectories
  let eciPrimary: [number, number, number][] = [];
  let eciSecondary: [number, number, number][] = [];
  if (satEl && objEl) {
    const pK = elementsToKepler(satEl, 90);
    const stateA: OrbState = keplerToState(pK);
    const vA = Math.hypot(stateA.vx, stateA.vy, stateA.vz) || 1;
    const relV = c.relativeVelocityKms;
    const vrel: [number, number, number] = [-(stateA.vx / vA) * relV, -(stateA.vy / vA) * relV, -(stateA.vz / vA) * relV];
    const vrelN = Math.hypot(vrel[0], vrel[1], vrel[2]) || 1;
    const et: [number, number, number] = [vrel[0] / vrelN, vrel[1] / vrelN, vrel[2] / vrelN];
    const ref: [number, number, number] = Math.abs(et[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const dot = ref[0] * et[0] + ref[1] * et[1] + ref[2] * et[2];
    let missDir: [number, number, number] = [ref[0] - dot * et[0], ref[1] - dot * et[1], ref[2] - dot * et[2]];
    const mn = Math.hypot(missDir[0], missDir[1], missDir[2]) || 1;
    missDir = [missDir[0] / mn, missDir[1] / mn, missDir[2] / mn];
    const missKm = c.missDistanceMeters / 1000;
    const stateAtTcaA = { ...stateA };
    const stateAtTcaB: OrbState = {
      x: stateA.x + missDir[0] * missKm, y: stateA.y + missDir[1] * missKm, z: stateA.z + missDir[2] * missKm,
      vx: stateA.vx + vrel[0], vy: stateA.vy + vrel[1], vz: stateA.vz + vrel[2],
    };
    const windowSec = 120, step = 2;
    for (let t = -windowSec; t <= windowSec; t += step) {
      const a = propagate(stateAtTcaA, t, step);
      const b = propagate(stateAtTcaB, t, step);
      eciPrimary.push([a.x, a.y, a.z]);
      eciSecondary.push([b.x, b.y, b.z]);
    }
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    conjunctionId: c.id,
    tca: c.tca,
    missDistanceMeters: c.missDistanceMeters,
    relativeVelocityKms: c.relativeVelocityKms,
    relativeSpeedKmh: c.relativeSpeedKmh,
    bPlane: c.bPlane || { xiKm: 0, zetaKm: -c.missDistanceMeters / 1000 },
    covariance: c.covariance || { sigma1: 0.85, sigma2: 0.43, orientationDeg: 42.5 },
    screeningVolume: c.screeningVolumeKm,
    hardBodyRadiusM: c.hardBodyRadiusM,
    combinedUncertaintyKm: c.combinedUncertaintyKm,
    primary: { id: c.satelliteId, orbitalElements: satEl, orbitRing: primaryRing },
    secondary: { id: c.objectId, type: deb?.type, noradId: deb?.noradId, orbitalElements: objEl, orbitRing: secondaryRing },
    encounter: { tca: c.tca, missKm: enc.missKm, windowSec: enc.windowSec, relativeTrajectory: enc.samples },
    satelliteTrajectory: eciPrimary,
    objectTrajectory: eciSecondary,
    severity: c.severity,
  });
}
