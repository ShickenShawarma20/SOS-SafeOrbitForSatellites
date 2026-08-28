import express from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/error";

import satellitesRouter from "./routes/satellites";
import conjunctionsRouter from "./routes/conjunctions";
import maneuversRouter from "./routes/maneuvers";
import dashboardRouter from "./routes/dashboard";
import eventsRouter from "./routes/events";
import networkRouter from "./routes/network";
import searchRouter from "./routes/search";
import notificationsRouter from "./routes/notifications";
import analyticsRouter from "./routes/analytics";
import weatherRouter from "./routes/weather";
import catalogRouter from "./routes/catalog";
import jobsRouter from "./routes/jobs";
import settingsRouter from "./routes/settings";
import authRouter from "./routes/auth";
import auditRouter from "./routes/audit";
import aiRouter from "./routes/ai";
import trackingRouter from "./routes/tracking";
import { startTleRefreshLoop } from "./services/tle-fetcher.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const staticRoot = path.resolve(__dirname, "../..");

/* Clean URLs — /satellite -> /satellite.html */
["index", "analytics", "conjunction", "groundstations", "maneuvers", "orbits", "satellite", "settings", "console", "autopilot", "ai", "tracking"].forEach(
  (name) => {
    app.get("/" + name, (_req, res) => res.sendFile(path.join(staticRoot, name + ".html")));
  }
);

app.use(express.static(staticRoot));

app.use("/api/v1/satellites", satellitesRouter);
app.use("/api/v1/conjunctions", conjunctionsRouter);
app.use("/api/v1/maneuvers", maneuversRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/network", networkRouter);
app.use("/api/v1/groundstations", networkRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/spaceweather", weatherRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/tracking", trackingRouter);
app.use("/auth", authRouter);

app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", uptime: process.uptime() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SOS Backend running on http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
  console.log(`Static files: ${staticRoot}`);
  // Start the background TLE refresh loop (fetches from CelesTrak every 6 h).
  startTleRefreshLoop();
  console.log(`Tracking API: http://localhost:${PORT}/api/v1/tracking/fleet`);
});
