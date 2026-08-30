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
- **WebGL Earth Engine**: High-fidelity 3D Earth representation (6,378 km scale) with equatorial graticules, atmospheric scattering shaders, and a 3D celestial starfield.
- **Real-Time Orbit Propagation**: Two-body Keplerian-to-Cartesian state vector propagation in the Earth-Centered Inertial (ECI) coordinate frame.
- **Dynamic Orbital Trajectories**: Visualizes active satellite orbits, space debris cloud vectors, point-of-closest-approach markers, and post-maneuver diverted orbits.

### 🎯 2. B-Plane Encounter & Covariance Modeler
- **Collision Plane Geometry**: Maps the encounter plane ($\vec{\xi}, \vec{\zeta}$) perpendicular to the relative velocity vector.
- **Covariance Dispersion Ellipses**: Computes combined $1\sigma$, $2\sigma$, and $3\sigma$ positional error boundaries against Hard Body Radii (HBR).
- **Drag-Induced Dispersion**: Visualizes orbital uncertainty growth driven by space weather surges.

### 🤖 3. AI Astrodynamics Flight Director (Powered by AI Engine)
- **Automated Conjunction Assessment**: Analyzes Conjunction Data Messages (CDMs), satellite mass, thruster $I_{sp}$, and collision probabilities ($P_c$).
- **Structured Flight Directives**: Generates fuel-optimal burn epochs, $\Delta V$ vectors, risk urgency classifications, and operator telecommand checklists.
- **Fault-Tolerant Fallback**: Built-in deterministic astrodynamics calculation engine with in-memory caching to guarantee continuous flight operations during rate limits.

### 🚀 4. Collision Avoidance Maneuver Lab
- **Multi-Axis Burn Simulator**: Simulates Prograde/Retrograde, Radial (In/Out), and Cross-Track (Normal/Anti-Normal) maneuvers.
- **Tsiolkovsky Propellant Optimization**: Computes exact fuel expenditure ($\Delta m = m_0 (1 - e^{-\Delta V / (I_{sp} g_0)})$), post-burn miss distances, and orbital period changes.
- **Secondary Conjunction Screening**: Scans 72-hour forward post-burn trajectories to ensure no secondary collision hazards.

### 🛰️ 5. Fleet Telemetry & Space Weather Engine
- **Constellation Management**: Monitors fuel mass, propellant reserve, delta-V budget, and status for satellite constellations.
- **Space Weather Telemetry**: Monitors solar flux ($F_{10.7}$), geomagnetic storm indexes ($K_p$), and thermospheric atmospheric drag density multipliers.
- **CCSDS CDM Exporter**: Exports standardized Conjunction Data Messages in compliant JSON and XML formats for inter-agency coordination.
- **Autonomous Autopilot**: Closed-loop policy engine with threshold-based auto-burn execution for zero-latency collision avoidance.

---

## 🏗️ System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │            SOS OPERATIONAL CONSOLE           │
                                  │          (HTML5 + CSS3 + ES6+ JS)            │
                                  └───────┬───────────────────────────────┬──────┘
                                          │                               │
                 ┌────────────────────────┴─────────┐   ┌─────────────────┴───────────────────┐
                 │        3D ORBITAL ENGINE         │   │         ASTRODYNAMICS SUITE         │
                 │     (Three.js + WebGL Canvas)    │   │  (B-Plane, Maneuvers, Covariance)  │
                 └──────────────────────────────────┘   └─────────────────────────────────────┘
                                          ▲                               ▲
                                          │                               │
                                  ┌───────┴───────────────────────────────┴──────┐
                                  │          EXPRESS API / ASTRO BACKEND         │
                                  │      (Cached State & Astrodynamics Math)     │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                          ┌─────────────┴─────────────┐
                                          │         AI ENGINE         │
                                          │  (Flight Director Model)  │
                                          └───────────────────────────┘
```

---

## 📦 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript (no build step required)
- **3D Visualization**: Three.js, WebGL, Custom BufferGeometry & Shaders
- **Charts**: Recharts & dependency-free Canvas 2D visualizations
- **Backend**: Node.js, Express, TypeScript (compiled to CommonJS), tsx
- **AI / LLM**: AI Engine (deterministic fallback engine)
- **Live Tracking**: satellite.js v7 (SGP4/SDP4) with CelesTrak TLE data
- **Astrodynamics Standards**: CCSDS 508.0-B-1 (Conjunction Data Message format)

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
│   ├── groundstations.html      # Ground station network coverage
│   ├── analytics.html           # 30-day operations performance
│   ├── reports.html             # Reports page
│   ├── settings.html            # System configuration
│   ├── css/                     # Stylesheets (base, components, screens, ...)
│   └── js/                      # Frontend scripts
│       ├── orbital.js           # Three.js 3D Earth globe + Keplerian visualization
│       ├── sim-core.js          # Client-side astrodynamics (RK4, TCA, B-plane, Pc)
│       ├── tracking.js          # Real-time SGP4 tracking engine
│       ├── api.js               # Shared API client (window.SOS.api)
│       ├── shell.js             # Persistent sidebar + topbar navigation shell
│       ├── data/                # World map / geo data
│       ├── pages/               # Per-page controllers (12 files)
│       └── vendor/              # Vendored satellite.js + loader
├── api/v1/                      # Vercel serverless functions (tracking + catch-all)
├── server/src/                  # Express backend (Render): routes, services, data
│   ├── index.ts                 # Express app entry point
│   ├── routes/                  # 17 API route modules
│   └── services/                # kepler.ts, maneuver.ts, propagator.ts, tle-fetcher.ts
├── scripts/                     # Build scripts (scripts/build.js)
├── tests/                       # Ad-hoc Puppeteer test scripts
├── logs/                        # Server logs
├── docs/                        # Documentation & team work plans
│   ├── OPERATIONS_GUIDE.md      # Step-by-step operational guide
│   ├── FEATURES.md              # Complete feature & page guide
│   ├── BACKEND_REQUIREMENTS.md  # Full API contract specification
│   ├── WORKFLOW.md              # Plain-language workflow explanation
│   ├── SIH2026-PRESENTATION-CONTENT.md  # Hackathon presentation content
│   └── members/                 # 6 team member work plans
├── Assets/                      # Screenshots & presentation template
├── package.json                 # Dependencies and build scripts
├── vercel.json                  # Vercel config (outputDirectory: public)
├── render.yaml                  # Render backend config
└── README.md
```

---

## 📜 Standards & Methodologies

- **Orbital Mechanics**: Two-body problem solved via Keplerian-to-ECI coordinate rotation matrices (3-1-3 Euler) and RK4 (4th-order Runge-Kutta) trajectory propagation.
- **Conjunction Data Standards**: Implements CCSDS 508.0-B-1 Conjunction Data Message schema.
- **Propulsion Modeling**: Non-linear Tsiolkovsky rocket equation with dry mass, propellant reserves, and specific impulse ($I_{sp}$).
- **Collision Probability (Pc)**: Foster 2D Gaussian numerical integration over the encounter B-Plane (Simpson quadrature) and B-Plane covariance analysis.
- **Maneuver Miss-Distance**: Clohessy-Wiltshire (Hill) equations for post-burn along-track/radial/cross-track displacement.
- **Live Tracking**: SGP4/SDP4 propagation via satellite.js v7 on CelesTrak public TLE data.

---

## 👥 Hackathon Team Roles

- **Lead Astrodynamicist / Systems Architect**: Orbital mathematics, collision probability modeling, B-plane mechanics.
- **3D Graphics & WebGL Engineer**: Three.js rendering, orbital track shaders, lighting, dynamic camera controls.
- **AI Systems & Prompt Engineer**: AI Engine JSON schema formatting, astrodynamics prompt design, deterministic fallback design.
- **Frontend / Console UI Lead**: Operations dashboard layout, responsiveness, telemetry widgets, data flow.
- **Backend & Integration Specialist**: Express API routes, caching layer, rate-limit resilience, CDM format parsers.
- **Product & Presentation Lead**: Hackathon slide deck, live demo script, business case, pitch presentation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
