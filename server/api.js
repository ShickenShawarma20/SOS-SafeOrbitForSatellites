/* SOS backend prototype — /api/v1 REST routes */
"use strict";

const express = require("express");
const store = require("./store");

const router = express.Router();
const {
  state, satellites, debris, conjunctions, cdmSeries, historyEvents,
  maneuverPlans, addAudit, createJob, pushFeed,
} = store;

/* ---------- helpers ---------- */
function findSat(id) { return satellites.find((s) => s.id === id); }
function findConj(id) { return conjunctions.find((c) => c.id === id); }
function findPlan(id) { return maneuverPlans.find((p) => p.id === id); }

function enrichConj(c) {
  return { ...c };
}

function paginated(items, page, limit) {
  const p = Math.max(parseInt(page || "1", 10), 1);
  const l = Math.min(Math.max(parseInt(limit || "50", 10), 1), 200);
  return { items: items.slice((p - 1) * l, p * l), total: items.length, page: p, limit: l };
}

/* ---------- Dashboard ---------- */

router.get("/dashboard/kpis", (_req, res) => {
  res.json({
    activeSatellites: 124,
    conjunctionAlerts: conjunctions.filter((c) => !c.acknowledged).length + 7,
    maneuversPlanned: maneuverPlans.filter((p) => p.approvalStatus !== "executed").length,
    systemHealthPct: state.network.systemHealthPct,
    trackingSourcesOnline: state.network.trackingSourcesOnline,
    dataLatencySec: state.network.latencySec,
    coveragePct: state.network.coveragePct,
  });
});

router.get("/events/feed", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  res.json({ items: state.feed.slice(0, limit) });
});

router.get("/fleet/fuel-summary", (_req, res) => {
  const s = findSat("SAT-042");
  res.json(s.fuel);
});

/* ---------- Conjunctions ---------- */

router.get("/conjunctions", (req, res) => {
  let list = [...conjunctions];
  if (req.query.severity) list = list.filter((c) => c.severity === req.query.severity);
  if (req.query.satelliteId) list = list.filter((c) => c.satelliteId === req.query.satelliteId);
  if (req.query.active === "true") list = list.filter((c) => !c.acknowledged);
  res.json(paginated(list.map(enrichConj), req.query.page, req.query.limit));
});

router.get("/conjunctions/critical", (_req, res) => {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const active = conjunctions.filter((c) => !c.acknowledged);
  if (!active.length) return res.status(404).json({ error: { code: "NO_ACTIVE_CONJUNCTIONS", message: "No active conjunctions" } });
  active.sort((a, b) => order[a.severity] - order[b.severity] || a.tca.localeCompare(b.tca));
  res.json(enrichConj(active[0]));
});

router.get("/conjunctions/summary", (req, res) => {
  void req;
  res.json({ windowHours: 48, total: 12, bySeverity: { critical: 1, high: 3, medium: 8, low: 0 } });
});

router.get("/conjunctions/upcoming", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "5", 10), 50);
  res.json({ items: conjunctions.slice(0, limit).map(enrichConj) });
});

router.get("/conjunctions/timeline", (_req, res) => {
  const windowH = 12;
  const nowMs = Date.now();
  const tcaRef = new Date(conjunctions[0].tca).getTime();
  const lanes = ["SAT-042", "SAT-078", "SAT-021", "SAT-033"].map((sid) => ({
    satelliteId: sid,
    events: conjunctions
      .filter((c) => c.satelliteId === sid)
      .map((c) => {
        const offsetH = ((new Date(c.tca).getTime() - nowMs) / 3600000);
        const pct = Math.max(Math.min(((offsetH + windowH) / (windowH * 2)) * 100, 99), 1);
        return {
          conjunctionId: c.id,
          severity: c.severity,
          offsetHours: Number(offsetH.toFixed(1)),
          positionPct: Number(pct.toFixed(1)),
          probabilityOfCollision: c.probabilityOfCollision,
        };
      }),
  }));
  void tcaRef;
  res.json({ windowHours: windowH, lanes });
});

router.get("/conjunctions/:id", (req, res) => {
  const c = findConj(req.params.id);
  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: `Conjunction ${req.params.id} not found` } });
  res.json(enrichConj(c));
});

router.get("/conjunctions/:id/cdms", (req, res) => {
  const series = cdmSeries[req.params.id] || [];
  res.json({
    items: series.map((cdm, i, arr) => ({
      ...cdm,
      trendPct: i > 0 ? Number((((cdm.probabilityOfCollision - arr[i - 1].probabilityOfCollision) / arr[i - 1].probabilityOfCollision) * 100).toFixed(1)) : null,
      format: "CCSDS 508.0-B-1",
    })),
  });
});

router.get("/conjunctions/:id/history", (req, res) => {
  res.json({ items: historyEvents[req.params.id] || [] });
});

router.get("/conjunctions/:id/objects", (req, res) => {
  const c = findConj(req.params.id);
  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  const sat = findSat(c.satelliteId);
  const obj = debris.find((d) => d.id === c.objectId);
  res.json({ primary: sat, secondary: obj });
});

router.get("/conjunctions/:id/geometry", (req, res) => {
  const c = findConj(req.params.id);
  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  res.json({
    conjunctionId: c.id,
    tca: c.tca,
    missDistanceMeters: c.missDistanceMeters,
    bPlane: c.bPlane,
    covariance: c.covariance,
    trajectories: {
      primaryOrbitKm: samplePrimary(c),
      secondaryOrbitKm: sampleSecondary(c),
    },
  });
});

function samplePrimary(c) {
  const sat = findSat(c.satelliteId);
  const r = 6378 + (sat ? sat.elements.altitudeKm : 450);
  return circle(r);
}
function sampleSecondary(c) {
  const obj = debris.find((d) => d.id === c.objectId);
  const r = 6378 + (obj ? obj.elements.altitudeKm : 450);
  return circle(r);
}
function circle(r, steps = 72) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [Number((r * Math.cos(a)).toFixed(2)), 0, Number((r * Math.sin(a)).toFixed(2))];
  });
}

router.post("/conjunctions/:id/watchlist", (req, res) => {
  const c = findConj(req.params.id);
  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  c.watchlisted = !c.watchlisted;
  addAudit("WATCHLIST_TOGGLED", c.id, `watchlisted=${c.watchlisted}`);
  res.json({ id: c.id, watchlisted: c.watchlisted });
});

router.post("/conjunctions/:id/acknowledge", (req, res) => {
  const c = findConj(req.params.id);
  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  c.acknowledged = true;
  addAudit("ACKNOWLEDGED", c.id, "alert silenced");
  pushFeed("info", `Alert acknowledged: ${c.satelliteId} \u2194 ${c.objectId}`);
  res.json({ id: c.id, acknowledged: c.acknowledged });
});

/* ---------- Satellites ---------- */

router.get("/satellites", (req, res) => {
  let list = [...satellites];
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    list = list.filter((s) =>
      s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) || String(s.noradId).includes(q));
  }
  if (req.query.status) list = list.filter((s) => s.status === req.query.status);
  if (req.query.type) list = list.filter((s) => s.type === req.query.type);
  res.json(paginated(list, req.query.page, req.query.limit));
});

router.get("/satellites/:id", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: `Satellite ${req.params.id} not found` } });
  res.json(s);
});

router.get("/satellites/:id/tle", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  res.type("text/plain").send(`${s.elements.tle.line1}\n${s.elements.tle.line2}\n`);
});

router.get("/satellites/:id/fuel", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  res.json(s.fuel);
});

router.get("/satellites/:id/subsystems", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  res.json({ items: s.subsystems });
});

router.get("/satellites/:id/events", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const items = state.feed.slice(0, limit);
  res.json({ items });
});

router.get("/satellites/:id/conjunctions", (req, res) => {
  let list = conjunctions.filter((c) => c.satelliteId === req.params.id);
  if (req.query.severity) list = list.filter((c) => c.severity === req.query.severity);
  if (req.query.active === "true") list = list.filter((c) => !c.acknowledged);
  res.json(paginated(list.map(enrichConj), req.query.page, req.query.limit));
});

router.get("/satellites/:id/passes", (req, res) => {
  void req.params;
  res.json({
    items: [
      { aos: "2024-05-25T23:04:11Z", station: "KSAT Svalbard", durationSec: 552, maxElevDeg: 78 },
      { aos: "2024-05-26T00:41:36Z", station: "Fairbanks", durationSec: 468, maxElevDeg: 54 },
      { aos: "2024-05-26T02:19:02Z", station: "Wallops", durationSec: 390, maxElevDeg: 41 },
      { aos: "2024-05-26T03:56:44Z", station: "Santiago", durationSec: 485, maxElevDeg: 66 },
    ],
  });
});

router.get("/satellites/:id/track", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  const spanH = parseInt(req.query.span || "24", 10);
  const stepS = Math.max(parseInt(req.query.step || "60", 10), 10);
  const r = 6378 + s.elements.altitudeKm;
  const steps = Math.min(Math.floor((spanH * 3600) / stepS), 1440);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 * (spanH / s.elements.periodMin * 60);
    points.push({
      t: new Date(Date.now() + i * stepS * 1000).toISOString(),
      eci: [Number((r * Math.cos(a)).toFixed(2)), 0, Number((r * Math.sin(a)).toFixed(2))],
    });
  }
  res.json({ satelliteId: s.id, spanHours: spanH, stepSeconds: stepS, points });
});

/* ---------- Maneuvers ---------- */

router.get("/maneuvers/plans", (req, res) => {
  let list = [...maneuverPlans];
  if (req.query.conjunctionId) list = list.filter((p) => p.conjunctionId === req.query.conjunctionId);
  res.json({ items: list });
});

router.get("/maneuvers/next", (_req, res) => {
  const plan = maneuverPlans.find((p) => p.recommended) || maneuverPlans[0];
  res.json(plan);
});

router.get("/maneuvers/plans/:planId", (req, res) => {
  const p = findPlan(req.params.planId);
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Plan not found" } });
  res.json(p);
});

router.post("/maneuvers/simulate", (req, res) => {
  const { planId } = req.body || {};
  const plan = planId && findPlan(planId);
  if (!plan) return res.status(400).json({ error: { code: "BAD_PLAN", message: "planId is required and must reference an existing plan" } });
  const job = createJob("simulate_plan", 6000);
  addAudit("SIMULATION_STARTED", plan.id, `job=${job.id}`);
  res.status(202).json({ jobId: job.id, status: job.status });
});

router.get("/jobs/:jobId", (req, res) => {
  const job = state.jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Job not found" } });
  res.json(job);
});

router.post("/maneuvers/plans/:planId/submit", (req, res) => {
  const p = findPlan(req.params.planId);
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Plan not found" } });
  p.approvalStatus = "pending_approval";
  addAudit("PLAN_SUBMITTED", p.id, "queued for mission-director approval");
  pushFeed("medium", `Maneuver plan ${p.label} submitted for approval`);
  broadcastMsr(p);
  res.json({ id: p.id, approvalStatus: p.approvalStatus });
});

router.post("/approvals/:planId/approve", (req, res) => {
  const p = findPlan(req.params.planId);
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Plan not found" } });
  p.approvalStatus = "approved";
  addAudit("PLAN_APPROVED", p.id, "approved; queued to command scheduler");
  pushFeed("nominal", `Maneuver plan ${p.label} approved`);
  broadcastMsr(p);
  res.json({ id: p.id, approvalStatus: p.approvalStatus });
});

router.post("/approvals/:planId/reject", (req, res) => {
  const p = findPlan(req.params.planId);
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Plan not found" } });
  p.approvalStatus = "rejected";
  addAudit("PLAN_REJECTED", p.id, req.body?.reason || "");
  broadcastMsr(p);
  res.json({ id: p.id, approvalStatus: p.approvalStatus });
});

router.get("/approvals", (_req, res) => {
  res.json({ items: maneuverPlans.filter((p) => p.approvalStatus === "pending_approval") });
});

function broadcastMsr(p) {
  store.broadcast({ type: "maneuver.status", payload: { planId: p.id, label: p.label, status: p.approvalStatus } });
}

router.get("/maneuvers/plans/:planId/export", (req, res) => {
  const p = findPlan(req.params.planId);
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Plan not found" } });
  const format = String(req.query.format || "json").toLowerCase();
  if (format === "xml") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<maneuverPlan id="${p.id}">\n  <satellite>${p.satelliteId}</satellite>\n  <conjunction>${p.conjunctionId}</conjunction>\n  <label>${p.label}</label>\n  <direction>${p.direction}</direction>\n  <deltaVmps>${p.deltaVmps}</deltaVmps>\n  <burnWindow earliest="${p.burnWindow.earliest}" latest="${p.burnWindow.latest}"/>\n  <newMissDistanceKm>${p.newMissDistanceKm}</newMissDistanceKm>\n  <riskReductionPct>${p.riskReductionPct}</riskReductionPct>\n</maneuverPlan>\n`;
    res.setHeader("Content-Disposition", `attachment; filename="${p.id}.xml"`);
    return res.type("application/xml").send(xml);
  }
  res.setHeader("Content-Disposition", `attachment; filename="${p.id}.json"`);
  res.json(p);
});

router.get("/analytics/report/export", (req, res) => {
  const range = String(req.query.range || "30d");
  const format = String(req.query.format || "csv").toLowerCase();
  addAudit("REPORT_EXPORTED", `analytics/${range}`, `format=${format}`);
  if (format === "pdf") {
    // Prototype: serve a minimal text placeholder with PDF content-type
    res.setHeader("Content-Disposition", `attachment; filename="sos-report-${range}.txt"`);
    return res.type("text/plain").send(`SOS Analytics Report (${range})\n================================\nTotal conjunctions: 156\nAverage Pc: 4.2e-5\nManeuvers executed: 7\nRisk reduction: 94.6%\n`);
  }
  const rows = [
    "metric,value,trend_vs_prev_period",
    "total_conjunctions,156,+12.3%",
    "average_pc,4.2e-5,-8.1%",
    "maneuvers_executed,7,+2",
    "risk_reduction_pct,94.6,+1.9pts",
    "",
    "regime,critical,high,medium",
    "LEO,3,9,21",
    "MEO,1,4,7",
    "GEO,2,5,9",
    "HEO,0,2,4",
  ];
  res.setHeader("Content-Disposition", `attachment; filename="sos-report-${range}.csv"`);
  res.type("text/csv").send(rows.join("\n") + "\n");
});

router.get("/satellites/:id/telemetry/latest", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  const jitter = (v, pct) => Number((v * (1 + (Math.random() - 0.5) * pct)).toFixed(2));
  res.json({
    satelliteId: s.id,
    time: new Date().toISOString(),
    busVoltageV: jitter(28.4, 0.02),
    batteryPct: Math.round(jitter(87, 0.05)),
    temperatureC: { bus: jitter(18.2, 0.08), panel: jitter(-42.5, 0.12), propulsion: jitter(21.7, 0.06) },
    attitudeDeg: { roll: jitter(0.14, 1), pitch: jitter(-0.22, 1), yaw: jitter(0.09, 1) },
    signalStrengthDbm: jitter(-98.6, 0.03),
    dataRateMbps: jitter(150, 0.05),
    orbit: s.elements,
  });
});

router.get("/satellites/:id/files", (req, res) => {
  const s = findSat(req.params.id);
  if (!s) return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
  const base = [
    { id: `${s.id}-F01`, name: "ICD_GroundSegment.pdf", type: "Interface Control", sizeKb: 2410 },
    { id: `${s.id}-F02`, name: "Operations_Handbook.pdf", type: "Manual", sizeKb: 5820 },
    { id: `${s.id}-F03`, name: "Telemetry_Decomm_map.xlsx", type: "Reference", sizeKb: 860 },
    { id: `${s.id}-F04`, name: "Launch_Separation_Report.pdf", type: "Report", sizeKb: 1240 },
    { id: `${s.id}-F05`, name: "Thruster_Characterization.csv", type: "Dataset", sizeKb: 310 },
  ];
  res.json({
    items: base.map((f) => ({ ...f, url: `/api/v1/satellites/${s.id}/tle` })),
    total: s.filesCount,
  });
});

/* ---------- Ground stations & network ---------- */

router.get("/groundstations", (_req, res) => {
  res.json({ items: state.groundStations });
});

router.get("/network/status", (_req, res) => {
  res.json(state.network);
});

/* ---------- Analytics ---------- */

router.get("/analytics/summary", (req, res) => {
  const range = String(req.query.range || "30d");
  void range;
  res.json({
    totalConjunctions: 156,
    averagePc: 4.2e-5,
    maneuversExecuted: 7,
    riskReductionPct: 94.6,
    trends: {
      totalConjunctionsPct: 12.3,
      averagePcPct: -8.1,
      maneuversExecutedDelta: 2,
      riskReductionPts: 1.9,
    },
  });
});

router.get("/analytics/conjunctions-over-time", (req, res) => {
  res.json({
    bucket: req.query.bucket || "week",
    series: [14, 11, 17, 13, 19, 15, 22, 18, 24, 20, 26, 23],
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  });
});

router.get("/analytics/by-severity", (_req, res) => {
  res.json({
    groupBy: "regime",
    regimes: [
      { regime: "LEO", critical: 3, high: 9, medium: 21 },
      { regime: "MEO", critical: 1, high: 4, medium: 7 },
      { regime: "GEO", critical: 2, high: 5, medium: 9 },
      { regime: "HEO", critical: 0, high: 2, medium: 4 },
    ],
  });
});

router.get("/analytics/top-objects", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "5", 10), 20);
  res.json({
    items: [
      { objectId: "OBJ-8821", count: 14 },
      { objectId: "OBJ-3421", count: 11 },
      { objectId: "CZ-6 DEB", count: 9 },
      { objectId: "SL-16 R/B", count: 7 },
      { objectId: "OBJ-1123", count: 5 },
    ].slice(0, limit),
  });
});

router.get("/analytics/by-altitude-band", (_req, res) => {
  res.json({
    bands: [
      { bandKm: "<400", count: 18 },
      { bandKm: "400-550", count: 34 },
      { bandKm: "550-700", count: 27 },
      { bandKm: "700-1000", count: 19 },
      { bandKm: ">1000", count: 11 },
    ],
  });
});

/* ---------- Catalog, weather, search, notifications, settings, audit ---------- */

router.get("/catalog/stats", (_req, res) => {
  res.json(state.catalog);
});

router.get("/spaceweather/current", (_req, res) => {
  res.json(state.spaceWeather);
});

router.get("/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  if (!q) return res.json({ satellites: [], objects: [], conjunctions: [] });
  res.json({
    satellites: satellites.filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 5),
    objects: debris.filter((d) => d.id.toLowerCase().includes(q)).slice(0, 5),
    conjunctions: conjunctions.filter((c) => c.id.toLowerCase().includes(q) || c.objectId.toLowerCase().includes(q)).slice(0, 5),
  });
});

router.get("/notifications", (req, res) => {
  let items = state.notifications;
  if (req.query.unread === "true") items = items.filter((n) => !n.read);
  res.json({ items, unreadCount: state.notifications.filter((n) => !n.read).length });
});

router.post("/notifications/read-all", (_req, res) => {
  state.notifications.forEach((n) => (n.read = true));
  res.json({ ok: true });
});

router.post("/notifications/:id/read", (req, res) => {
  const n = state.notifications.find((x) => x.id === req.params.id);
  if (!n) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found" } });
  n.read = true;
  res.json(n);
});

router.get("/settings", (_req, res) => res.json(state.settings));

router.put("/settings", (req, res) => {
  Object.assign(state.settings, req.body || {});
  addAudit("SETTINGS_UPDATED", "settings", JSON.stringify(req.body || {}).slice(0, 120));
  res.json(state.settings);
});

router.get("/audit", (_req, res) => {
  res.json({ items: [...state.auditLog].reverse() });
});

module.exports = router;
