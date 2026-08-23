# 🛰️ AEGIS-ORBITAL
### Autonomous Space Situational Awareness (SSA) & Collision Avoidance Flight Director Console

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Gemini 3.7](https://img.shields.io/badge/Google_Gemini-3.7_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**AEGIS-ORBITAL** is an intelligent, full-stack Space Situational Awareness (SSA) and Autonomous Collision Avoidance System designed to safeguard Low Earth Orbit (LEO) satellites from hypervelocity space debris encounters and prevent Kessler Syndrome.

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

### 🤖 3. AI Astrodynamics Flight Director (Powered by Gemini 3.7)
- **Automated Conjunction Assessment**: Analyzes Conjunction Data Messages (CDMs), satellite mass, thruster $I_{sp}$, and collision probabilities ($P_c$).
- **Structured Flight Directives**: Generates fuel-optimal burn epochs, $\Delta V$ vectors, risk urgency classifications, and operator telecommand checklists.
- **Interactive Advisory Assistant**: Real-time multi-turn astrodynamics chat interface for flight operators.
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
                                  │           AEGIS OPERATIONAL CONSOLE          │
                                  │               (React 18 + Vite)              │
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
                                           │     GOOGLE GEMINI 3.7     │
                                           │  (Flight Director Model)  │
                                           └───────────────────────────┘
```

---

## 📦 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **3D Visualization**: Three.js, WebGL, Custom BufferGeometry & Shaders
- **Backend**: Node.js, Express, tsx, esbuild
- **AI / LLM**: Google Gen AI SDK (`@google/genai`), Gemini 3.7 Flash
- **Astrodynamics Standards**: CCSDS 508.0-B-1 (Conjunction Data Message format)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aegis-orbital.git
   cd aegis-orbital
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy the example environment file and add your Gemini API Key:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
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
├── server.ts                       # Express backend server with Gemini 3.7 API integration
├── src/
│   ├── App.tsx                     # Main operator console dashboard layout
│   ├── main.tsx                    # React application root entry point
│   ├── index.css                   # Tailwind CSS styling and theme configuration
│   ├── types.ts                    # TypeScript definitions for orbital elements, CDMs, telemetry
│   ├── components/
│   │   ├── OrbitalGlobe3D.tsx          # Three.js 3D Earth digital twin & trajectory visualizer
│   │   ├── BPlaneCollisionPlot.tsx     # B-Plane encounter plane and covariance error ellipses
│   │   ├── ManeuverSimulationLab.tsx   # Delta-V propellant optimization and burn simulation
│   │   ├── AiFlightDirectorAdvisor.tsx # Gemini 3.7 AI Flight Director & interactive chat console
│   │   ├── ConjunctionRankingTable.tsx # Live conjunction risk assessment & priority ranking
│   │   ├── SatelliteFleetManager.tsx   # Constellation health, fuel, and status manager
│   │   ├── SpaceWeatherBar.tsx         # Real-time solar flux (F10.7) & Kp geomagnetic telemetry
│   │   ├── CdmExporterModal.tsx        # CCSDS Conjunction Data Message exporter (JSON/XML)
│   │   └── AutonomousAutoPilotModal.tsx# Closed-loop autonomous avoidance policy modal
│   ├── utils/
│   │   ├── orbitalMechanics.ts     # Keplerian-to-Cartesian conversion, B-Plane & orbit math
│   │   └── aiAssessmentFallback.ts # Deterministic astrodynamics fallback & heuristic models
│   └── data/
│       └── mockOrbitalData.ts      # Active satellite catalog, debris objects, CDMs, weather
├── package.json                    # Project dependencies and build scripts
└── vite.config.ts                  # Vite build and development configuration
```

---

## 📜 Standards & Methodologies

- **Orbital Mechanics**: Two-body Keplerian problem solved via perifocal-to-ECI coordinate rotation matrices.
- **Conjunction Data Standards**: Implements CCSDS 508.0-B-1 Conjunction Data Message schema.
- **Propulsion Modeling**: Non-linear Tsiolkovsky rocket equation with dry mass, propellant reserves, and specific impulse ($I_{sp}$).
- **Covariance Analysis**: 3-sigma position dispersion matrices transformed into encounter B-Plane coordinates $(\vec{\xi}, \vec{\zeta})$.

---

## 👥 Hackathon Team Roles

- **Lead Astrodynamicist / Systems Architect**: Orbital mathematics, collision probability modeling, B-plane mechanics.
- **3D Graphics & WebGL Engineer**: Three.js rendering, orbital track shaders, lighting, dynamic camera controls.
- **AI Systems & Prompt Engineer**: Gemini 3.7 JSON schema formatting, astrodynamics prompt design, multi-turn chat.
- **Frontend / Console UI Lead**: Operations dashboard layout, responsiveness, telemetry widgets, data flow.
- **Backend & Integration Specialist**: Express API routes, caching layer, rate-limit resilience, CDM format parsers.
- **Product & Presentation Lead**: Hackathon slide deck, live demo script, business case, pitch presentation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
