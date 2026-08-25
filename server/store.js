/* SOS backend prototype — in-memory store & domain helpers */
"use strict";

const { satellites, debris } = require("./data.seed");
const { conjunctions, cdmSeries, historyEvents, maneuverPlans } = require("./data.conjunctions");

const state = {
  feed: [
    { id: "E-1", severity: "critical", text: "Conjunction Alert: SAT-042 \u2194 OBJ-8821", time: minutesAgo(2) },
    { id: "E-2", severity: "medium", text: "Tracking Update: OBJ-3421", time: minutesAgo(7) },
    { id: "E-3", severity: "info", text: "Maneuver Completed: SAT-017", time: minutesAgo(18) },
    { id: "E-4", severity: "nominal", text: "New TLE Data Received", time: minutesAgo(21) },
    { id: "E-5", severity: "info", text: "Weather Update: KSAT Ground Station", time: minutesAgo(32) },
  ],
  notifications: [
    { id: "N-1", severity: "critical", text: "Critical conjunction CD-2024-0526-0417 \u2014 Pc 2.8e-4", time: minutesAgo(2), read: false },
    { id: "N-2", severity: "high", text: "CDM-06 received for CD-2024-0526-0417", time: minutesAgo(140), read: false },
    { id: "N-3", severity: "info", text: "Maneuver plan MP-0417-A generated", time: minutesAgo(200), read: true },
  ],
  groundStations: [
    { id: "KSAT-SVA", name: "KSAT Svalbard", lat: 78.23, lon: 15.39, status: "online" },
    { id: "ASC-FRB", name: "Fairbanks", lat: 64.84, lon: -147.72, status: "online" },
    { id: "NSN-WAL", name: "Wallops", lat: 37.94, lon: -75.46, status: "online" },
    { id: "DPA-SCL", name: "Santiago", lat: -33.15, lon: -70.67, status: "online" },
    { id: "SSC-KIR", name: "Kiruna", lat: 67.86, lon: 20.96, status: "online" },
    { id: "ESA-RED", name: "Redu", lat: 50.0, lon: 5.14, status: "online" },
    { id: "CNES-KOY", name: "Kourou", lat: 5.25, lon: -52.8, status: "online" },
    { id: "JAX-MAS", name: "Masuda", lat: 31.57, lon: 131.03, status: "online" },
    { id: "ISB-BLR", name: "Bengaluru", lat: 13.03, lon: 77.51, status: "online" },
    { id: "SAO-CUI", name: "Cuiab\u00e1", lat: -15.6, lon: -56.1, status: "offline" },
    { id: "NZL-AWH", name: "Awarua", lat: -46.53, lon: 168.38, status: "offline" },
  ],
  network: {
    stationsOnline: 32,
    stationsOffline: 2,
    coveragePct: 98.7,
    latencySec: 1.2,
    trackingSourcesOnline: 32,
    systemHealthPct: 98,
  },
  spaceWeather: {
    f107: 148,
    kpIndex: 3.3,
    dragMultiplier: 1.18,
    updated: new Date().toISOString(),
  },
  catalog: {
    trackedObjects: 21430,
    lastTleUpdate: minutesAgo(21),
  },
  settings: {
    pcManeuverThreshold: 1e-4,
    screeningVolumeKm: [10, 10, 10],
    notifyOnSeverity: ["critical", "high"],
    defaultLayers: ["satellites", "debris", "orbit_tracks"],
  },
  operator: {
    name: "Alex Morgan",
    role: "Mission Controller",
    initials: "AM",
  },
  auditLog: [],
  jobs: new Map(),
};

function minutesAgo(mins) {
  return new Date(Date.now() - mins * 60000).toISOString();
}

/* ---- Domain helpers ---- */

function addAudit(action, target, detail) {
  const entry = {
    id: `AUD-${state.auditLog.length + 1}`,
    actor: state.operator.name,
    action,
    target,
    detail: detail || "",
    time: new Date().toISOString(),
  };
  state.auditLog.push(entry);
  pushFeed("info", `${action}: ${target}`);
  return entry;
}

let feedSeq = state.feed.length;
function pushFeed(severity, text) {
  const item = { id: `E-${++feedSeq + 100}`, severity, text, time: new Date().toISOString() };
  state.feed.unshift(item);
  if (state.feed.length > 100) state.feed.pop();
  broadcast({ type: "event.feed", payload: item });
  return item;
}

function createJob(kind, durationMs) {
  const jobId = `JOB-${Date.now()}`;
  const job = { id: jobId, kind, status: "running", progress: 0, stage: "queued", result: null };
  state.jobs.set(jobId, job);
  const steps = ["loading ephemeris", "propagating post-burn trajectory", "secondary conjunction screening", "computing Pc"];
  let pct = 0;
  const timer = setInterval(() => {
    pct += 12 + Math.random() * 14;
    job.stage = steps[Math.min(Math.floor(pct / 26), steps.length - 1)];
    if (pct >= 100) {
      clearInterval(timer);
      job.progress = 100;
      job.status = "complete";
      job.stage = "done";
      job.result = buildSimulationResult();
      broadcast({ type: "job.progress", payload: { jobId, progress: 100, stage: "done" } });
      broadcast({ type: "job.complete", payload: { jobId, result: job.result } });
    } else {
      job.progress = Math.round(pct);
      broadcast({ type: "job.progress", payload: { jobId, progress: job.progress, stage: job.stage } });
    }
  }, Math.max(durationMs / 9, 400));
  return job;
}

function buildSimulationResult() {
  return {
    ok: true,
    secondaryScreeningClear: true,
    screenedObjects: 21430,
    postBurnTrajectory: sampleOrbit(6893, 450),
    summary:
      "Post-burn trajectory clear of all catalogued objects for 72 h. New miss distance 2.45 km; post-burn Pc 2.2e-6.",
  };
}

/* Simple circular-orbit ECI sampler (prototype-grade two-body propagation). */
function sampleOrbit(r0km, altKm, steps = 90) {
  const pts = [];
  const r = r0km;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([r * Math.cos(a), 0, r * Math.sin(a) * 0.99]);
  }
  void altKm;
  return pts;
}

/* ---- WebSocket broadcast (wired by index.js when ws available) ---- */
let wsServer = null;
function setWsServer(srv) { wsServer = srv; }

function broadcast(message) {
  if (!wsServer) return;
  try { wsServer.broadcastJSON(message); } catch (_) { /* ignore */ }
}

module.exports = {
  state,
  satellites,
  debris,
  conjunctions,
  cdmSeries,
  historyEvents,
  maneuverPlans,
  addAudit,
  pushFeed,
  createJob,
  setWsServer,
  broadcast,
};
