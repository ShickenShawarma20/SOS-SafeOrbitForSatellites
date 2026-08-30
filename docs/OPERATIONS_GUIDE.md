# SOS: Safe Orbit for Satellites — Step-by-Step Operational Guide

This document provides a complete, step-by-step guide for operating the SOS
(Safe Orbit for Satellites) system — from initial setup through daily
collision-avoidance operations.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Prerequisites & Installation](#2-prerequisites--installation)
3. [Starting the System](#3-starting-the-system)
4. [Accessing the Console](#4-accessing-the-console)
5. [Understanding the Dashboard](#5-understanding-the-dashboard)
6. [Daily Operations Workflow](#6-daily-operations-workflow)
7. [Conjunction Assessment (Step-by-Step)](#7-conjunction-assessment-step-by-step)
8. [Maneuver Planning & Execution](#8-maneuver-planning--execution)
9. [Using the Autopilot Engine](#9-using-the-autopilot-engine)
10. [Live Satellite Tracking](#10-live-satellite-tracking)
11. [Ground Station Monitoring](#11-ground-station-monitoring)
12. [Analytics & Reporting](#12-analytics--reporting)
13. [System Settings & Configuration](#13-system-settings--configuration)
14. [Troubleshooting](#14-troubleshooting)
15. [Quick Reference](#15-quick-reference)

---

## 1. System Overview

SOS is a **Space Situational Awareness (SSA) and Autonomous Collision Avoidance
System** that:

- Monitors ISRO satellites orbiting Earth in real time using a 3D digital twin
- Detects conjunctions (close approaches) between satellites and space debris
- Assesses collision risk using real astrodynamics math
- Recommends optimal avoidance maneuvers with fuel cost calculations
- Can autonomously execute collision-avoidance burns when risk exceeds thresholds

### Core Workflow

```
TRACK → DETECT → ASSESS → PLAN → BURN → CLEAR
```

---

## 2. Prerequisites & Installation

### Step 1 — Verify System Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | v18.0.0 or later |
| npm | v9.0.0 or later |
| Web Browser | Chrome 90+, Firefox 88+, Edge 90+, Safari 15+ |

### Step 2 — Clone the Repository

```bash
git clone https://github.com/ShickenShawarma20/SOS-SafeOrbitForSattelites.git
cd SOS-SafeOrbitForSattelites
```

### Step 3 — Install Dependencies

```bash
npm install
```

### Step 4 — Configure Environment (Optional)

```bash
cp .env.example .env
```

Edit `.env` if you want to add an AI API key. The system works without one
(rule-based fallback is used).

---

## 3. Starting the System

### Development Mode (Recommended for First-Time Use)

```bash
npm run dev
```

- Starts the Express backend with hot-reload
- Serves the frontend at `http://localhost:3000`
- API available at `http://localhost:3000/api/v1/`

### Production Mode

```bash
npm run build
npm start
```

### Static Frontend Only (No Backend)

```bash
npm run serve:static
```

> **Note:** In static-only mode, the Live Tracking page works via Vercel
> serverless functions, but conjunction/maneuver features require the backend.

---

## 4. Accessing the Console

### Step 1 — Open Your Browser

Navigate to `http://localhost:3000`

### Step 2 — Landing Page

You will see the SOS landing page with:
- Animated video background
- Feature highlights
- **"Launch Console"** button

### Step 3 — Enter Mission Control

Click **"Launch Console"** to enter the main dashboard.

---

## 5. Understanding the Dashboard

The Mission Control dashboard (`index.html`) is your primary screen. It shows:

### Key Sections

| Section | Location | Purpose |
|---------|----------|---------|
| **3D Orbital Viewer** | Center | Interactive globe showing all satellites and debris |
| **Critical Alert Card** | Top-left | Most dangerous active conjunction |
| **Alert Summary Donut** | Left | Conjunction breakdown (Critical/High/Medium/Low) |
| **AI Assessment Bar** | Left | Risk trend, collision probability, confidence |
| **Upcoming Conjunctions** | Center-right | Next 5 conjunction events |
| **Next Maneuver Card** | Right | Scheduled burn details |
| **System Feed** | Bottom | Live event stream |
| **Orbital Coverage Map** | Bottom-left | Ground station coverage |
| **Conjunction Timeline** | Bottom-center | Per-satellite event lanes |
| **Fuel Status** | Bottom-right | Propellant ring gauge |

### 3D Globe Controls

| Action | Control |
|--------|---------|
| Rotate | Left-click + drag |
| Zoom | Scroll wheel / pinch |
| Toggle layers | Layer chips (satellites, debris, orbit tracks, labels) |
| Focus satellite | Click satellite or use "Focus-Selected" button |
| Change speed | 1x / 10x / 60x / 300x buttons |

---

## 6. Daily Operations Workflow

### Morning Checklist

1. **Check System Health**
   - Verify the system feed shows normal activity
   - Confirm satellite count matches expected fleet (19 ISRO satellites)
   - Check ground station connectivity status

2. **Review Space Weather**
   - Open SSA Tactical Console (`console.html`)
   - Check F10.7 solar flux, Kp index, and drag multiplier
   - Note any solar storm alerts that may affect orbit predictions

3. **Scan Conjunction Alerts**
   - Review the Alert Summary donut on the dashboard
   - Check for any new Critical or High alerts
   - Review the Upcoming Conjunctions table

4. **Review AI Assessment**
   - Check the AI Assessment bar for risk trend
   - Note any conjunctions flagged as IMMEDIATE urgency

### Ongoing Monitoring

- Monitor the system feed for new conjunctions
- Watch for tracking update notifications
- Review any maneuver completion reports

### End of Shift

- Acknowledge all resolved conjunctions
- Review the Analytics page for the day's operations
- Export any required reports

---

## 7. Conjunction Assessment (Step-by-Step)

When a conjunction alert appears, follow this process:

### Step 1 — Open the Conjunction

- Click the conjunction in the **Upcoming Conjunctions** table, or
- Click **"View Conjunction"** on the Critical Alert card

### Step 2 — Review Conjunction Details

The Conjunction page (`conjunction.html`) shows:

| Metric | What It Means |
|--------|---------------|
| **TCA** | Time of Closest Approach (when the objects are nearest) |
| **Miss Distance** | How close they will get (meters/km) |
| **Pc** | Probability of Collision (0.0 = safe, 1.0 = certain hit) |
| **Relative Velocity** | How fast they pass each other |

### Step 3 — Assess Risk

1. **Check the B-Plane Plot** — shows covariance ellipses vs. hard-body radius
2. **Review the Probability Evolution** table — see how risk changes over time
3. **Check AI Assessment** — read the Flight Director's urgency classification

### Risk Thresholds

| Pc Value | Risk Level | Action Required |
|----------|------------|-----------------|
| > 1e-3 | Critical | Immediate maneuver required |
| 1e-4 to 1e-3 | High | Plan maneuver within 24h |
| 1e-5 to 1e-4 | Medium | Monitor closely |
| < 1e-5 | Low | Routine monitoring |

### Step 4 — Decide on Maneuver

- If Pc exceeds your threshold, proceed to **Step 8 (Maneuver Planning)**
- If risk is acceptable, acknowledge and continue monitoring

---

## 8. Maneuver Planning & Execution

### Step 1 — Open Maneuver Planner

Navigate to `maneuvers.html` or click **"Plan Maneuver"** from the conjunction page.

### Step 2 — Set Burn Window

Use the **Burn Window Slider** to select when the thruster burn should occur.

The system proposes three candidate plans:

| Plan | Description |
|------|-------------|
| **Plan A** | Fuel-optimal prograde/retrograde burn |
| **Plan B** | Radial burn for cross-track miss improvement |
| **Plan C** | Combined multi-axis burn for maximum safety margin |

### Step 3 — Compare Plans

Review the **Plan Compare** canvas showing:
- **Cyan orbit** — current trajectory
- **Red orbit** — debris trajectory
- **Green dashed orbit** — post-maneuver diverted trajectory

Check for each plan:
- Total ΔV required (m/s)
- Fuel cost (kg) via Tsiolkovsky equation
- New miss distance after burn
- Projected Pc reduction
- 72-hour secondary conjunction screening results

### Step 4 — Simulate the Burn

Click **"Simulate"** on your chosen plan to verify:
- Post-burn orbit propagation
- Updated B-plane geometry
- Secondary conjunction check

### Step 5 — Approve and Execute

1. Click **"Save"** or **"Submit for Approval"**
2. Confirm the maneuver in the approval dialog
3. The system logs the maneuver and schedules execution

### Step 6 — Post-Burn Verification

After execution:
- The satellite transitions to its new orbit (green track on globe)
- The original conjunction is re-screened
- The event is logged and a CCSDS CDM can be exported

---

## 9. Using the Autopilot Engine

The Autopilot Engine (`autopilot.html`) provides hands-off collision avoidance.

### Step 1 — Configure Trigger Rules

Set the following parameters:

| Parameter | Description | Typical Value |
|-----------|-------------|---------------|
| **Pc Trigger Threshold** | Collision probability that triggers auto-burn | 1e-4 |
| **Minimum Miss Distance** | Minimum acceptable miss distance | 500 m |
| **Execution Horizon** | How far ahead to screen | 72 hours |
| **Propellant Floor** | Minimum fuel reserve to keep | 10% |
| **Burn-Axis Preference** | Preferred burn direction | In-Track |
| **Full-Auto Toggle** | Enable/disable autonomous execution | STANDBY |

### Step 2 — Set Autopilot State

| State | Description |
|-------|-------------|
| **STANDBY** | Monitoring only, no auto-execution |
| **ARMED** | Will auto-execute when thresholds are exceeded |
| **DRY RUN** | Simulates auto-execution without actually burning |

### Step 3 — Review Fleet Clearance Queue

The queue shows every conjunction vs. debris object with:
- Current risk level
- Recommended auto-pilot action
- Propellant cost
- Eligibility status

Use **"Select-All-Eligible"** to batch-select safe-to-auto-burn conjunctions.

### Step 4 — Execute (When ARMED)

Click **"Execute Automated Fleet Clearance"** to start the 5-stage pipeline:

| Stage | Description |
|-------|-------------|
| 1. Telecommand Signing | Authenticate the burn command |
| 2. Reaction-Wheel Pre-Slew | Orient the satellite |
| 3. Solar-Array Feathering | Protect solar panels during burn |
| 4. Closed-Loop Thruster Burn | Execute the ΔV maneuver |
| 5. Post-Burn Orbit Determination | Verify new orbit |

### Step 5 — Monitor Flight Director Log

Watch the terminal-style log for real-time autopilot events.

---

## 10. Live Satellite Tracking

Navigate to `tracking.html` for real-time SGP4 satellite tracking.

### Step 1 — View Satellite List

The left panel shows all 19 ISRO satellites. Click any satellite to:
- Focus the 3D view on it
- Display its telemetry data

### Step 2 — Use Time Controls

| Button | Action |
|--------|--------|
| **LIVE** | Reset to real-time |
| **-1h / -30m / -10m** | Shift time backward |
| **+10m / +30m / +1h** | Shift time forward |
| **NOW** | Jump to current time |
| **Play/Pause** | Start/stop time progression |

### Step 3 — Read Telemetry

The right panel shows the selected satellite's:
- Latitude, Longitude, Altitude
- Velocity (km/s)
- Position vectors (ECI)
- Velocity vectors (ECI)
- Orbital category (LEO/GEO/GSO)

### Step 4 — Verify Data Freshness

Check the **System Status Strip** for:
- Satellites tracked count
- Propagation state
- Data source (CelesTrak)
- Last refresh time
- Orbital data epoch

---

## 11. Ground Station Monitoring

Navigate to `groundstations.html` to view the ground station network.

### Step 1 — Review Coverage Map

The world map shows ground station locations with coverage circles.

### Step 2 — Check Station Status

Each station shows:
- Online/Offline status
- Current contact window
- Coverage percentage

### Step 3 — Plan Ground Passes

Use the station data to plan satellite communication windows.

---

## 12. Analytics & Reporting

Navigate to `analytics.html` for operations performance data.

### Step 1 — Review 30-Day Metrics

Charts show:
- Conjunctions detected over time
- Maneuvers executed
- Fuel consumption
- Risk reduction effectiveness

### Step 2 — Generate Reports

Navigate to `reports.html` to:
- Generate operational summaries
- Export CCSDS Conjunction Data Messages (CDM)
- Download audit logs

### Step 3 — Export Data

Available export formats:
- JSON (structured data)
- XML (CCSDS-compliant)
- KVN (key-value notation)

---

## 13. System Settings & Configuration

Navigate to `settings.html` to configure the system.

### Key Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Alert Thresholds** | Pc values for Critical/High/Medium/Low | Configurable |
| **Screening Volume** | Time window for conjunction screening | 72 hours |
| **Notification Preferences** | Email/webhook alert routing | Configurable |
| **AI Engine Toggle** | Enable/disable AI assessments | Enabled |
| **Audit Log Retention** | How long to keep operation logs | 90 days |

### Adjusting Thresholds

1. Navigate to Settings
2. Modify threshold values as needed
3. Save changes — thresholds apply immediately

---

## 14. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Globe not loading** | Check WebGL support in your browser. Try Chrome or Firefox. |
| **No satellite data** | Verify backend is running (`npm run dev`). Check API health at `/api/v1/health`. |
| **TLE data stale** | CelesTrak may be temporarily unavailable. System falls back to bundled TLE snapshot. |
| **AI Assessment unavailable** | The AI Engine falls back to rule-based deterministic assessments. Core functionality is preserved. |
| **Maneuver simulation fails** | Check that the conjunction hasn't expired. Refresh the page. |
| **Tracking page shows no data** | The tracking page uses Vercel serverless functions. Verify internet connectivity. |

### Checking System Health

```bash
# Test API health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# { "status": "ok", "uptime": ... }
```

### Viewing Logs

Server logs are stored in the `logs/` directory. Check there for backend errors.

---

## 15. Quick Reference

### Key URLs

| Page | URL Path |
|------|----------|
| Landing Page | `/landing.html` |
| Mission Control | `/index.html` |
| SSA Console | `/console.html` |
| Autopilot | `/autopilot.html` |
| Live Tracking | `/tracking.html` |
| Conjunctions | `/conjunction.html` |
| Satellites | `/satellite.html` |
| Maneuvers | `/maneuvers.html` |
| Orbits | `/orbits.html` |
| Ground Stations | `/groundstations.html` |
| Analytics | `/analytics.html` |
| Reports | `/reports.html` |
| Settings | `/settings.html` |

### Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | System health check |
| `GET /api/v1/dashboard` | Dashboard KPIs |
| `GET /api/v1/conjunctions` | All conjunctions |
| `GET /api/v1/conjunctions/summary` | Conjunction summary |
| `GET /api/v1/satellites` | Satellite registry |
| `GET /api/v1/maneuvers/plans` | Maneuver plans |
| `GET /api/v1/ai/assessments` | AI assessments |
| `GET /api/v1/tracking/fleet` | Live tracking data |
| `GET /api/v1/weather` | Space weather data |
| `GET /api/v1/network` | Ground station status |

### Essential Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run serve:static # Serve frontend only
```

### Color Coding on the 3D Globe

| Color | Meaning |
|-------|---------|
| **Cyan** | Active/selected satellite |
| **Red dashed** | Debris / dangerous object |
| **Green dashed** | Post-maneuver diverted orbit |
| **Red pulsing ring** | TCA encounter marker |

### Collision-Avoidance Demo

Click the red **"COLLISION-AVOIDANCE DEMO"** button on the home page globe
to see a 23-second cinematic of the full workflow:

```
DETECT → THREAT → PLAN → BURN → CLEAR
```

---

## Document Version

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-30 | Initial operational guide |

---

*For detailed API specifications, see `BACKEND_REQUIREMENTS.md`.*
*For complete feature documentation, see `FEATURES.md`.*
*For a plain-language workflow explanation, see `WORKFLOW.md`.*
