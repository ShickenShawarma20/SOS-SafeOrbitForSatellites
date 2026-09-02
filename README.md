# 🛰️ SOS: Safe Orbit for Satellites
### Autonomous Space Situational Awareness (SSA) & Collision Avoidance Flight Director Console

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://www.ecma-international.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Flight_Director-4285F4)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**SOS (Safe Orbit for Satellites)** is an intelligent, full-stack Space Situational Awareness (SSA) and Autonomous Collision Avoidance System designed to safeguard Low Earth Orbit (LEO) satellites from hypervelocity space debris encounters and prevent Kessler Syndrome.

---

## 🌟 Key Features

### 🌍 1. Interactive 3D Orbital Digital Twin
- **WebGL Earth Engine**: High-fidelity 3D Earth representation (6,378 km scale) with textured sphere, atmospheric scattering shaders, 3D celestial starfield, and equatorial graticules.
- **Real-Time Orbit Propagation**: Two-body Keplerian-to-Cartesian state vector propagation in the Earth-Centered Inertial (ECI) coordinate frame via RK4 (4th-order Runge-Kutta) integrator.
- **Dynamic Orbital Trajectories**: Visualizes active satellite orbits, space debris cloud vectors, point-of-closest-approach markers, post-maneuver diverted orbits, and dashed trajectory trails.
- **Billboarded Labels & Camera Controls**: Smooth camera damping, focus pivot on satellite selection, home/tracking/maneuver viewer modes, and 2D canvas fallback.

### 🎯 2. B-Plane Encounter & Covariance Modeler
- **Collision Plane Geometry**: Maps the encounter plane (ξ, ζ) perpendicular to the relative velocity vector using orthonormal basis construction.
- **Covariance Dispersion Ellipses**: Computes combined 1σ, 2σ, and 3σ positional error boundaries against Hard Body Radii (HBR).
- **Drag-Induced Dispersion**: Visualizes orbital uncertainty growth driven by space weather surges (F₁₀.₇ solar flux, Kp geomagnetic index).
- **Foster 2D Gaussian Collision Probability**: Simpson quadrature numerical integration over the encounter B-Plane.

### 🤖 3. AI Astrodynamics Flight Director
- **Automated Conjunction Assessment**: Analyzes Conjunction Data Messages (CDMs), satellite mass, thruster Isp, and collision probabilities (Pc).
- **Structured Flight Directives**: Generates fuel-optimal burn epochs, ΔV vectors, risk urgency classifications, and operator telecommand checklists.
- **AI Chat Assistant**: Interactive query interface for maneuver, risk, and fuel-status questions with keyword-based deterministic responses.
- **Fault-Tolerant Fallback**: Built-in deterministic astrodynamics calculation engine with in-memory caching to guarantee continuous flight operations during rate limits.
- **Model Health Monitoring**: 6-module health dashboard (Conjunction Detector, Risk Model, Orbit Propagation, Maneuver Optimizer, Data Pipeline, Safety Validator).

### 🚀 4. Collision Avoidance Maneuver Lab
- **Multi-Axis Burn Simulator**: Simulates Prograde/Retrograde, Radial (In/Out), and Cross-Track (Normal/Anti-Normal) maneuvers using Clohessy-Wiltshire (Hill) equations.
- **Tsiolkovsky Propellant Optimization**: Computes exact fuel expenditure (Δm = m₀(1 - e^(-ΔV/(Isp·g₀))), post-burn miss distances, and orbital period changes.
- **Three Candidate Plans**: Moderate (A), fuel-efficient (B), and maximum safety (C) options with real-time comparison.
- **Post-Burn Orbit Visualization**: Side-by-side orbital comparison with current orbit, debris orbit, and post-burn orbits rendered on the 3D globe.
- **Secondary Conjunction Screening**: 72-hour forward post-burn trajectory scan to ensure no secondary collision hazards.

### 🛰️ 5. Fleet Telemetry & Space Weather Engine
- **ISRO Constellation Management**: Tracks 19 ISRO satellites (EOS-4, CARTOSAT-3, EOS-6, ASTROSAT, RISAT-2B/2BR1, RESOURCESAT-2/2A, CARTOSAT-2E, SARAL, GSAT-30/24/31/7A, INSAT-3DR/3DS, NVS-01, IRNSS-1B/1C) with real CelesTrak TLEs.
- **Live SGP4 Tracking**: Server-side satellite.js v7 propagation with 6-hour TLE refresh loop, snapshot fallback, and staleness detection.
- **Space Weather Telemetry**: Monitors solar flux (F₁₀.₇), geomagnetic storm indexes (Kp), and thermospheric atmospheric drag density multipliers.
- **CCSDS CDM Exporter**: Exports standardized Conjunction Data Messages in XML, JSON, and KVN formats for inter-agency coordination.
- **Fuel & Propulsion Status**: Per-satellite fuel mass, propellant reserve, ΔV budget, Isp, dry mass, and end-of-life estimates.

### 🤖 6. Autonomous Autopilot Engine
- **Closed-Loop Policy Engine**: 6 configurable trigger rules (Pc threshold, min miss distance, execution horizon, propellant policy, 72h screening, master arm/disarm).
- **Fleet-Wide Clearance Queue**: Automated conjunction clearance with per-satellite auto-pilot plans and propellant status.
- **5-Stage AOCS Execution Pipeline**: AOCS Telecommand → Reaction Wheel Pre-Slew → Thruster Ignition → Post-Burn Doppler OD → 72h Secondary Screening.
- **Flight Director Terminal Log**: Real-time execution log with timestamped status messages.

### 📊 7. Operations Analytics & Reporting
- **30-Day Performance Dashboard**: Total conjunctions, average Pc, maneuvers executed, and risk reduction percentage with trend arrows.
- **Conjunction Trends**: Monthly time-series, severity breakdown by orbital regime (LEO/MEO/GEO/HEO), altitude band distribution, and top recurring objects.
- **Mission Reports**: Summary metrics, per-satellite risk tables, CDM probability evolution, maneuver plan summaries, and key parameter exports.
- **CSV/JSON Export**: Full report download with Content-Disposition attachment headers.

### 🗺️ 8. Ground Station Network
- **40 Real-World Ground Stations**: ISRO ISTRAC (9), NASA/DoD (10), ESA ESTRACK (5), KSAT Commercial (7), Additional Global (9) with real coordinates.
- **Coverage Map**: Equirectangular SVG world map with glowing station markers, online/offline status, and visibility cones.
- **Network Stats**: Online/offline counts, coverage percentage, and latency estimates.

### 🔍 9. Space Debris Catalog
- **5 Cataloged Debris Objects**: Fengyun-1C fragment (Chinese ASAT), Cosmos 2519 body (Russian), PSLV upper stage (ISRO), Iridium-Cosmos collision fragment, and unidentified MEO object.
- **Full Orbital Elements**: TLE lines, ECI position/velocity, altitude, inclination, RAAN, eccentricity, period, and argument of perigee.
- **Risk Assessment**: Per-object risk levels (critical/high/medium/low), size categories, decay estimates, and conjunction history.

### ⚙️ 10. System Configuration
- **Alert Thresholds**: Configurable Pc critical/high/medium/low thresholds and miss distance triggers.
- **Screening Volumes**: LEO/MEO/GEO/HEO box dimensions for conjunction screening.
- **Notification Preferences**: Email, desktop, critical-only, and digest interval settings.
- **Display Layers**: Toggle trajectory, debris, conjunction, ground station, and coverage overlays.
- **AI Configuration**: 6 toggle switches and 5 threshold parameters for the AI collision avoidance engine.
- **Audit Log**: Full audit trail of system actions (acknowledgments, watchlist changes, plan submissions).

---

## 🏗️ System Architecture

```
                                   ┌──────────────────────────────────────────────┐
                                   │            SOS OPERATIONAL CONSOLE           │
                                   │       (HTML5 + CSS3 + ES6+ · Zero Build)    │
                                   └───────┬───────────────────────────────┬──────┘
                                           │                               │
                  ┌────────────────────────┴─────────┐   ┌─────────────────┴───────────────────┐
                  │        3D ORBITAL ENGINE         │   │         ASTRODYNAMICS SUITE         │
                  │  (Three.js + WebGL + Keplerian)  │   │  (B-Plane, CW, Tsiolkovsky, RK4)   │
                  └──────────────────────────────────┘   └─────────────────────────────────────┘
                                           ▲                               ▲
                                           │                               │
                                   ┌───────┴───────────────────────────────┴──────┐
                                   │     EXPRESS API / ASTRO BACKEND (17 routes)  │
                                   │  (Cached State, SGP4, CelesTrak, CCSDS)     │
                                   └──────────────────────┬───────────────────────┘
                                                          │
                              ┌───────────────────────────┼───────────────────────────┐
                              │                           │                           │
                    ┌─────────┴─────────┐     ┌──────────┴──────────┐    ┌──────────┴──────────┐
                    │    AI ENGINE      │     │   TLE FETCHER       │    │   PROPAGATOR        │
                    │ (Flight Director) │     │ (CelesTrak + Cache) │    │ (satellite.js SGP4) │
                    └───────────────────┘     └─────────────────────┘    └─────────────────────┘
```

---

## 📦 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript (no build step required)
- **3D Visualization**: Three.js, WebGL, Custom BufferGeometry & Shaders
- **Charts**: Dependency-free Canvas 2D visualizations (line, bar, donut)
- **Backend**: Node.js, Express, TypeScript (compiled to CommonJS), tsx
- **AI / LLM**: AI Engine with deterministic astrodynamics fallback
- **Live Tracking**: satellite.js v7 (SGP4/SDP4) with CelesTrak TLE data
- **Astrodynamics Standards**: CCSDS 508.0-B-1 (Conjunction Data Message format)
- **Deployment**: Vercel (serverless + static), Render (Node.js service), Netlify (static + functions)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShickenShawarma20/SOS-SafeOrbitForSattelites.git
   cd SOS-SafeOrbitForSattelites
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```
   *(Only the Node.js/Express backend needs installation. The frontend is pure
   HTML/CSS/JS and needs no build step or npm packages.)*

3. **Configure Environment Variables (Optional):**
   Copy the example environment file and add your AI Engine API Key:
   ```bash
   cp .env.example .env
   ```
   Add your AI Engine API Key in `.env`:
   ```env
   AI_API_KEY=your_ai_engine_api_key_here
   ```
   *(Note: The system includes a deterministic astrodynamics fallback engine that operates seamlessly even if an API key is not supplied).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

### Deployment

**Vercel** (Static + Serverless):
```bash
vercel --prod
```
The `vercel.json` is pre-configured with `outputDirectory: "public"`, serverless functions for debris and tracking APIs, clean URLs, and cache headers.

**Render** (Full Express Backend):
Connect your Git repository. Render auto-detects `render.yaml` and deploys the Node.js service with health check at `/api/v1/health`.

**Netlify** (Static + Functions):
```bash
netlify deploy --prod
```

---

## 📂 Project Structure

```
├── public/                      # Static frontend (Vercel outputDirectory)
│   ├── landing.html             # Public landing/marketing page
│   ├── index.html               # Mission Control dashboard (home)
│   ├── console.html             # SSA Tactical Console (expert bento grid)
│   ├── autopilot.html           # Autonomous Autopilot Engine
│   ├── tracking.html            # Live SGP4 satellite tracking
│   ├── conjunction.html         # Single conjunction deep-dive
│   ├── satellite.html           # Satellite registry & detail view
│   ├── maneuvers.html           # Maneuver planner
│   ├── orbits.html              # Orbital elements catalog + 3D globe
│   ├── debris.html              # Space debris catalog & detail
│   ├── groundstations.html      # Ground station network coverage
│   ├── analytics.html           # 30-day operations analytics
│   ├── reports.html             # Mission reports & CSV export
│   ├── settings.html            # System configuration
│   ├── css/                     # Stylesheets (base, components, screens)
│   └── js/                      # Frontend scripts
│       ├── orbital.js           # Three.js 3D Earth globe + Keplerian visualization
│       ├── sim-core.js          # Client-side astrodynamics (RK4, TCA, B-plane, Pc)
│       ├── tracking.js          # Real-time SGP4 tracking engine
│       ├── approach.js          # Close-approach B-plane visualization
│       ├── collision-demo.js    # 5-phase collision-avoidance cinematic
│       ├── coverage.js          # Orbital coverage map (SVG world)
│       ├── charts.js            # Canvas 2D analytics charts
│       ├── api.js               # Shared API client (window.SOS.api)
│       ├── shell.js             # Persistent sidebar + topbar navigation shell
│       ├── app.js               # Shared UI utilities (clock, charts, modals)
│       ├── ui.js                # Toasts, dropdowns, download helpers
│       ├── actions.js           # Global search, notifications, watchlist, CDM export
│       ├── data/                # World map / geo data
│       ├── pages/               # 12 per-page controllers
│       └── vendor/              # Vendored satellite.js + loader
├── api/v1/                      # Vercel serverless functions
│   ├── debris.ts                # Self-contained debris catalog
│   └── tracking/
│       ├── fleet.ts             # ISRO fleet TLE fetch/cache from CelesTrak
│       └── status.ts            # Data-source freshness status
├── server/src/                  # Express backend: routes, services, data
│   ├── index.ts                 # Express app entry point (17 API routes)
│   ├── types.ts                 # 18 TypeScript interfaces
│   ├── middleware/error.ts      # Custom AppError + global error handler
│   ├── routes/                  # 17 API route modules
│   │   ├── satellites.ts        # Satellite registry, TLE, telemetry, passes
│   │   ├── conjunctions.ts      # Conjunction assessment, B-plane, CDM history
│   │   ├── maneuvers.ts         # Maneuver plans, simulation, CW optimization
│   │   ├── tracking.ts          # SGP4 fleet tracking, position propagation
│   │   ├── ai.ts                # AI assessments, recommendations, chat
│   │   ├── analytics.ts         # Operations analytics, CSV export
│   │   ├── debris.ts            # Debris catalog, orbit geometry
│   │   ├── events.ts            # System event feed
│   │   ├── settings.ts          # Configuration management
│   │   ├── dashboard.ts         # KPI summary
│   │   ├── network.ts           # Ground station network
│   │   ├── notifications.ts     # Notification queue
│   │   ├── search.ts            # Global search
│   │   ├── weather.ts           # Space weather data
│   │   ├── catalog.ts           # Tracked object stats
│   │   ├── jobs.ts              # Simulation job status
│   │   └── auth.ts              # Authentication stub
│   ├── services/                # Core physics & data services
│   │   ├── kepler.ts            # Two-body RK4 propagation engine
│   │   ├── maneuver.ts          # CW/Tsiolkovsky maneuver computation
│   │   ├── propagator.ts        # SGP4/SDP4 via satellite.js v7
│   │   └── tle-fetcher.ts       # CelesTrak TLE fetch with retry + cache
│   └── data/                    # In-memory data modules
│       ├── satellites.ts        # 19 ISRO satellite records
│       ├── conjunctions.ts      # 5 conjunction events + CDM records
│       ├── debris.ts            # 5 debris objects with provenance
│       ├── maneuvers.ts         # 3 maneuver plans (A/B/C)
│       ├── events.ts            # 5 system events
│       ├── weather.ts           # Space weather snapshot
│       ├── groundstations.ts    # 40 real ground stations
│       ├── notifications.ts     # 5 notifications
│       ├── audit.ts             # 3 audit entries
│       ├── ai.ts                # 18 assessments, 2 recommendations, health
│       ├── isro-fleet.ts        # 19 ISRO fleet member configs
│       └── tle-snapshot.json    # Bundled TLE fallback data
├── netlify/functions/           # Netlify serverless functions
├── scripts/                     # Build scripts (scripts/build.js)
├── tests/                       # Ad-hoc Puppeteer test scripts
├── logs/                        # Server logs
├── docs/                        # Documentation & team work plans
│   ├── OPERATIONS_GUIDE.md      # Step-by-step operational guide
│   ├── FEATURES.md              # Complete feature & page guide
│   ├── BACKEND_REQUIREMENTS.md  # Full API contract specification
│   ├── WORKFLOW.md              # Plain-language workflow explanation
│   ├── SIH2026-PRESENTATION-CONTENT.md  # Hackathon presentation content
│   └── members/                 # Role-based work plans & step-by-step guides
├── Assets/                      # Screenshots & presentation template
├── package.json                 # Dependencies and build scripts
├── vercel.json                  # Vercel config (outputDirectory: public)
├── render.yaml                  # Render backend config
├── netlify.toml                 # Netlify config (static + functions)
└── README.md
```

---

## 📡 API Reference (17 Route Modules)

| Endpoint | Description |
|---|---|
| `GET /api/v1/health` | System health check |
| `GET /api/v1/satellites` | Paginated satellite registry |
| `GET /api/v1/satellites/:id` | Satellite detail with fuel, subsystems |
| `GET /api/v1/satellites/:id/tle` | TLE lines and epoch |
| `GET /api/v1/satellites/:id/telemetry/latest` | Latest telemetry snapshot |
| `GET /api/v1/satellites/:id/passes` | Ground station pass predictions |
| `GET /api/v1/conjunctions` | Paginated conjunction list |
| `GET /api/v1/conjunctions/critical` | Most dangerous unacknowledged conjunction |
| `GET /api/v1/conjunctions/summary` | Severity counts by orbital regime |
| `GET /api/v1/conjunctions/:id/geometry` | Full B-plane, orbit rings, ECI trajectories |
| `GET /api/v1/conjunctions/:id/bplane` | B-plane encounter data |
| `GET /api/v1/maneuvers/plans` | All maneuver plans (filterable) |
| `GET /api/v1/maneuvers/plans/:id/geometry` | Post-burn orbit ring + physics |
| `POST /api/v1/maneuvers/simulate` | Launch simulation job |
| `POST /api/v1/maneuvers/plans/:id/submit` | Submit plan for approval |
| `GET /api/v1/tracking/fleet` | ISRO fleet TLEs from CelesTrak |
| `GET /api/v1/tracking/:noradId/position` | SGP4 propagated position |
| `GET /api/v1/tracking/:noradId/trajectory` | Predicted orbit trail |
| `GET /api/v1/debris` | Debris catalog (filterable) |
| `GET /api/v1/debris/:id/geometry` | 3D orbit ring for debris |
| `GET /api/v1/analytics/summary` | Operations performance metrics |
| `GET /api/v1/analytics/report` | Full mission report |
| `GET /api/v1/analytics/report/export` | CSV/JSON download |
| `GET /api/v1/ai/overview` | AI engine dashboard |
| `POST /api/v1/ai/assess` | Generate AI flight directive |
| `POST /api/v1/ai/chat` | AI assistant chat |
| `GET /api/v1/ai/risk-map` | 3D risk map points |
| `GET /api/v1/spaceweather/current` | Solar flux, Kp, drag multiplier |
| `GET /api/v1/groundstations` | Ground station network |
| `GET /api/v1/search` | Global search |
| `GET /api/v1/notifications` | Notification queue |
| `GET /api/v1/settings` | System configuration |
| `GET /api/v1/audit` | Audit log |

---

## 📜 Standards & Methodologies

- **Orbital Mechanics**: Two-body problem solved via Keplerian-to-ECI coordinate rotation matrices (3-1-3 Euler) and RK4 (4th-order Runge-Kutta) trajectory propagation.
- **Relative Kinematics**: Clohessy-Wiltshire (Hill) equations for post-burn along-track/radial/cross-track displacement.
- **Collision Probability (Pc)**: Foster 2D Gaussian numerical integration over the encounter B-Plane (Simpson quadrature).
- **Propulsion Modeling**: Non-linear Tsiolkovsky rocket equation with dry mass, propellant reserves, and specific impulse (Isp).
- **Conjunction Data Standards**: CCSDS 508.0-B-1 Conjunction Data Message schema with XML/JSON/KVN export.
- **Live Tracking**: SGP4/SDP4 propagation via satellite.js v7 on CelesTrak public TLE data with 6-hour refresh.
- **TLE Management**: Server-side fetch with exponential backoff retry, batched rate limiting, snapshot fallback, and staleness detection.

---

## 🎨 Pages Overview

| Page | Purpose |
|---|---|
| **Landing** | Marketing entry with typewriter hero, feature cards, animated stats |
| **Mission Control** | Home dashboard: 3D globe, critical alerts, conjunction table, fuel status |
| **SSA Console** | Expert bento grid: CARA queue, B-plane, maneuver solvers, autopilot |
| **Autopilot** | Closed-loop policy engine: trigger rules, 5-stage pipeline, terminal |
| **Tracking** | Live SGP4: fleet list, 3D globe, time controls, telemetry panel |
| **Conjunction** | Deep-dive: close-approach visualization, risk metrics, CDM history |
| **Satellite** | Registry: list/detail views, telemetry, orbit, subsystems, passes |
| **Maneuvers** | Planner: candidate plans, orbital comparison, burn window, simulation |
| **Orbits** | Catalog: 3D fleet view, orbital elements table, regime filters |
| **Debris** | Catalog: list/detail, 3D orbit track, risk assessment, conjunctions |
| **Ground Stations** | Network: coverage map, station registry, online/offline stats |
| **Analytics** | 30-day: trends, severity charts, altitude bands, top objects |
| **Reports** | Mission reports: summary, risk tables, CDM evolution, CSV export |
| **Settings** | Configuration: thresholds, screening, notifications, AI, audit log |

---

## 👥 Hackathon Team Roles & Work Plans

- [**Lead Astrodynamicist & Mathematical Architect**](docs/members/LEAD_ASTRODYNAMICIST_WORK_PLAN.md): Orbital mechanics, coordinate transformations, B-plane collision geometry, and covariance propagation.
- [**3D Graphics & WebGL Engineer**](docs/members/3D_GRAPHICS_WEBGL_ENGINEER_WORK_PLAN.md): Three.js 3D Earth digital twin, orbital trajectory shaders, lighting, and dynamic camera controls.
- [**AI Flight Director & Prompt Engineer**](docs/members/AI_FLIGHT_DIRECTOR_WORK_PLAN.md): AI Engine JSON schema formatting, astrodynamics prompt design, and deterministic fallback engine.
- [**Astrodynamics Lab & Maneuver Optimization Lead**](docs/members/MANEUVER_OPTIMIZATION_LEAD_WORK_PLAN.md): 3-axis burn mechanics, Tsiolkovsky propellant calculation, B-plane encounter plot, and minimum-fuel optimizer.
- [**Fleet Telemetry, Space Weather & Standards Specialist**](docs/members/FLEET_TELEMETRY_STANDARDS_SPECIALIST_WORK_PLAN.md): Constellation telemetry, real-time space weather (F₁₀.₇, Kp) drag scaling, and CCSDS 508.0-B-1 CDM export.
- [**Operations Console UI Lead & Hackathon Presenter**](docs/members/OPERATIONS_CONSOLE_UI_LEAD_WORK_PLAN.md): Mission control console dashboard, conjunction threat ranking matrix, autonomous autopilot policy, and pitch presentation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
