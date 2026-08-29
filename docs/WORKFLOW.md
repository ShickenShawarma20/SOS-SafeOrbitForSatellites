# SOS · SafeOrbitForSattelites — How the Project Works (Simple Workflow)

This document explains, in plain language, what this project does and how data
flows through it from start to finish. It is written for anyone on the team —
no astrodynamics or coding background required.

---

## 1. The Big Picture (One Paragraph)

SOS (Safe Orbit for Satellites) is a **mission-control console** that watches
the satellites orbiting Earth, warns operators when a satellite is about to pass
dangerously close to a piece of space debris, and helps plan a small "nudge" (a
thruster burn) that moves the satellite out of harm's way — all visualised on a
spinning 3D globe. Think of it as an air-traffic-control screen, but for space.

---

## 2. The Main Parts of the System

| Part | What it is | Folder / Files |
|------|------------|----------------|
| **Frontend (the console)** | The web pages the operator sees — dashboard, alerts, maneuver planner. | `index.html`, `*.html`, `js/`, `css/` |
| **3D Globe Engine** | A Three.js Earth that shows satellites and debris moving along real orbits. | `js/orbital.js`, `js/sim-core.js` |
| **Backend API** | A Node/Express server that stores satellites, conjunctions, and maneuver plans and serves them as JSON. | `server/` |
| **AI Flight Director** | An AI Engine advisor that reads a conjunction and writes a burn recommendation (with a built-in math fallback if the AI is unavailable). Powers the dashboard's AI Assessment bar. | `server/` (route `/api/v1/ai`) |
| **Orbital Math** | The physics: turning orbit shapes into 3D positions, finding the moment of closest approach, and estimating collision probability. | `js/sim-core.js`, `js/orbital.js` |

---

## 3. The Life of a Collision-Avoidance Event (Step by Step)

This is the core workflow — what happens from "everything is fine" to
"collision avoided."

```
  TRACK  →  DETECT  →  ASSESS  →  PLAN  →  BURN  →  CLEAR
```

### Step 1 — TRACK (always running)
- The globe (`js/orbital.js`) keeps every satellite and debris object moving
  along its orbit using **Keplerian elements** — six numbers that describe an
  orbit's size, shape, tilt, and where the object is on it.
- Each object's position is recomputed many times per second from these
  elements, so the 3D view is a live "digital twin" of the real orbit.

### Step 2 — DETECT (a conjunction is found)
- When two objects are predicted to come close, the backend creates a
  **conjunction** record (`server/api.js` → `/conjunctions`).
- Each conjunction holds the important numbers:
  - **TCA** — Time of Closest Approach (when they'll be nearest).
  - **Miss Distance** — how close they'll get (meters / km).
  - **Pc** — Probability of Collision (how likely they are to actually hit).
  - **Relative Velocity** — how fast they'll whip past each other.
- The dashboard's **Critical Alert** card and the **Upcoming Conjunctions**
  table light up, and a red pulsing marker appears on the globe at the
  encounter point.

### Step 3 — ASSESS (how bad is it?)
- The **AI Flight Director** (backend `/api/v1/ai/assessments`) reads the
  conjunction and decides an **urgency class** (IMMEDIATE / MONITOR). The
  result powers the dashboard's **AI Assessment bar** (risk trend, Pc, driver).
- Behind the scenes, `js/sim-core.js` does the real physics:
  - Propagates both orbits forward in time (RK4 integrator).
  - Searches for the exact **TCA** (golden-section search).
  - Builds the **B-plane** — the encounter plane perpendicular to the closing
    speed — and projects the miss onto it.
  - Computes **Pc** by integrating a 2D Gaussian over the hard-body radius.
- Operators also see the **B-Plane Collision Plot** (covariance ellipses) and
  the **Conjunction Timeline** to judge risk at a glance.

### Step 4 — PLAN (what burn to do)
- The **Maneuver Planner** (`maneuvers.html`, `js/pages/maneuvers.js`) proposes
  several candidate burns. A "burn" is a short thruster firing described by:
  - **ΔV** — the change in velocity (m/s). Even 0.42 m/s is enough at orbital
    speeds to shift the miss distance by kilometres.
  - **Direction** — prograde / retrograde / radial / cross-track.
  - **Fuel cost** — from the Tsiolkovsky rocket equation
    (`Δm = m₀ · (1 − e^(−ΔV / (Isp·g₀))`).
  - **New miss distance & risk reduction** — predicted post-burn safety.
- The operator compares plans on the **Plan Compare** canvas, where the
  original orbit (cyan), debris orbit (red), and post-burn diverted orbit
  (green dashed) are drawn from real propagated geometry.

### Step 5 — BURN (execute the maneuver)
- The chosen plan is approved, and the satellite fires its thrusters at the
  scheduled burn window.
- On the globe, the satellite "transfers" to its **post-maneuver orbit**
  (the green track), and the original conjunction is no longer a threat.
- An **Autopilot Engine** (`autopilot.html`) can do this automatically when
  Pc exceeds a threshold — zero-latency self-protection.

### Step 6 — CLEAR (verify safety)
- After the burn, the post-burn trajectory is **re-screened** for 72 hours to
  make sure the satellite wasn't accidentally pushed toward *another* object.
- The event is logged, a **CCSDS Conjunction Data Message** can be exported
  for other agencies, and the alert is acknowledged and silenced.

---

## 4. How the Pieces Talk to Each Other

```
  Browser (operator)                         Express backend (server/)
  ┌────────────────────┐    fetch /api/v1    ┌──────────────────────┐
  │ 3D Globe (orbital)│ ──────────────────▶ │  /conjunctions       │
  │  Dashboard cards   │ ◀────────────────── │  /maneuvers/plans    │
  │  Maneuver Planner  │    JSON response    │  /satellites         │
  │  AI Assessment bar │ ── GET /ai/assess ─▶│  /ai/assessments     │
  └────────────────────┘                     │         │            │
                                             │  ┌──────▼───────┐    │
                                             │  │  AI Engine  │    │
                                             │  │ (fallback if │    │
                                             │  │  unavailable) │    │
                                             │  └──────────────┘    │
                                             └──────────────────────┘
```

- The frontend never holds the truth itself — it asks the backend via the
  shared client `js/api.js` (`window.SOS.api(...)`).
- Every page is a **page loader** under `js/pages/` that fetches what it needs
  and fills in the HTML. The persistent sidebar/topbar shell (`js/shell.js`)
  wraps every page.
- If the backend or the AI Engine is down, the app keeps working: the 3D globe runs
  its own Kepler math, and the AI endpoints return deterministic fallback
  answers (`server/index.js`).

---

## 5. The 3D Globe (how the picture is made)

1. Each object has **orbital elements** (altitude, inclination, eccentricity,
   RAAN, argument of perigee, mean anomaly).
2. `orbital.js` converts these to a 3D Cartesian position (`keplerToECI`) every
   frame and advances the object along its orbit using its **period**
   (`T = 2π·√(a³/μ)`).
3. Positions are scaled (1 km → 0.001 units, so Earth radius ≈ 6.378 units) and
   drawn on a textured Three.js sphere with a starfield and atmosphere glow.
4. Color coding on the globe:
   - **Cyan** — the selected/primary satellite.
   - **Red dashed** — debris / dangerous object.
   - **Green dashed** — the post-maneuver diverted orbit.
   - **Red pulsing ring** — the TCA encounter marker.

---

## 6. The Collision-Avoidance Demo (home page)

A built-in **cinematic demo** lets you show the whole workflow in ~23 seconds
on the home-page 3D globe.

- Click the red **"COLLISION-AVOIDANCE DEMO"** button at the top of the globe.
- The demo plays five phases, each narrated in the side panel:

| Phase | What you see on the globe | What the panel says |
|-------|---------------------------|---------------------|
| **DETECT** | Camera zooms onto SAT-51656; a red threat line links it to debris OBJ-8821. | "Conjunction detected…" |
| **THREAT** | Time slows; the threat line pulses red. | "Pc 2.8×10⁻⁴ exceeds safe threshold…" |
| **PLAN** | The green post-burn orbit lights up. | "Recommended: 0.42 m/s prograde burn…" |
| **BURN** | A bright flash at the satellite; camera follows it onto the green diverted orbit; the red encounter marker disappears. | "Executing collision-avoidance maneuver…" |
| **CLEAR** | Wide view; a green success ring pulses on the satellite. | "Collision avoided. Miss distance 2.45 km." |

Files: `js/collision-demo.js` (logic), `css/demo.css` (styling). The demo uses
a slightly exaggerated post-burn orbit so the diverted track is visible to the
eye; closing the demo restores the real fleet.

---

## 7. Quick Glossary

- **Conjunction** — a predicted close pass between two space objects.
- **TCA** — Time of Closest Approach.
- **Pc** — Probability of Collision.
- **ΔV** — change in velocity from a thruster burn (m/s).
- **B-plane** — the encounter plane used to judge miss distance and risk.
- **Keplerian elements** — six numbers that fully describe an orbit.
- **CDM** — Conjunction Data Message, the standard format for sharing warnings.
- **Kessler Syndrome** — the cascading cascade where one collision creates
  debris that causes more collisions; this system helps prevent it.

---

## 8. Running It

```bash
npm install      # install dependencies
npm run dev      # start backend + static frontend (http://localhost:3000)
```

Open the home page, hit **COLLISION-AVOIDANCE DEMO**, and watch the globe.
