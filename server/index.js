/* SOS backend prototype — Express server entry point */
"use strict";

const path = require("path");
const express = require("express");
const api = require("./api");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* CORS for the static frontend */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* Request log */
app.use((req, _res, next) => {
  if (req.path.startsWith("/api")) console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

/* REST API */
app.use("/api/v1", api);

/* Auth stubs (prototype) */
app.post("/auth/login", (_req, res) => {
  res.json({ token: "prototype-token", operator: store.state.operator });
});
app.get("/auth/me", (_req, res) => res.json(store.state.operator));
app.post("/auth/logout", (_req, res) => res.json({ ok: true }));

/* AI Flight Director stubs with deterministic fallback */
app.post("/api/ai/assess", (req, res) => {
  const { conjunctionId } = req.body || {};
  const c = conjunctionId ? require("./store").conjunctions.find((x) => x.id === conjunctionId) : null;
  res.json({
    source: "deterministic_fallback",
    conjunctionId: conjunctionId || null,
    directive: c
      ? {
          urgencyClass: c.severity === "critical" ? "IMMEDIATE" : "MONITOR",
          recommendedBurnEpoch: "2024-05-26T02:27:00Z",
          deltaVmps: 0.42,
          direction: "prograde",
          rationale:
            c.probabilityOfCollision >= store.state.settings.pcManeuverThreshold
              ? "Pc at or above maneuver threshold; fuel-optimal prograde burn within ground-station visibility window."
              : "Pc below threshold; continue monitoring.",
          telecommandChecklist: [
            "Verify thruster readiness and propellant pressure",
            "Confirm KSAT Svalbard pass coverage at burn epoch",
            "Uplink burn command and verify acknowledgment",
            "Post-burn ephemeris update and re-screening",
          ],
        }
      : { urgencyClass: "MONITOR", rationale: "No conjunction specified." },
  });
});

app.post("/api/ai/chat", (req, res) => {
  const message = String((req.body || {}).message || "").toLowerCase();
  let reply =
    "Deterministic advisor: I can analyze conjunctions, maneuver plans and risk. Ask about a specific event ID or satellite.";
  if (message.includes("sat-042") || message.includes("cd-2024")) {
    reply =
      "SAT-042 \u2194 OBJ-8821 (CD-2024-0526-0417): Pc 2.8\u00d710\u207b\u2074 exceeds the 1e-4 maneuver threshold. PLAN A (prograde, \u0394V 0.42 m/s) raises miss distance to 2.45 km with 92.1% risk reduction at a fuel cost of 12.4 kg.";
  } else if (message.includes("fuel") || message.includes("\u0394v") || message.includes("dv")) {
    reply =
      "Propellant model: \u0394m = m\u2080(1 \u2212 e^(\u2212\u0394V/(Isp\u00b7g\u2080))). SAT-042 has 121 kg usable propellant, Isp 220 s \u2014 sufficient for all candidate plans plus station-keeping reserve.";
  }
  res.json({ sessionId: (req.body || {}).sessionId || null, reply, source: "deterministic_fallback" });
});

/* Static frontend */
app.use(express.static(path.join(__dirname, "..")));

/* Health + API index */
app.get("/healthz", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get("/api/v1", (_req, res) =>
  res.json({
    name: "SOS SafeOrbitForSattelites API",
    version: "v1",
    endpoints: "/api/v1/satellites, /api/v1/conjunctions, /api/v1/maneuvers/plans, /api/v1/dashboard/kpis, ..."
  })
);

/* 404 for unknown API routes */
app.use("/api", (_req, res) =>
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Unknown API route" } })
);

/* Error handler */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: err.message || "Internal error" } });
});

let server = app.listen(PORT, () => {
  console.log(`SOS backend prototype listening on http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
});

/* Optional WebSocket layer (activates automatically if `ws` is installed) */
try {
  const WebSocket = require("ws");
  const wss = new WebSocket.Server({ server });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "hello", payload: { channels: ["conjunction", "event.feed", "job.progress", "maneuver.status", "weather.update"] } }));
    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.subscribe) socket.subscribedChannels = msg.subscribe;
      } catch (_) { /* ignore malformed frames */ }
    });
  });
  store.setWsServer({
    broadcastJSON(message) {
      const data = JSON.stringify(message);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          if (!client.subscribedChannels || client.subscribedChannels.length === 0 ||
              client.subscribedChannels.some((ch) => (message.type || "").startsWith(ch))) {
            client.send(data);
          }
        }
      }
    },
  });
  console.log("WebSocket channel active at ws://localhost:" + PORT + "/");
} catch (_) {
  console.log("`ws` not installed \u2014 running without WebSocket push (REST only). Install with: npm i ws");
}
