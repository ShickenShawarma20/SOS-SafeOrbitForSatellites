# 🛰️ SOS: Safe Orbit for Satellites
## Autonomous Space Situational Awareness (SSA) & Collision Avoidance Flight Director
### Master System Architecture, Astrodynamics Models & Component Technical Specifications

---

## 📑 Table of Contents
1. [System Overview & Mission Objectives](#1-system-overview--mission-objectives)
2. [Astrodynamics & Mathematical Foundation](#2-astrodynamics--mathematical-foundation)
   - [Keplerian-to-Cartesian Orbit Propagation](#keplerian-to-cartesian-orbit-propagation)
   - [B-Plane Encounter Geometry ($\vec{\xi}, \vec{\zeta}$)](#b-plane-encounter-geometry)
   - [Positional Covariance & Collision Probability ($P_c$)](#positional-covariance--collision-probability)
   - [Tsiolkovsky Propellant Optimization & Multi-Axis $\Delta V$](#tsiolkovsky-propellant-optimization)
   - [Space Weather Drag Multiplier ($F_{10.7}$ & $K_p$)](#space-weather-drag-multiplier)
3. [End-to-End System Architecture](#3-end-to-end-system-architecture)
4. [Component-by-Component Specifications](#4-component-by-component-specifications)
   - [Core Visualizer: `OrbitalGlobe3D.tsx`](#orbitalglobe3dtsx)
   - [Encounter Modeler: `BPlaneCollisionPlot.tsx`](#bplanecollisionplottsx)
   - [Maneuver Simulator: `ManeuverSimulationLab.tsx`](#maneuversimulationlabtsx)
   - [AI Flight Director: `AiFlightDirectorAdvisor.tsx`](#aiflightdirectoradvisortsx)
   - [Risk Matrix: `ConjunctionRankingTable.tsx`](#conjunctionrankingtabletsx)
   - [Fleet Operations: `SatelliteFleetManager.tsx`](#satellitefleetmanagertsx)
   - [Environmental Feed: `SpaceWeatherBar.tsx`](#spaceweatherbartsx)
   - [Standard Exporter: `CdmExporterModal.tsx`](#cdmexportermodaltsx)
   - [Autopilot Policy: `AutonomousAutoPilotModal.tsx`](#autonomousautopilotmodaltsx)
5. [AI Flight Director Engine (Gemini 3.7 & Fallback)](#5-ai-flight-director-engine)
6. [Data Models & Schema Definitions (`types.ts`)](#6-data-models--schema-definitions)
7. [6-Member Team Execution Matrix & File Ownership](#7-6-member-team-execution-matrix)
8. [Live Hackathon Demonstration Playbook](#8-live-hackathon-demonstration-playbook)

---

## 1. System Overview & Mission Objectives

**SOS (Safe Orbit for Satellites)** is an intelligent, full-stack Space Situational Awareness (SSA) and Autonomous Collision Avoidance System designed to safeguard Low Earth Orbit (LEO) satellites from hypervelocity space debris encounters and prevent Kessler Syndrome.

### Core Capabilities:
1. **Interactive 3D Digital Twin**: High-fidelity WebGL Earth rendering (6,378 km scale) with real-time Keplerian orbit propagation and 3D trajectory branching.
2. **B-Plane Encounter & Covariance Modeler**: Precision collision plane geometry mapping $(\vec{\xi}, \vec{\zeta})$ and 1σ / 2σ / 3σ dispersion ellipses.
3. **AI Astrodynamics Flight Director (Powered by Gemini 3.7)**: Real-time generation of structured flight directives, burn epochs, $\Delta V$ vectors, telecommand checklists, and multi-turn operator chat.
4. **Collision Avoidance Maneuver Lab**: Multi-axis burn simulator (Prograde/Retrograde, Radial, Cross-Track) with Tsiolkovsky fuel optimization and 72-hour secondary conjunction screening.
5. **Fleet Telemetry & Space Weather Engine**: Real-time monitoring of solar flux ($F_{10.7}$) and geomagnetic storm index ($K_p$), automated CCSDS CDM generation, and closed-loop autonomous autopilot.

---

## 2. Astrodynamics & Mathematical Foundation

```
+-----------------------------------------------------------------------------------+
|                            SOS ASTRODYNAMICS FOUNDATIONS                          |
+----------------------+-----------------------------+------------------------------+
| 1. Keplerian to ECI  | 2. B-Plane Collision Frame  | 3. Covariance & HBR          |
| Perifocal to ECI     | Encounter plane (ξ, ζ)      | 1σ, 2σ, 3σ error ellipses    |
| coordinate rotation  | perpendicular to V_rel      | against Hard Body Radius     |
+----------------------+-----------------------------+------------------------------+
| 4. Multi-Axis ΔV     | 5. Tsiolkovsky Fuel Burn    | 6. Space Weather Drag        |
| Prograde, Radial,    | Δm = m0(1 - e^(-ΔV/Isp·g0)) | F10.7 & Kp index atmospheric |
| Cross-Track burns    | exact propellant mass used  | density scaling factor       |
+----------------------+-----------------------------+------------------------------+
```

### Keplerian-to-Cartesian Orbit Propagation
Orbits are defined by six classical Keplerian orbital elements:
* Semi-major axis ($a$) in kilometers.
* Eccentricity ($e$), defining orbital shape.
* Inclination ($i$), orbital tilt relative to Earth's equatorial plane.
* Right Ascension of the Ascending Node ($\Omega$).
* Argument of Perigee ($\omega$).
* True Anomaly ($\nu$), angular position of the satellite in its orbital plane.

The position vector in the perifocal coordinate frame is:
$$\vec{r}_{pqw} = \begin{bmatrix} r \cos \nu \\ r \sin \nu \\ 0 \end{bmatrix}, \quad \text{where } r = \frac{a(1 - e^2)}{1 + e \cos \nu}$$

Transformation to the Earth-Centered Inertial (ECI) coordinate frame is performed using the Euler 3-1-3 rotation matrix:
$$\vec{r}_{ECI} = \mathbf{R}_z(-\Omega) \mathbf{R}_x(-i) \mathbf{R}_z(-\omega) \vec{r}_{pqw}$$

---

### B-Plane Encounter Geometry
The **B-Plane (or collision encounter plane)** is defined perpendicular to the relative velocity vector ($\vec{v}_{\text{rel}} = \vec{v}_{\text{target}} - \vec{v}_{\text{debris}}$):
* $\vec{k} = \frac{\vec{v}_{\text{rel}}}{\|\vec{v}_{\text{rel}}\|}$ (Out of B-plane normal).
* $\vec{h} = \frac{\vec{r}_{\text{target}} \times \vec{v}_{\text{target}}}{\|\vec{r}_{\text{target}} \times \vec{v}_{\text{target}}\|}$ (Orbital angular momentum vector).
* $\vec{\xi} = \frac{\vec{k} \times \vec{h}}{\|\vec{k} \times \vec{h}\|}$ (Horizontal axis in the B-plane, roughly cross-track).
* $\vec{\zeta} = \vec{k} \times \vec{\xi}$ (Vertical axis in the B-plane, roughly radial).

The miss distance vector $\vec{B}$ projected onto the encounter plane is:
$$\vec{B} = (\Delta \vec{r} \cdot \vec{\xi})\vec{\xi} + (\Delta \vec{r} \cdot \vec{\zeta})\vec{\zeta}$$
$$\text{Miss Distance} = \|\vec{B}\| = \sqrt{B_\xi^2 + B_\zeta^2}$$

---

### Positional Covariance & Collision Probability ($P_c$)
The combined positional error covariance matrix $\mathbf{C} = \mathbf{C}_{\text{primary}} + \mathbf{C}_{\text{secondary}}$ is projected onto the B-plane:
$$\mathbf{C}_{\text{B-plane}} = \begin{bmatrix} \sigma_\xi^2 & \rho \sigma_\xi \sigma_\zeta \\ \rho \sigma_\xi \sigma_\zeta & \sigma_\zeta^2 \end{bmatrix}$$

The combined Hard Body Radius ($R_{\text{HBR}} = R_{\text{primary}} + R_{\text{debris}}$) defines the circular collision cross-section. The collision probability $P_c$ is calculated by integrating the 2D Gaussian density function:
$$P_c = \frac{1}{2\pi \sqrt{\det \mathbf{C}_{\text{B-plane}}}} \iint_{\|\vec{r}\| \le R_{\text{HBR}}} \exp\left(-\frac{1}{2} (\vec{r} - \vec{B})^T \mathbf{C}_{\text{B-plane}}^{-1} (\vec{r} - \vec{B})\right) d\xi d\zeta$$

---

### Tsiolkovsky Propellant Optimization
For any velocity vector change $\Delta \vec{V} = [\Delta V_{\text{prograde}}, \Delta V_{\text{radial}}, \Delta V_{\text{normal}}]$:
$$\|\Delta V\| = \sqrt{\Delta V_t^2 + \Delta V_r^2 + \Delta V_n^2}$$

Propellant mass expended ($\Delta m$) is calculated using the Tsiolkovsky rocket equation:
$$\Delta m = m_0 \left(1 - \exp\left(-\frac{\|\Delta V\|}{I_{sp} \cdot g_0}\right)\right)$$
* $m_0$: Total satellite wet mass at epoch (kg).
* $I_{sp}$: Thruster specific impulse (e.g., $220\text{ s}$ for monopropellant hydrazine, $1500\text{ s}$ for Hall electric thrusters).
* $g_0$: Standard Earth gravity ($9.80665\text{ m/s}^2$).

---

### Space Weather Drag Multiplier
Thermospheric atmospheric density ($\rho_{\text{atm}}$) varies dynamically with solar activity and geomagnetic storms:
$$\rho_{\text{eff}} = \rho_0 \cdot \left(1 + \alpha \frac{F_{10.7} - 70}{100} + \beta \frac{K_p}{9}\right)$$
* **$F_{10.7}$ (Solar Radio Flux at 10.7 cm)**: Nominal ~70 sfu, peaking above 250 sfu during solar storms.
* **$K_p$ Index**: Planetary geomagnetic storm index (0–9 scale, $K_p \ge 5$ indicates geomagnetic storm).
* High space weather activity accelerates in-track positional covariance dispersion ($\sigma_{\text{in-track}}$), expanding the collision risk window.

---

## 3. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SOS-ORBITAL USER INTERFACE                         │
│                           (React 18 + Vite App)                            │
└───────────────┬────────────────────────────────────────────┬───────────────┘
                │                                            │
   ┌────────────┴─────────────┐                ┌─────────────┴─────────────┐
   │    3D ORBITAL ENGINE     │                │   ASTRODYNAMICS LAB SUITE │
   │ (Three.js WebGL Canvas)  │                │ (B-Plane, Maneuvers, Tele)│
   └────────────┬─────────────┘                └─────────────┬─────────────┘
                │                                            │
                └──────────────────────┬─────────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │   EXPRESS API ASTRO BACKEND │
                        │ (State Cache & Calculations)│
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │      GOOGLE GEMINI 3.7      │
                        │    (AI Flight Director)     │
                        └─────────────────────────────┘
```

---

## 4. Component-by-Component Specifications

### `OrbitalGlobe3D.tsx`
* **Purpose**: Photorealistic 3D Earth digital twin & orbital trajectory visualizer.
* **Key Features**:
  * Scaled 3D Earth sphere (radius scaled to $6,378\text{ km}$ basis) with high-res texture and atmospheric glow shader.
  * Orbital trajectory lines:
    - Active satellite nominal path (Cyan glowing line).
    - Debris / secondary object path (Red pulsing line).
    - Post-avoidance diverted trajectory (Neon Green line).
  * 3D satellite mesh with solar panels and velocity orientation vectors.
  * Close encounter encounter point marked with a flashing yellow/red sphere.
  * Orbital camera controls (Zoom, Pan, Rotate, Follow Satellite mode).

### `BPlaneCollisionPlot.tsx`
* **Purpose**: Interactive 2D encounter B-Plane visualization showing miss distance geometry and covariance dispersion.
* **Key Features**:
  * 2D Cartesian plane $(\xi, \zeta)$ centered at the primary satellite.
  * Hard Body Radius (HBR) safety boundary circle (e.g., 20 meters).
  * 1-sigma, 2-sigma, and 3-sigma positional error ellipses of the debris.
  * Visual impact vector $\vec{B}$ showing nominal vs. post-maneuver target position.
  * Space weather slider demonstrating real-time covariance expansion under high solar flux ($F_{10.7}$).

### `ManeuverSimulationLab.tsx`
* **Purpose**: Precision delta-V maneuver design and propellant expenditure laboratory.
* **Key Features**:
  * 3-Axis Burn Controls:
    - Prograde / Retrograde ($\Delta V_t$, m/s)
    - Radial In / Radial Out ($\Delta V_r$, m/s)
    - Normal / Anti-Normal ($\Delta V_n$, m/s)
  * Instant calculation of post-burn miss distance, propellant used ($\text{kg}$), and change in orbital period ($\Delta T$, seconds).
  * "Auto-Solve Optimal Burn" button utilizing minimum $\Delta V$ constrained optimization.
  * 72-Hour Forward Screening graph ensuring the avoidance burn does not cause secondary conjunctions.

### `AiFlightDirectorAdvisor.tsx`
* **Purpose**: Gemini 3.7-powered intelligent Flight Director advisory console.
* **Key Features**:
  * Generates structured flight directives for any selected Conjunction Data Message (CDM).
  * Provides:
    - Burn Epoch timestamp recommendation.
    - Optimal $\Delta V$ components vector.
    - Operator Telecommand Execution Checklist.
    - Post-maneuver tracking and orbit restoration guidance.
  * Multi-turn interactive chat allowing operators to ask questions (*"What if we delay the burn by 1 orbit?", "Can we do an out-of-plane burn instead?"*).
  * Deterministic heuristic fallback engine if API rate limits or network issues occur.

### `ConjunctionRankingTable.tsx`
* **Purpose**: Real-time Conjunction Data Message (CDM) threat matrix and risk ranking.
* **Key Features**:
  * Live filterable table sorted by AI Risk Score and Time-to-Closest-Approach (TCA).
  * Visual indicators: CRITICAL (Red, $P_c > 10^{-4}$), WARNING (Yellow, $P_c > 10^{-6}$), MONITOR (Green).
  * Instant-action buttons: "Analyze with AI", "Open Maneuver Lab", "Export CDM".

### `SatelliteFleetManager.tsx`
* **Purpose**: Constellation telemetry and propellant budget health manager.
* **Key Features**:
  * Monitors active satellites in the operator's fleet (e.g., SOS-1, SOS-2, SENTINEL-X).
  * Tracks remaining fuel mass ($\text{kg}$), cumulative $\Delta V$ expenditure, battery state of charge, and thruster health.
  * Lifetime estimation based on current collision avoidance burn frequency.

### `SpaceWeatherBar.tsx`
* **Purpose**: Real-time solar and geomagnetic environmental dashboard.
* **Key Features**:
  * Solar Radio Flux index ($F_{10.7}$ in solar flux units).
  * Planetary geomagnetic storm index ($K_p$).
  * Thermospheric atmospheric drag multiplier readout informing flight operators when positional uncertainty is elevated.

### `CdmExporterModal.tsx`
* **Purpose**: CCSDS standard data export for inter-agency coordination (NASA, ESA, US Space Command).
* **Key Features**:
  * Generates compliant CCSDS 508.0-B-1 Conjunction Data Messages in both JSON and XML formats.
  * One-click clipboard copy and file download for operational handoffs.

### `AutonomousAutoPilotModal.tsx`
* **Purpose**: Closed-loop automated collision avoidance policy configurator.
* **Key Features**:
  * Configurable auto-burn trigger thresholds (e.g., auto-execute if $P_c > 10^{-3}$ and $\text{TCA} < 2\text{ hours}$).
  * Safety overrides, ground confirmation bypass toggles, and execution logs.

---

## 5. AI Flight Director Engine (Gemini 3.7 & Fallback)

### AI Integration Design
The backend uses the **Google Gen AI SDK** (`@google/genai`) connecting to **Gemini 3.7 Flash**.

```
[ Conjunction Telemetry + Satellite Specs ]
                     │
                     ▼
  [ Gemini 3.7 Flight Director Prompt ]
   (Enforcing Strict JSON Output Schema)
                     │
          ┌──────────┴──────────┐
          │ Response Received?  │
          └──────────┬──────────┘
             YES     │     NO (Error/Timeout)
        ┌────────────┴────────────┐
        ▼                         ▼
 [ Structured AI Directive ]  [ Deterministic Fallback Engine ]
 (Delta-V, Epoch, Checklist)  (Mathematical Astrodynamics Models)
```

### Deterministic Astrodynamics Fallback
To ensure flight operations are never interrupted by network latency or API rate limits, the system contains a built-in mathematical fallback engine (`aiAssessmentFallback.ts`):
* Calculates optimal prograde/retrograde burn vectors using classical Gauss perturbation equations.
* Computes analytical propellant mass and new miss distance.
* Assembles standard operational checklists automatically.

---

## 6. Data Models & Schema Definitions (`types.ts`)

The system operates on standardized TypeScript interfaces:

* **`Satellite`**: `id`, `name`, `noradId`, `orbit` (semi-major axis, eccentricity, inclination, RAAN, argPerigee, trueAnomaly), `massKg`, `propellantMassKg`, `ispSec`, `status`.
* **`DebrisObject`**: `id`, `name`, `noradId`, `orbit`, `estimatedSizeM`, `source`.
* **`ConjunctionEvent`**: `id`, `satelliteId`, `debrisId`, `tcaTimestamp`, `missDistanceKm`, `relativeVelocityKmS`, `collisionProbability`, `riskLevel`, `bPlane` ($\xi, \zeta, \sigma_\xi, \sigma_\zeta, \rho$).
* **`ManeuverDirective`**: `burnEpoch`, `deltaV` (prograde, radial, normal, magnitude), `fuelUsedKg`, `projectedMissDistanceKm`, `recommendedStrategy`, `telecommandsChecklist`.
* **`SpaceWeather`**: `f107Flux`, `kpIndex`, `dragMultiplier`, `solarCyclePhase`.

---

## 7. 6-Member Team Execution Matrix

```
+------------------------------------------------------------------------------------+
|                          6-MEMBER SOS DEVELOPMENT MATRIX                           |
+--------+----------------------------+----------------------------------------------+
| Member | Role                       | Primary Files & Deliverables                 |
+--------+----------------------------+----------------------------------------------+
| **M1** | Lead Astrodynamicist       | `src/utils/orbitalMechanics.ts`, Keplerian   |
|        | & Math Architect           | ECI propagator, B-plane math, coordinates.   |
+--------+----------------------------+----------------------------------------------+
| **M2** | 3D Graphics & WebGL        | `src/components/OrbitalGlobe3D.tsx`, Three.js|
|        | Engineer                   | Earth shaders, orbital trails, camera rig.   |
+--------+----------------------------+----------------------------------------------+
| **M3** | AI Flight Director &       | `server.ts`, Gemini 3.7 integration, prompt  |
|        | Prompt Engineer            | schemas, `AiFlightDirectorAdvisor.tsx`.      |
+--------+----------------------------+----------------------------------------------+
| **M4** | Astrodynamics Lab &        | `src/components/ManeuverSimulationLab.tsx`,  |
|        | Optimization Lead          | `src/components/BPlaneCollisionPlot.tsx`.    |
+--------+----------------------------+----------------------------------------------+
| **M5** | Fleet Telemetry &          | `src/components/SatelliteFleetManager.tsx`,  |
|        | Standards Specialist       | `SpaceWeatherBar.tsx`, `CdmExporterModal.tsx`|
+--------+----------------------------+----------------------------------------------+
| **M6** | Console UI Lead &          | `src/App.tsx`, `ConjunctionRankingTable.tsx`,|
|        | Hackathon Presenter        | `AutonomousAutoPilotModal.tsx`, Pitch Deck.  |
+--------+----------------------------+----------------------------------------------+
```

---

## 8. Live Hackathon Demonstration Playbook

### The 3-Minute Live Demo Flow:
1. **0:00 – 0:30 (Mission Control Overview)**:
   * Open the SOS Operations Console.
   * Point out the real-time 3D Earth, active satellite fleet, and live Space Weather bar ($F_{10.7}$ and $K_p$).
2. **0:30 – 1:15 (Threat Detection & B-Plane Analysis)**:
   * Select the critical conjunction: **SOS-1 vs. Cosmos-1408 Debris** ($P_c = 8.4 \times 10^{-3}$, Miss Distance = 142 meters).
   * Open the **B-Plane Encounter Plot**; show the debris error ellipse overlapping the satellite's Hard Body Radius.
3. **1:15 – 2:00 (AI Flight Director Directive)**:
   * Click **"Analyze with Gemini 3.7"**.
   * Show the structured flight directive generated in under 2 seconds: recommended $+2.15\text{ m/s}$ prograde burn, fuel cost $0.34\text{ kg}$, and step-by-step telecommand checklist.
4. **2:00 – 2:40 (3D Maneuver Simulation & Autopilot)**:
   * Send the directive into the **Maneuver Lab**.
   * Watch the green post-maneuver trajectory branch away on the 3D globe, expanding clearance to $16.8\text{ km}$.
   * Demonstrate the **Autonomous Autopilot** policy modal and export the compliant CCSDS CDM.
5. **2:40 – 3:00 (Business Impact & Wrap-Up)**:
   * Conclude with key metrics: zero-latency reaction time, propellant savings, and constellation scalability.

---
*SOS System Architecture Document complete.*
