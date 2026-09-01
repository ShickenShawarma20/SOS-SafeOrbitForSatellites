/* SOS — Vercel serverless function: /api/v1/debris
 * Returns the debris catalog. Self-contained for Vercel compatibility.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface OrbitalElements {
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  eccentricity: number;
  periodMin: number;
  argPerigeeDeg: number;
  tle: { line1: string; line2: string; epoch: string };
  eciPosition?: [number, number, number];
  eciVelocity?: [number, number, number];
}

interface DebrisObject {
  id: string;
  noradId?: number;
  type: string;
  elements: OrbitalElements;
  name: string;
  description: string;
  origin: string;
  sourceMission: string;
  eventDate: string;
  massKg: number;
  sizeCategory: string;
  decayEstimate: string;
  riskLevel: string;
}

const DEBRIS_OBJECTS: DebrisObject[] = [
  {
    id: "OBJ-8821",
    noradId: 39122,
    type: "fragmentation",
    name: "Fengyun-1C Fragment #39122",
    description: "Debris fragment from the 2007 Chinese anti-satellite missile test. This is a trackable piece of wreckage from the destroyed Fengyun-1C weather satellite, one of the largest single debris-generating events in history.",
    origin: "Chinese ASAT Test (FY-1C)",
    sourceMission: "Fengyun-1C",
    eventDate: "2007-01-11",
    massKg: 85,
    sizeCategory: "medium",
    decayEstimate: "2035-2045",
    riskLevel: "critical",
    elements: {
      altitudeKm: 448, inclinationDeg: 97.4, raanDeg: 132.6,
      eccentricity: 0.00018, periodMin: 92.58, argPerigeeDeg: 89.5,
      tle: { line1: "1 39122U 93072B   24147.52240741  .00002340  00000-0  12345-2 0  9990", line2: "2 39122  97.4000 132.6000 0001800  89.5000 270.7000 15.71000000 12340", epoch: "2024-05-26T00:00:00Z" },
      eciPosition: [2800, -4480, 3990], eciVelocity: [2.12, 5.78, -4.28],
    },
  },
  {
    id: "OBJ-3421",
    noradId: 41780,
    type: "payload",
    name: "Cosmos 2519 Debris Body",
    description: "Defunct Russian military reconnaissance satellite body in LEO. Cosmos 2519 was part of the US-KS early-warning satellite constellation. The spacecraft experienced orbital decay and fragmentation events, leaving a hazardous derelict body in a congested orbital regime.",
    origin: "Russian Space Program",
    sourceMission: "Cosmos 2519 (US-KS)",
    eventDate: "2016-11-09",
    massKg: 1200,
    sizeCategory: "large",
    decayEstimate: "2040-2055",
    riskLevel: "high",
    elements: {
      altitudeKm: 560, inclinationDeg: 51.8, raanDeg: 246.2,
      eccentricity: 0.00042, periodMin: 95.72, argPerigeeDeg: 44.1,
      tle: { line1: "1 41780U 16082A   24147.52240741  .00000890  00000-0  56789-4 0  9991", line2: "2 41780  51.8000 246.2000 0004200  44.1000 316.1000 15.18000000 12341", epoch: "2024-05-26T00:00:00Z" },
      eciPosition: [-3200, 4050, -4280], eciVelocity: [-5.6, -2.1, 4.82],
    },
  },
  {
    id: "OBJ-1123",
    noradId: 36411,
    type: "rocket_body",
    name: "PSLV R/B Upper Stage",
    description: "Spent upper stage of India's Polar Satellite Launch Vehicle (PSLV). This rocket body remains in orbit after delivering its payload to sun-synchronous orbit. The stage contains residual propellant and pressurized tanks that pose a fragmentation risk.",
    origin: "ISRO PSLV Launch Vehicle",
    sourceMission: "PSLV-C5 / RESOURCESAT-2",
    eventDate: "2011-04-20",
    massKg: 450,
    sizeCategory: "large",
    decayEstimate: "2028-2035",
    riskLevel: "medium",
    elements: {
      altitudeKm: 390, inclinationDeg: 97.2, raanDeg: 198.8,
      eccentricity: 0.00025, periodMin: 91.52, argPerigeeDeg: 111.8,
      tle: { line1: "1 36411U 10027B   24147.52240741  .00001560  00000-0  89012-3 0  9992", line2: "2 36411  97.2000 198.8000 0002500 111.8000 248.4000 15.65000000 12342", epoch: "2024-05-26T00:00:00Z" },
      eciPosition: [1500, -5850, 3200], eciVelocity: [3.4, 1.2, -6.05],
    },
  },
  {
    id: "OBJ-7781",
    noradId: 42917,
    type: "fragmentation",
    name: "Iridium-Cosmos Collision Fragment",
    description: "Debris from the 2009 Iridium 33 / Cosmos 2251 collision — the first known collision between two intact artificial satellites in Earth orbit. This fragment originated from the Cosmos 2251 debris cloud and remains in a high-traffic LEO regime.",
    origin: "Iridium-Cosmos Collision (2009)",
    sourceMission: "Cosmos 2251",
    eventDate: "2009-02-10",
    massKg: 12,
    sizeCategory: "small",
    decayEstimate: "2025-2030",
    riskLevel: "high",
    elements: {
      altitudeKm: 415, inclinationDeg: 52.5, raanDeg: 312.1,
      eccentricity: 0.0038, periodMin: 92.15, argPerigeeDeg: 79.2,
      tle: { line1: "1 42917U 17073B   24147.52240741  .00001230  00000-0  67890-3 0  9993", line2: "2 42917  52.5000 312.1000 0038000  79.2000 281.8000 15.42000000 12343", epoch: "2024-05-26T00:00:00Z" },
      eciPosition: [-4050, 3200, 4480], eciVelocity: [4.08, -3.4, -2.74],
    },
  },
  {
    id: "OBJ-9912",
    noradId: 44832,
    type: "unknown",
    name: "Unidentified MEO Object",
    description: "Trackable object in Medium Earth Orbit with unclear provenance. Classified as unknown type pending further observation. The object's orbital characteristics are consistent with a spent navigation satellite upper stage, but no definitive attribution has been made.",
    origin: "Unknown — Pending Attribution",
    sourceMission: "Unknown",
    eventDate: "2019-09-01",
    massKg: 320,
    sizeCategory: "medium",
    decayEstimate: "No natural decay expected",
    riskLevel: "low",
    elements: {
      altitudeKm: 20100, inclinationDeg: 54.8, raanDeg: 120.9,
      eccentricity: 0.0002, periodMin: 716.5, argPerigeeDeg: 31.5,
      tle: { line1: "1 44832U 19098A   24147.52240741  .00000340  00000-0  23456-4 0  9994", line2: "2 44832  54.8000 120.9000 0002000  31.5000 328.6000  2.00800000 12344", epoch: "2024-05-26T00:00:00Z" },
      eciPosition: [14900, 11900, 7900], eciVelocity: [-1.48, 2.28, 3.05],
    },
  },
];

// Conjunctions data (for the /:id/conjunctions sub-route)
interface Conjunction {
  id: string;
  satelliteId: string;
  objectId: string;
  severity: string;
  tca: string;
  probabilityOfCollision: number;
  missDistanceMeters: number;
  relativeVelocityKms: number;
  relativeSpeedKmh: number;
  combinedUncertaintyKm: number;
  screeningVolumeKm: [number, number, number];
  hardBodyRadiusM: number;
  bPlane?: { xiKm: number; zetaKm: number };
  covariance?: { sigma1: number; sigma2: number; orientationDeg: number };
  assessment: string;
  acknowledged: boolean;
  watchlisted: boolean;
}

const CONJUNCTIONS: Conjunction[] = [
  {
    id: "CD-2024-0526-0417", satelliteId: "SAT-51656", objectId: "OBJ-8821",
    severity: "critical", tca: "2024-05-26T04:32:18Z",
    probabilityOfCollision: 0.00032, missDistanceMeters: 742,
    relativeVelocityKms: 15.29, relativeSpeedKmh: 55041,
    combinedUncertaintyKm: 1.29, screeningVolumeKm: [10, 10, 10],
    hardBodyRadiusM: 60, bPlane: { xiKm: 0, zetaKm: -0.742 },
    covariance: { sigma1: 1.05, sigma2: 0.74, orientationDeg: 42.5 },
    assessment: "Pc exceeds 10^-4 maneuver threshold. Collision-avoidance burn recommended.",
    acknowledged: false, watchlisted: true,
  },
  {
    id: "CD-2024-0526-0912", satelliteId: "SAT-44804", objectId: "OBJ-3421",
    severity: "high", tca: "2024-05-26T11:15:42Z",
    probabilityOfCollision: 0.0000076, missDistanceMeters: 1180,
    relativeVelocityKms: 11.2, relativeSpeedKmh: 40320,
    combinedUncertaintyKm: 0.95, screeningVolumeKm: [8, 8, 8],
    hardBodyRadiusM: 50, bPlane: { xiKm: 0.3, zetaKm: -1.14 },
    covariance: { sigma1: 0.82, sigma2: 0.56, orientationDeg: 38.1 },
    assessment: "Elevated risk. Monitor closely; next CDM update in 6 hours.",
    acknowledged: false, watchlisted: true,
  },
  {
    id: "CD-2024-0526-1542", satelliteId: "SAT-54361", objectId: "OBJ-1123",
    severity: "medium", tca: "2024-05-26T15:42:09Z",
    probabilityOfCollision: 0.0000012, missDistanceMeters: 3820,
    relativeVelocityKms: 9.4, relativeSpeedKmh: 33840,
    combinedUncertaintyKm: 0.72, screeningVolumeKm: [6, 6, 6],
    hardBodyRadiusM: 45, bPlane: { xiKm: 0.8, zetaKm: -3.73 },
    covariance: { sigma1: 0.65, sigma2: 0.41, orientationDeg: 55.3 },
    assessment: "Low-moderate risk. No maneuver required at this time.",
    acknowledged: true, watchlisted: false,
  },
  {
    id: "CD-2024-0525-2108", satelliteId: "SAT-58694", objectId: "OBJ-7781",
    severity: "high", tca: "2024-05-25T21:08:33Z",
    probabilityOfCollision: 0.0000023, missDistanceMeters: 5600,
    relativeVelocityKms: 12.8, relativeSpeedKmh: 46080,
    combinedUncertaintyKm: 1.1, screeningVolumeKm: [10, 10, 10],
    hardBodyRadiusM: 55, bPlane: { xiKm: -0.5, zetaKm: -5.56 },
    covariance: { sigma1: 0.95, sigma2: 0.62, orientationDeg: 30.2 },
    assessment: "Historical conjunction (past TCA). Data retained for analysis.",
    acknowledged: true, watchlisted: false,
  },
  {
    id: "CD-2024-0524-1430", satelliteId: "SAT-58990", objectId: "OBJ-9912",
    severity: "low", tca: "2024-05-24T14:30:55Z",
    probabilityOfCollision: 0.00000031, missDistanceMeters: 8100,
    relativeVelocityKms: 7.6, relativeSpeedKmh: 27360,
    combinedUncertaintyKm: 0.5, screeningVolumeKm: [5, 5, 5],
    hardBodyRadiusM: 40, bPlane: { xiKm: 1.2, zetaKm: -7.99 },
    covariance: { sigma1: 0.48, sigma2: 0.33, orientationDeg: 62.1 },
    assessment: "Negligible risk. Object in MEO, no action required.",
    acknowledged: true, watchlisted: false,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");

  const urlPath = req.url?.split("?")[0] || "";

  // GET /api/v1/debris — list all
  if (urlPath === "/api/v1/debris" || urlPath === "/api/v1/debris/") {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = req.query.type as string | undefined;
    const risk = req.query.risk as string | undefined;
    const q = ((req.query.q as string) || "").toLowerCase();

    let filtered = [...DEBRIS_OBJECTS];
    if (type) filtered = filtered.filter((d) => d.type === type);
    if (risk) filtered = filtered.filter((d) => d.riskLevel === risk);
    if (q) filtered = filtered.filter((d) =>
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.noradId?.toString().includes(q) ||
      d.origin.toLowerCase().includes(q) ||
      d.sourceMission.toLowerCase().includes(q)
    );

    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    res.status(200).json({ items, total, page, limit });
    return;
  }

  // GET /api/v1/debris/:id — single object
  const idMatch = urlPath.match(/^\/api\/v1\/debris\/([^/]+)$/);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const debris = DEBRIS_OBJECTS.find((d) => d.id === id);
    if (!debris) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: `Debris ${id} not found` } });
      return;
    }

    // Sub-route: /:id/conjunctions
    if (req.url?.includes("/conjunctions")) {
      const related = CONJUNCTIONS.filter((c) => c.objectId === debris.id);
      res.status(200).json(related);
      return;
    }

    // Sub-route: /:id/geometry
    if (req.url?.includes("/geometry")) {
      const el = debris.elements;
      const EARTH_R = 6378;
      res.status(200).json({
        id: debris.id,
        noradId: debris.noradId,
        type: debris.type,
        orbitalElements: debris.elements,
        orbitRing: [],
      });
      return;
    }

    res.status(200).json(debris);
    return;
  }

  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
}
