/* SOS — Netlify Function: /.netlify/functions/api
 * Catch-all for /api/v1/* routes not handled by dedicated functions.
 * Returns mock data for endpoints used by the frontend.
 */

const CONJUNCTIONS = [
  { id: "CD-2024-0526-0417", satelliteId: "SAT-51656", objectId: "OBJ-8821", severity: "critical", tca: "2024-05-26T04:32:18Z", probabilityOfCollision: 0.00032, missDistanceMeters: 742, relativeVelocityKms: 15.29, relativeSpeedKmh: 55041, combinedUncertaintyKm: 1.29, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 60, bPlane: { xiKm: 0, zetaKm: -0.742 }, covariance: { sigma1: 1.05, sigma2: 0.74, orientationDeg: 42.5 }, assessment: "Pc exceeds 10^-4 maneuver threshold. Collision-avoidance burn recommended.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-0912", satelliteId: "SAT-44804", objectId: "OBJ-3421", severity: "high", tca: "2024-05-26T11:15:42Z", probabilityOfCollision: 0.0000076, missDistanceMeters: 1180, relativeVelocityKms: 11.2, relativeSpeedKmh: 40320, combinedUncertaintyKm: 0.95, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 50, bPlane: { xiKm: 0.3, zetaKm: -1.14 }, covariance: { sigma1: 0.82, sigma2: 0.56, orientationDeg: 38.1 }, assessment: "Elevated risk. Monitor closely; next CDM update in 6 hours.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-1542", satelliteId: "SAT-54361", objectId: "OBJ-1123", severity: "medium", tca: "2024-05-26T15:42:09Z", probabilityOfCollision: 0.0000012, missDistanceMeters: 3820, relativeVelocityKms: 9.4, relativeSpeedKmh: 33840, combinedUncertaintyKm: 0.72, screeningVolumeKm: [6, 6, 6], hardBodyRadiusM: 45, bPlane: { xiKm: 0.8, zetaKm: -3.73 }, covariance: { sigma1: 0.65, sigma2: 0.41, orientationDeg: 55.3 }, assessment: "Low-moderate risk. No maneuver required at this time.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0525-2108", satelliteId: "SAT-58694", objectId: "OBJ-7781", severity: "high", tca: "2024-05-25T21:08:33Z", probabilityOfCollision: 0.0000023, missDistanceMeters: 5600, relativeVelocityKms: 12.8, relativeSpeedKmh: 46080, combinedUncertaintyKm: 1.1, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 55, bPlane: { xiKm: -0.5, zetaKm: -5.56 }, covariance: { sigma1: 0.95, sigma2: 0.62, orientationDeg: 30.2 }, assessment: "Historical conjunction (past TCA). Data retained for analysis.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0524-1430", satelliteId: "SAT-58990", objectId: "OBJ-9912", severity: "low", tca: "2024-05-24T14:30:55Z", probabilityOfCollision: 0.00000031, missDistanceMeters: 8100, relativeVelocityKms: 7.6, relativeSpeedKmh: 27360, combinedUncertaintyKm: 0.5, screeningVolumeKm: [5, 5, 5], hardBodyRadiusM: 40, bPlane: { xiKm: 1.2, zetaKm: -7.99 }, covariance: { sigma1: 0.48, sigma2: 0.33, orientationDeg: 62.1 }, assessment: "Negligible risk. Object in MEO, no action required.", acknowledged: true, watchlisted: false },
];

const SATELLITES = [
  { id: "SAT-51656", noradId: 51656, name: "EOS-4", alias: "RISAT-1A", operator: "ISRO", category: "LEO · SSO", status: "operational", elements: { altitudeKm: 529, inclinationDeg: 97.5, raanDeg: 305.2, eccentricity: 0.00019, periodMin: 95.2, argPerigeeDeg: 178.4 } },
  { id: "SAT-44804", noradId: 44804, name: "CARTOSAT-3", alias: "Cartosat-3", operator: "ISRO", category: "LEO · SSO", status: "operational", elements: { altitudeKm: 508, inclinationDeg: 97.4, raanDeg: 132.4, eccentricity: 0.00013, periodMin: 94.8, argPerigeeDeg: 45.3 } },
  { id: "SAT-54361", noradId: 54361, name: "EOS-6", alias: "Oceansat-3", operator: "ISRO", category: "LEO · SSO", status: "operational", elements: { altitudeKm: 743, inclinationDeg: 98.4, raanDeg: 245.8, eccentricity: 0.0002, periodMin: 99.3, argPerigeeDeg: 112.5 } },
  { id: "SAT-40930", noradId: 40930, name: "ASTROSAT", alias: "AstroSat", operator: "ISRO", category: "LEO · Equatorial", status: "operational", elements: { altitudeKm: 650, inclinationDeg: 6.0, raanDeg: 88.9, eccentricity: 0.00024, periodMin: 97.3, argPerigeeDeg: 240.1 } },
  { id: "SAT-58990", noradId: 58990, name: "INSAT-3DS", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 78.2, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-45026", noradId: 45026, name: "GSAT-30", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 83.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-52898", noradId: 52898, name: "GSAT-24", alias: "RANDEV", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 83.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-44035", noradId: 44035, name: "GSAT-31", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 93.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-43864", noradId: 43864, name: "GSAT-7A", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 55.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-41752", noradId: 41752, name: "INSAT-3DR", operator: "ISRO", category: "GEO", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 74.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-56759", noradId: 56759, name: "NVS-01", alias: "IRNSS-1J", operator: "ISRO", category: "GSO · Inclined", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 29.0, raanDeg: 250.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-39635", noradId: 39635, name: "IRNSS-1B", operator: "ISRO", category: "GSO · Inclined", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 29.0, raanDeg: 55.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-40269", noradId: 40269, name: "IRNSS-1C", operator: "ISRO", category: "GSO · Inclined", status: "operational", elements: { altitudeKm: 35786, inclinationDeg: 29.0, raanDeg: 83.0, eccentricity: 0.00021, periodMin: 1436, argPerigeeDeg: 30.0 } },
  { id: "SAT-44233", noradId: 44233, name: "RISAT-2B", operator: "ISRO", category: "LEO", status: "operational", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 220.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 90.0 } },
  { id: "SAT-44857", noradId: 44857, name: "RISAT-2BR1", operator: "ISRO", category: "LEO", status: "operational", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 215.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 85.0 } },
  { id: "SAT-37387", noradId: 37387, name: "RESOURCESAT-2", alias: "Resourcesat-2", operator: "ISRO", category: "LEO", status: "operational", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 230.0, eccentricity: 0.001, periodMin: 101.4, argPerigeeDeg: 100.0 } },
  { id: "SAT-41877", noradId: 41877, name: "RESOURCESAT-2A", alias: "Resourcesat-2A", operator: "ISRO", category: "LEO", status: "operational", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 235.0, eccentricity: 0.001, periodMin: 101.4, argPerigeeDeg: 105.0 } },
  { id: "SAT-42767", noradId: 42767, name: "CARTOSAT-2E", alias: "Cartosat-2E", operator: "ISRO", category: "LEO", status: "operational", elements: { altitudeKm: 505, inclinationDeg: 97.5, raanDeg: 240.0, eccentricity: 0.001, periodMin: 94.7, argPerigeeDeg: 110.0 } },
  { id: "SAT-39086", noradId: 39086, name: "SARAL", operator: "ISRO/CNES", category: "LEO · SSO", status: "operational", elements: { altitudeKm: 790, inclinationDeg: 98.5, raanDeg: 245.0, eccentricity: 0.001, periodMin: 100.8, argPerigeeDeg: 115.0 } },
];

const GROUND_STATIONS = [
  { id: "GS-001", name: "Sriharikota (SHAR)", lat: 13.72, lon: 80.23, status: "online", coverage: "LEO/GTO", antennas: 4 },
  { id: "GS-002", name: "Bangalore (ISDC)", lat: 12.97, lon: 77.59, status: "online", coverage: "LEO", antennas: 2 },
  { id: "GS-003", name: "Hassan", lat: 13.01, lon: 76.1, status: "online", coverage: "LEO/MEO", antennas: 3 },
  { id: "GS-004", name: "Port Blair", lat: 11.62, lon: 92.73, status: "online", coverage: "LEO", antennas: 2 },
  { id: "GS-005", name: "Bhopal", lat: 23.26, lon: 77.41, status: "degraded", coverage: "GEO", antennas: 1 },
  { id: "GS-006", name: "Lucknow", lat: 26.85, lon: 80.95, status: "online", coverage: "LEO/GEO", antennas: 3 },
];

function buildResponse(path, method, body) {
  const segments = path.replace(/^\/api\/v1\/?/, "").split("/").filter(Boolean);
  const resource = segments[0] || "";

  // Conjunctions
  if (resource === "conjunctions") {
    if (segments[1] === "critical") return CONJUNCTIONS.filter((c) => c.severity === "critical");
    if (segments[1] === "summary") return { total: CONJUNCTIONS.length, critical: CONJUNCTIONS.filter((c) => c.severity === "critical").length, high: CONJUNCTIONS.filter((c) => c.severity === "high").length, medium: CONJUNCTIONS.filter((c) => c.severity === "medium").length, low: CONJUNCTIONS.filter((c) => c.severity === "low").length };
    if (segments[1] === "upcoming") return CONJUNCTIONS.slice(0, 5);
    if (segments[1] === "timeline") return CONJUNCTIONS.map((c) => ({ id: c.id, tca: c.tca, severity: c.severity, satelliteId: c.satelliteId, objectId: c.objectId }));
    if (segments[1]) {
      const conj = CONJUNCTIONS.find((c) => c.id === segments[1]);
      if (!conj) return { error: { code: "NOT_FOUND", message: "Conjunction not found" } };
      if (segments[2] === "geometry") return { primary: SATELLITES.find((s) => s.id === conj.satelliteId) || {}, secondary: { id: conj.objectId }, missDistanceMeters: conj.missDistanceMeters };
      if (segments[2] === "objects") return { primary: SATELLITES.find((s) => s.id === conj.satelliteId) || {}, secondary: { id: conj.objectId } };
      if (segments[2] === "history") return [{ epoch: conj.tca, missDistanceMeters: conj.missDistanceMeters, probabilityOfCollision: conj.probabilityOfCollision }];
      if (segments[2] === "cdms") return [{ id: conj.id, tca: conj.tca, severity: conj.severity, probabilityOfCollision: conj.probabilityOfCollision }];
      if (segments[2] === "watchlist" && method === "POST") { conj.watchlisted = !conj.watchlisted; return conj; }
      if (segments[2] === "acknowledge" && method === "POST") { conj.acknowledged = true; return conj; }
      return conj;
    }
    return { items: CONJUNCTIONS, total: CONJUNCTIONS.length, page: 1, limit: 20 };
  }

  // Satellites
  if (resource === "satellites") {
    if (segments[1]) {
      const sat = SATELLITES.find((s) => s.id === segments[1] || s.noradId?.toString() === segments[1]);
      if (!sat) return { error: { code: "NOT_FOUND", message: "Satellite not found" } };
      if (segments[2] === "conjunctions") return CONJUNCTIONS.filter((c) => c.satelliteId === sat.id);
      if (segments[2] === "tle") return { line1: "1 " + sat.noradId + "U 22013A   26238.81095876  .00001619  00000+0  96109-4 0  9998", line2: "2 " + sat.noradId + "  97.5143 244.5852 0001884  84.4810 275.6635 15.12735239250199" };
      if (segments[2] === "subsystems") return [{ name: "Power", status: "nominal" }, { name: "Communications", status: "nominal" }, { name: "Propulsion", status: "nominal" }, { name: "ADCS", status: "nominal" }];
      if (segments[2] === "events") return [{ type: "tle_update", timestamp: new Date().toISOString(), description: "TLE data refreshed from CelesTrak" }];
      if (segments[2] === "passes") return [];
      return sat;
    }
    const page = parseInt(new URL("http://x?" + (segments.join("/").includes("?") ? segments.join("/").split("?")[1] : "")).searchParams.get("page")) || 1;
    return { items: SATELLITES, total: SATELLITES.length, page, limit: 100 };
  }

  // Dashboard KPIs
  if (resource === "dashboard" && segments[1] === "kpis") {
    return { activeSatellites: 19, conjunctionAlerts: CONJUNCTIONS.filter((c) => !c.acknowledged).length, maneuversPlanned: 3, systemHealth: 98, dataLatency: "0.7s", trackingSources: 38 };
  }

  // Network status
  if (resource === "network" && segments[1] === "status") {
    return { status: "operational", uptime: "99.97%", latency: "0.7s", coverage: "95%", sources: 38, lastSync: new Date().toISOString() };
  }

  // Ground stations
  if (resource === "groundstations") return GROUND_STATIONS;

  // Analytics
  if (resource === "analytics") {
    if (segments[1] === "summary") return { totalConjunctions: CONJUNCTIONS.length, criticalEvents: CONJUNCTIONS.filter((c) => c.severity === "critical").length, resolvedEvents: 12, averageMissDistance: 3200 };
    if (segments[1] === "conjunctions-over-time") return [{ month: "2024-01", count: 3 }, { month: "2024-02", count: 5 }, { month: "2024-03", count: 2 }, { month: "2024-04", count: 7 }, { month: "2024-05", count: 4 }];
    if (segments[1] === "by-severity") return [{ regime: "LEO", critical: 1, high: 2, medium: 1, low: 1 }, { regime: "GEO", critical: 0, high: 0, medium: 0, low: 1 }];
    if (segments[1] === "top-objects") return [{ id: "OBJ-8821", name: "Fengyun-1C Fragment", conjunctions: 3 }, { id: "OBJ-3421", name: "Cosmos 2519", conjunctions: 1 }, { id: "OBJ-1123", name: "PSLV R/B", conjunctions: 1 }];
    if (segments[1] === "by-altitude-band") return [{ band: "400-500 km", count: 3 }, { band: "500-600 km", count: 1 }, { band: "600-800 km", count: 1 }];
    if (segments[1] === "report") return { title: "SSA Analytics Report", period: "2024-Q2", generatedAt: new Date().toISOString(), summary: "5 active conjunction events, 1 critical." };
    return {};
  }

  // Catalog stats
  if (resource === "catalog" && segments[1] === "stats") return { trackedObjects: 124, conjunctions: CONJUNCTIONS.length, launches: 2, fragments: 45, rocketBodies: 18, payloads: 56 };

  // Events feed
  if (resource === "events" && segments[1] === "feed") return [{ type: "conjunction", message: "Critical conjunction: SAT-51656 ↔ OBJ-8821", timestamp: new Date().toISOString(), severity: "critical" }, { type: "maneuver", message: "Collision avoidance maneuver planned for SAT-51656", timestamp: new Date().toISOString(), severity: "high" }];

  // AI assessments
  if (resource === "ai" && segments[1] === "assessments") return [{ id: "AI-001", type: "risk", title: "Critical debris threat to EOS-4", confidence: 0.94, recommendation: "Execute collision avoidance maneuver within 12 hours" }];

  // Maneuvers
  if (resource === "maneuvers") {
    if (segments[1] === "next") return { id: "MP-001", satelliteId: "SAT-51656", deltaV: 0.8, fuelMass: 0.12, planned: true, status: "ready" };
    if (segments[1] === "plans") return [{ id: "MP-001", satelliteId: "SAT-51656", deltaV: 0.8, status: "ready" }];
    return {};
  }

  // Auth
  if (resource === "auth" && segments[1] === "me") return { user: "operator@isro.gov.in", role: "admin", name: "Mission Controller" };

  // Notifications
  if (resource === "notifications") return [];

  // Settings
  if (resource === "settings") return { notifications: true, emailAlerts: true, autoAcknowledge: false, thresholdPc: 0.0001, thresholdMiss: 5000 };

  // Audit
  if (resource === "audit") return [];

  // Fallback
  return { message: "Endpoint not implemented in Netlify mode" };
}

exports.handler = async (event) => {
  const path = event.path || "";
  const method = event.httpMethod || "GET";
  let body = null;
  if (event.body) { try { body = JSON.parse(event.body); } catch (e) {} }

  const result = buildResponse(path, method, body);
  const is404 = result && result.error;

  return {
    statusCode: is404 ? 404 : 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    body: JSON.stringify(result),
  };
};
