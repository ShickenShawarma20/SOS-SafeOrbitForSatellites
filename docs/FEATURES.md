# SOS · SafeOrbitForSattelites — Complete Feature & Page Guide

This document lists **every page** in the application, **what it does**, and
**every feature** it exposes. It is the single reference for the hackathon demo,
the slide deck, and any new team member trying to understand the product.


---

## Table of Contents

1. [Home / Mission Control](#1--home--mission-control-indexhtml)
2. [SSA Tactical Console](#2--ssa-tactical-console-consolehtml)
3. [Autonomous Autopilot Engine](#3--autonomous-autopilot-engine-autopilothtml)
4. [Live Tracking](#4--live-tracking-trackinghtml)
5. [Conjunctions](#5--conjunctions-conjunctionhtml)
6. [Satellite Registry](#6--satellite-registry-satellitehtml)
7. [Maneuver Planner](#7--maneuver-planner-maneuvershtml)
8. [Orbital Registry](#8--orbital-registry-orbitshtml)
9. [Ground Stations](#9--ground-stations-groundstationshtml)
10. [Analytics](#10--analytics-analyticshtml)
11. [Settings](#11--settings-settingshtml)
12. [Cross-Cutting Features](#12--cross-cutting-features)
13. [Backend API Endpoints](#13--backend-api-endpoints)

---

## 1. Home / Mission Control (`index.html`)

The primary landing dashboard — a one-screen situational-awareness summary.

### Features
- **3D Orbital Viewer** — Three.js Earth globe with the live constellation,
  debris, post-burn diverted orbit, and a red pulsing TCA encounter marker.
  Drag to rotate, scroll/pinch to zoom, layer chips to toggle satellites /
  debris / orbit tracks / ground stations. A floating **Orbital HUD** panel
  toggles layers (debris, post-burn, graticule, labels), the 🎯 Focus-Selected
  button, and simulation speed (1× / 10× / 60× / 300×).
- **Collision-Avoidance Demo** *(new)* — a red **"COLLISION-AVOIDANCE DEMO"**
  button at the top of the globe plays a ~23 s scripted cinematic of
  SAT-51656 avoiding OBJ-8821 across 5 phases (DETECT → THREAT → PLAN → BURN →
  CLEAR) with narration, telemetry, a burn flash, and a green success ring.
  Files: `js/collision-demo.js`, `css/demo.css`.
- **Critical Alert card** — the single most-dangerous active conjunction with
  TCA, Pc, miss distance, relative velocity/speed, and a "View Conjunction"
  link. An overflow menu offers Add-to-Watchlist and Acknowledge & Silence.
- **Alert Summary donut** — total conjunctions in the last 48 h broken down by
  Critical / High / Medium / Low.
- **AI Assessment bar** — risk trend (increasing/decreasing), previous→current
  Pc, primary driver, confidence, and a link to the conjunction analysis.
- **Upcoming Conjunctions table** — next 5 conjunctions screened against the
  full catalogued-object count.
- **Next Maneuver card** — satellite, burn window, ΔV, purpose, fuel impact,
  duration, with links to the maneuver plan / simulator.
- **System Feed** — live event stream (new conjunctions, tracking updates,
  completed maneuvers, TLE arrivals).
- **Orbital Coverage map** — world map with ground-station coverage circles
  and stats (stations online/offline, global coverage %).
- **Conjunction Timeline** — per-satellite ±12 h lane of upcoming events.
- **Fuel Status** — ring gauge + total / usable / reserved fuel for the
  primary satellite.

---

## 2. SSA Tactical Console (`console.html`)

The "expert" operator screen — a bento-grid of six modules for deep
conjunction-assessment work.

### Features
- **Space Weather Strip** (sticky top) — F10.7 solar flux, geomagnetic Kp
  index, drag-density multiplier, SSN/space-weather count, each tier-coded;
  buttons to export a CCSDS CDM and open the Autopilot Policy modal.
- **M1 · NASA CARA Conjunction Assessment** — risk-ranking queue with
  Critical / High / Routine segments and 18 SDS catalog sync indicator.
- **M2 · Constellation Fleet & Propulsion Telemetry** — per-satellite fuel,
  ΔV budget, status.
- **M3 · B-Plane Encounter Plane (ξ−ζ)** — animated canvas of the encounter
  geometry: 1σ/2σ/3σ covariance ellipses, 50 m Hard-Body-Radius keep-out circle,
  nominal vs. post-maneuver miss vectors, and a drag multiplier toggle to
  visualize space-weather-induced dispersion growth.
- **M4 · Autonomous Maneuver Simulation & Optimization Lab** — three ΔV
  solvers (In-Track ΔV_T, Radial ΔV_R, Cross-Track ΔV_N) with direction buttons
  and magnitude sliders; live results for total ΔV, propellant Δm
  (Tsiolkovsky), safe miss distance, and projected Pc; plus a 72-hour
  secondary conjunction screening list.
- **M5 · Closed-Loop Autonomous Autopilot** — policy rules (max Pc, min miss
  distance, execution horizon, propellant floor), propellant-preservation
  strategy text, Arm/Disarm button.
- **M5 · AOCS Execution Modal** — 5-step execution chain (telecommand
  signing → reaction-wheel pre-slew → solar-array feathering → closed-loop
  thruster burn → post-burn orbit determination) with Execute / Reset.
- **CDM Export modal** — export the active conjunction as XML / JSON / KVN.
- **Autopilot Policy modal** — configure Pc trigger, miss floor, horizon,
  propellant floor, burn-axis preference, verification mode, full-auto toggle,
  72 h screening gate.

---

## 3. Autonomous Autopilot Engine (`autopilot.html`)

Dedicated full-page control center for hands-off fleet-wide collision
avoidance.

### Features
- **Header summary** — fleet size, active threats, queued, resolved, ΔV
  budget; **Batch Scan Fleet** and **Execute Automated Fleet Clearance**
  buttons.
- **S1 · Trigger Rules Configuration** — six policy cards: Pc trigger
  threshold (logarithmic slider), minimum miss distance, execution horizon,
  propellant optimization policy (Fuel-Optimal In-Track / Rapid Radial
  Cross-Track / Constellation Safe Slot), 72-hour secondary screening toggle,
  and master state (STANDBY / ARMED / DRY RUN).
- **S2 · Fleet-Wide Conjunction Clearance Queue** — table of every spacecraft
  vs. challenger debris with current risk, auto-pilot action plan, propellant,
  status, and per-row checkboxes; Select-All-Eligible / Clear-Selection.
- **S3 · 5-Stage Closed-Loop Execution Pipeline** — visual rail of the five
  stages with live per-stage detail when executing.
- **S4 · Flight Director Terminal Log** — terminal-style streaming log of
  autopilot events with a Clear button.

---

## 4. Live Tracking (`tracking.html`)

Real-time SGP4 satellite tracking powered by `satellite.js` and live TLEs.

### Features
- **Tracking Banner** — SOS brand, LIVE indicator, ISRO satellite count,
  propagation status, orbital-data epoch, last-refresh time.
- **Satellite List panel** (left) — searchable list of ISRO satellites; click
  to select and focus the 3D view + telemetry.
- **3D Earth viewer** (center) — same Three.js globe as the home page but
  driven by **real SGP4-propagated positions** (not the internal Kepler sim).
  Layer chips (satellites, orbit tracks, labels, graticule), zoom/reset
  controls.
- **Time Controls** — LIVE button and ±1h/±30m/±10m/NOW/+10m/+30m/+1h shift
  buttons, play/pause, and a UTC offset readout — scrub time forward/backward
  and the orbits re-propagate.
- **Telemetry panel** (right) — selected satellite's real-time latitude,
  longitude, altitude, velocity, position/velocity vectors, and category.
- **System Status strip** — satellites tracked, propagation state, data
  source, last refresh, orbital-data epoch.

---

## 5. Conjunctions (`conjunction.html`)

Deep-dive page for a single conjunction event (default
`CD-2024-0526-0417`, SAT-51656 ↔ OBJ-8821).

### Features
- **Header** — satellite ↔ object pair, severity badge, TCA clock, Pc; Add to
  Watchlist and Analyze Maneuver actions.
- **Tabs** — Overview / Analysis / History / Maneuver Options.
- **Close Approach Geometry** — animated canvas visualization with three
  sub-views: the encounter corridor (secondary passing the primary at the
  B-plane miss distance), the B-plane target plot (covariance ellipses + HBR
  keep-out), and a top-down ECI orbit-context view of both real orbit rings.
  Live T-countdown, range readout, play/pause, progress bar.
- **Risk Metrics** — Pc, miss distance, relative velocity, relative speed,
  combined uncertainty, screening volume, and an assessment recommendation.
- **Orbital Information** — side-by-side elements (altitude, inclination,
  period, eccentricity/type) for the primary and the debris object.
- **Event History feed** — chronological CDM updates (Pc changes, miss
  reductions, screening-volume entry).
- **Probability Evolution table** — per-CDM epoch, miss distance, Pc, and
  trend % across the last 6 CDMs.

---

## 6. Satellite Registry (`satellite.html`)

Two-mode page: a fleet list (no `?id`) and a per-satellite detail view.

### List View Features
- Searchable, filterable table (All / Operational / Degraded / Standby) of
  every monitored satellite with name, NORAD, type, operator, status,
  altitude, inclination, orbit class.

### Detail View Features (`?id=SAT-...`)
- **Header** — name, operational status, active-conjunction badge; Download
  TLE and View Critical Conjunction actions.
- **Identity strip** — illustration, satellite type, operator, launch date,
  mass, NORAD ID, mission elapsed time.
- **Tabs** — Overview / Telemetry / Orbit / History / Files.
- **Subsystem Status** — per-subsystem health (SAR imaging, propulsion,
  attitude control, comms, power).
- **Fuel** — ring gauge + total / usable / reserved / estimated end-of-life.
- **Current Orbit** — altitude, inclination, RAAN, eccentricity, period,
  argument of perigee.
- **Recent Events feed** — conjunction flags, station-keeping burns, payload
  calibrations, TLE updates.
- **Upcoming Ground Passes** — AOS time, station, duration, max elevation.

---

## 7. Maneuver Planner (`maneuvers.html`)

Plan, compare, and approve a collision-avoidance burn for a conjunction.

### Features
- **Header** — conjunction ID, target pair, TCA, Pc; Export Plan and Simulate
  Plan actions.
- **Burn Window bar** — earliest/latest burn times with a dual-handle range
  slider.
- **Candidate Plan cards** — Plan A / B / C with ΔV, fuel impact, new miss
  distance, risk reduction; Plan A flagged RECOMMENDED. Click to select.
- **Orbital Comparison canvas** — data-driven plot of the current orbit,
  debris orbit, and each plan's post-burn diverted orbit plus the conjunction
  point, fetched from real API geometry (`initPlanCompare` in `orbital.js`).
- **Plan Details** — burn direction, duration, thrust, altitude change,
  post-burn Pc, ground-track shift, with a visibility-window note.
- **Summary bar** — selected plan, ΔV, burn duration, fuel impact, new miss
  distance, risk reduction.
- **Simulate modal** — confirms a high-fidelity propagation run against the
  latest CDM ephemeris.
- **Save Plan modal** — submits the plan for mission-director approval and
  command-scheduler upload.

---

## 8. Orbital Registry (`orbits.html`)

Catalog of every tracked satellite's Keplerian elements, on a 3D globe.

### Features
- **3D Fleet Orbital View** — Three.js globe rendering all fleet satellites on
  their real orbits; layer chips (orbit tracks, labels, satellites), zoom /
  reset controls, play/pause, legend (LEO / MEO / GEO / HEO color key).
- **Filter chips** — All / LEO / MEO / GEO (filters both the table and the
  3D globe).
- **Orbital Elements table** — satellite (links to satellite detail), NORAD,
  altitude, inclination, RAAN, eccentricity, period, argument of perigee,
  regime. Hovering a row focuses that satellite on the 3D globe.
- Loads the real fleet from `/satellites` and falls back to an offline
  default set if the API is unreachable.

---

## 9. Ground Stations (`groundstations.html`)

Global ground-station network coverage view.

### Features
- **Network stats** — stations online, offline, global coverage %, average
  latency, total stations.
- **Filter chips** — All / Online / Offline.
- **Coverage Map** — SVG world map (Natural Earth 110m land paths) with
  glowing station markers (green online, red offline); hover to scale up.
- **Station Registry table** — station name, latitude, longitude, status.

---

## 10. Analytics (`analytics.html`)

30-day operations performance dashboard.

### Features
- **Top metrics** — total conjunctions, average Pc, maneuvers executed, risk
  reduction %, each with a trend arrow vs. the previous 7 days.
- **Time-range chips** — 7D / 14D / 30D, plus Export Report.
- **Conjunctions Over Time** — line chart of weekly screened events.
- **Conjunctions by Severity** — grouped bar chart across LEO / MEO / GEO /
  HEO regimes.
- **Top Objects by Conjunctions** — horizontal bar chart of the worst
  conjunction-generating objects.
- **Conjunctions by Orbit Altitude** — bar chart with the 400–550 km peak
  highlighted.

---

## 11. Settings (`settings.html`)

System-wide configuration.

### Features
- **Alert Thresholds** — Critical / High / Medium / Low Pc thresholds and miss
  distance warning/critical (m).
- **Screening Volumes** — per-regime (LEO/MEO/GEO/HEO) box dimensions in km.
- **Notifications** — email, desktop, critical-only toggles, digest interval.
- **Display Layers** — toggles for trajectories, debris, conjunctions, ground
  stations, coverage.
- **AI Collision Avoidance** — toggles for conjunction screening, continuous
  risk assessment, maneuver recommendations, automatic simulation, and
  (off by default) autonomous maneuver execution.
- **AI Thresholds** — critical Pc, high-risk Pc, minimum miss distance,
  maximum prediction horizon, minimum data confidence.
- **Audit Log** — recent system actions with operator, action, timestamp.
- **Save / Reset** — Save Settings (with confirmation modal) and Reset
  Defaults.

---

## 12. Cross-Cutting Features

These span every page:

- **Persistent shell** (`js/shell.js`) — sidebar navigation (12 items with
  badges), topbar with live UTC clock, top KPIs, notifications bell, settings
  link, and operator profile.
- **3D Orbital Engine** (`js/orbital.js`) — reusable Three.js Earth globe with
  realistic scale (1 km → 0.001 units, Earth radius ≈ 6.378 units), textured
  sphere, atmosphere, starfield, equatorial graticule, Keplerian propagation
  (`keplerToECI`), period-based true-anomaly motion, dashed debris /
  post-maneuver orbits, billboarded labels, camera damping, focus pivot, and
  a 2D canvas fallback when WebGL is unavailable.
- **Orbital Math core** (`js/sim-core.js`) — RK4 two-body propagation,
  Keplerian→ECI state, golden-section TCA search, B-plane basis projection,
  and numerical 2D-Gaussian collision-probability integration.
- **Shared API client** (`js/api.js`) — `window.SOS.api(path)` with JSON,
  pagination, formatting helpers (`fmtPc`, `fmtDist`, `fmtTime`, etc.), and a
  configurable base URL (`?api=…` or `localStorage.sos_api_base`).
- **Deterministic AI fallback** — when the AI Engine is unavailable, the backend
  (`server/index.js`) returns rule-based assessments and chat replies so the
  console keeps working.
- **CCSDS CDM export** — Conjunction Data Messages in XML / JSON / KVN
  (`server/api.js` `/conjunctions/:id/cdms`).
- **Autopilot engine** — closed-loop policy engine with threshold-based
  auto-burn execution and 72 h forward secondary screening.

---

## 13. Backend API Endpoints

Base URL: `/api/v1` (Express, `server/api.js`). All return JSON.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/kpis` | Top KPIs (active sats, alerts, maneuvers, health) |
| GET | `/events/feed?limit=` | System event feed |
| GET | `/fleet/fuel-summary` | Primary satellite fuel state |
| GET | `/conjunctions?page=&limit=&severity=&satelliteId=&active=` | Paginated conjunction list |
| GET | `/conjunctions/critical` | Single most-critical active conjunction |
| GET | `/conjunctions/summary?window=48h` | Alert counts by severity |
| GET | `/conjunctions/upcoming?limit=` | Next N upcoming conjunctions |
| GET | `/conjunctions/timeline?window=±12h` | Per-satellite timeline lanes |
| GET | `/conjunctions/:id` | One conjunction detail |
| GET | `/conjunctions/:id/cdms` | CDM series for a conjunction |
| GET | `/conjunctions/:id/history` | Event history for a conjunction |
| GET | `/conjunctions/:id/objects` | Primary + secondary object details |
| GET | `/conjunctions/:id/geometry` | Orbit rings + B-plane geometry |
| POST | `/conjunctions/:id/watchlist` | Add to watchlist |
| POST | `/conjunctions/:id/acknowledge` | Acknowledge & silence |
| GET | `/maneuvers/plans?conjunctionId=` | Candidate burn plans |
| GET | `/maneuvers/plans/:id` | One plan detail |
| GET | `/maneuvers/plans/:id/geometry` | Post-burn orbit ring |
| GET | `/maneuvers/next` | Next scheduled maneuver |
| GET | `/satellites?page=&limit=` | Satellite catalog (paginated) |
| GET | `/satellites/:id` | One satellite detail (with fuel) |
| GET | `/catalog/stats` | Tracked-objects count |
| GET | `/groundstations` | Ground-station list |
| GET | `/network/status` | Network coverage & latency |
| GET | `/ai/assessments` | AI assessment list (powers dashboard insight bar) |
| GET | `/notifications?unread=true` | Unread notifications |
| GET | `/tracking/fleet` | TLE fleet for live SGP4 tracking |
| GET | `/auth/me` | Operator profile |
| POST | `/auth/login` / `/auth/logout` | Auth stubs |

---

## Quick Navigation Map

```
  Home (index.html)  ── 3D globe + Critical Alert + Demo
      │
      ├── Console (console.html)      ── expert bento grid
      ├── Autopilot (autopilot.html)   ── fleet-wide auto-burn
      ├── Live Tracking (tracking.html)── SGP4 real-time
      ├── Conjunctions (conjunction.html) ── single event deep-dive
      ├── Satellites (satellite.html)  ── registry + per-sat detail
      ├── Maneuvers (maneuvers.html)   ── burn planner
      ├── Orbits (orbits.html)         ── Keplerian catalog + 3D
      ├── Ground Stations              ── network coverage
      ├── Analytics                    ── 30-day performance
      └── Settings                     ── thresholds, AI, audit log
```

For the plain-language workflow, see [`WORKFLOW.md`](./WORKFLOW.md).
For the full API contract, see [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md).
For a step-by-step operational walkthrough, see [`OPERATIONS_GUIDE.md`](./OPERATIONS_GUIDE.md).
