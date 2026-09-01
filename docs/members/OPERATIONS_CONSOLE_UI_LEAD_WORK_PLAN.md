# 🛰️ Operations Console UI Lead & Hackathon Presenter
## Individual Work Plan & Step-by-Step Task Guide


### 👤 Role Overview
* **Domain**: Main Dashboard Architecture, Component Assembly, Threat Ranking Matrix, Autonomous Autopilot Policy & Presentation Lead.
* **Assigned Files**:
  - `public/index.html` (Main Operations Console / dashboard)
  - `public/conjunction.html` (Conjunction detail page with risk ranking)
  - `public/autopilot.html` (Autonomous Autopilot Engine page)
  - `public/css/base.css` (Dark theme styling)
* **Goal**: Assemble all modular components into a breathtaking, unified Space Mission Control Console, build the live conjunction threat ranking table and autopilot policy modal, and lead the hackathon pitch deck and live demo.


### 📚 Concepts to Master
1. **Mission Control Dashboard UX**: High-contrast, dark-mode space operations console with glassmorphism, glowing status badges, and zero visual clutter.
2. **Conjunction Risk Categorization**: Sorting and filtering close encounters by severity (CRITICAL, WARNING, MONITOR) based on $P_c$ and miss distance.
3. **Closed-Loop Autonomous Autopilot**: Setting operational rules and threshold-based auto-burn triggers when manual operator latency is unacceptable.
4. **Hackathon Pitch Craft**: Structuring a high-drama 3-minute pitch that hooks judges immediately and showcases live interactive capabilities.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: Dashboard Layout & Theme Foundation (Hours 0 - 8)
- [ ] Configure `index.css` with a sleek dark space theme (slate/zinc background, glowing cyan accents, glassmorphic cards, crisp typography).
- [ ] Build the layout structure in `public/index.html`:
  - **Top Navigation Bar**: System status indicators, UTC mission clock, active satellite selector, and modal trigger buttons (Autopilot, CDM Exporter).
  - **Upper Banner**: Space Weather Telemetry Bar (`SpaceWeatherBar.tsx`).
  - **Main Viewport (Left/Center)**: 3D Orbital Earth Digital Twin (`OrbitalGlobe3D.tsx`).
  - **Operations Lab Tabs (Right/Bottom)**: Tabbed switcher between **AI Flight Director Advisor**, **Collision Avoidance Maneuver Lab**, and **B-Plane Encounter Plot**.

#### Phase 2: Conjunction Threat Ranking Matrix (Hours 8 - 16)
- [ ] Build `ConjunctionRankingTable.tsx`:
  - Interactive table displaying all active conjunction alerts.
  - Columns: Satellite Name, Threat Debris Object, Time-to-Closest-Approach (TCA countdown), Miss Distance (km/m), Collision Probability ($P_c$), and Threat Badge.
  - Color-coded badges: Red for CRITICAL ($P_c > 10^{-4}$), Yellow for WARNING, Green for MONITOR.
  - Row click action: Instantly focuses the 3D globe and loads the event into the AI Flight Director and Maneuver Lab!

#### Phase 3: Closed-Loop Autonomous Autopilot Policy Modal (Hours 16 - 22)
- [ ] Build `AutonomousAutoPilotModal.tsx`:
  - Autopilot Status Toggle: Active / Standby.
  - Policy Rule Sliders:
    - Auto-execute burn if $P_c > \text{Threshold}$ (e.g., $1 \times 10^{-3}$).
    - Auto-execute burn if $\text{Time to TCA} < \text{Threshold}$ (e.g., $90\text{ minutes}$).
    - Maximum allowed fuel per auto-burn (e.g., $1.0\text{ kg}$).
  - Live execution event log showing simulated autonomous trigger history.

#### Phase 4: Full-Stack Component Integration & State Management (Hours 22 - 28)
- [ ] Wire up global React state connecting:
  - Selected Satellite from **Fleet Telemetry Specialist**'s Fleet Manager.
  - Selected Conjunction from the Threat Table.
  - 3D Globe camera focus and trajectory updates from **3D Graphics & WebGL Engineer**.
  - AI Flight Directive from **AI Flight Director & Prompt Engineer**.
  - Delta-V maneuver simulation state from **Maneuver Optimization Lead**.
- [ ] Ensure the entire application is responsive and fast with zero lag.

#### Phase 5: Pitch Deck, Demo Video & Hackathon Rehearsal (Hours 28 - 36)
- [ ] Create the winning 3-minute hackathon pitch deck / presentation script.
- [ ] Record a 60-second backup demo video of the live 3D web application in case of projector or internet issues during judging.
- [ ] Lead team rehearsals ensuring every member knows their 30-second speaking part.

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**:
  - From **Lead Astrodynamicist**: Types and math helpers.
  - From **3D Graphics & WebGL Engineer**: `OrbitalGlobe3D.tsx`.
  - From **AI Flight Director & Prompt Engineer**: `AiFlightDirectorAdvisor.tsx`.
  - From **Maneuver Optimization Lead**: `ManeuverSimulationLab.tsx` and `BPlaneCollisionPlot.tsx`.
  - From **Fleet Telemetry & Standards Specialist**: `SatelliteFleetManager.tsx`, `SpaceWeatherBar.tsx`, `CdmExporterModal.tsx`, `mockOrbitalData.ts`.
* **Outputs to Provide**:
  - To **The Whole Team**: The integrated, working `App.tsx` console and the pitch presentation script.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Open the presentation, deliver the opening hook about the space debris crisis, drive the dashboard UI during the live demonstration, and close with the mission impact and commercial summary.
