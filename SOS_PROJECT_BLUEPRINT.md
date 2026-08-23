# 🛰️ SOS: Safe Orbit for Satellites
## Autonomous Satellite Collision Avoidance System
### Master Project Blueprint, System Architecture & Hackathon Roadmap

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Fundamental Concepts Explained](#2-fundamental-concepts-explained)
3. [System Architecture & Data Pipeline](#3-system-architecture--data-pipeline)
4. [Technology Stack Recommendation](#4-technology-stack-recommendation)
5. [6-Member Team Role & Work Breakdown Structure (WBS)](#5-6-member-team-role--work-breakdown-structure)
6. [Step-by-Step Implementation Roadmap (Phases 1 to 5)](#6-step-by-step-implementation-roadmap)
7. [Module-by-Module Technical Deep Dive & Specifications](#7-module-by-module-technical-deep-dive)
   - Module A: TLE Ingestion & SGP4 Orbital Propagation
   - Module B: Spatial Indexing & Conjunction Assessment (Broad & Narrow Phase)
   - Module C: Probability of Collision ($P_c$) & Risk Ranking
   - Module D: Autonomous Maneuver & $\Delta v$ Optimization
   - Module E: FastAPI Backend & Event Streaming
   - Module F: 3D Mission Control Dashboard (CesiumJS / Three.js)
8. [Hackathon Demo, Pitch Deck & Winning Presentation Strategy](#8-hackathon-demo--pitch-deck-strategy)

---

## 1. Executive Summary & Problem Statement

### The Problem: The Space Debris Crisis & Kessler Syndrome
* Over **36,000+** trackable pieces of space debris (>10 cm) and hundreds of thousands of smaller lethal fragments orbit Earth in Low Earth Orbit (LEO).
* Megaconstellations (e.g., Starlink, OneWeb, Kuiper) are adding thousands of new satellites yearly.
* **Manual Conjunction Assessment** is slow, error-prone, and overwhelming for satellite operators who receive hundreds of daily **Conjunction Data Messages (CDMs)**.
* Unnecessary avoidance burns waste limited satellite onboard propellant, drastically cutting spacecraft operational lifespan.

### The Solution: SOS (Safe Orbit for Satellites)
An **AI-driven, real-time autonomous conjunction assessment & collision avoidance platform** that:
1. Ingests live Two-Line Element (TLE) ephemeris data from CelesTrak / Space-Track.
2. Propagates satellite trajectories forward in time using **SGP4** physics models.
3. Detects close encounters using spatial indexing (**KD-Trees / Octrees**) for ultra-fast broad-phase filtering.
4. Computes 3D Miss Distance and **Collision Probability ($P_c$)** via Foster-1992 / Alfriend covariance ellipsoid algorithms.
5. Uses AI/ML + Optimization algorithms (Genetic Algorithm / SLSQP) to calculate **optimal, fuel-efficient avoidance maneuvers ($\Delta v$)** that clear the collision threshold and return the satellite safely to its nominal mission slot.
6. Delivers an interactive **3D Mission Control Dashboard** with real-time risk rankings, maneuver simulation visualizer, and automated operator alerts.

---

## 2. Fundamental Concepts Explained

```
+-----------------------------------------------------------------------------------+
|                                 CORE CONCEPTS                                     |
+----------------------+-----------------------------+------------------------------+
| 1. TLE & Ephemeris   | 2. SGP4 Propagator          | 3. Conjunction & TCA         |
| 2-line encoded orbit | High-speed orbital physics  | Time of Closest Approach &   |
| data from NORAD/DoD  | with atmospheric drag & J2  | 3D Euclidean Miss Distance   |
+----------------------+-----------------------------+------------------------------+
| 4. Covariance & Pc   | 5. Delta-V (Δv) Maneuver    | 6. Kessler Syndrome          |
| Positional ellipsoid | Velocity change (m/s)       | Cascading chain-reaction of  |
| collision probability| required to avert collision | orbital debris collisions    |
+----------------------+-----------------------------+------------------------------+
```

### Key Mathematical Formulations:
1. **3D Euclidean Distance at epoch $t$:**
   $$d(t) = \sqrt{(x_1(t) - x_2(t))^2 + (y_1(t) - y_2(t))^2 + (z_1(t) - z_2(t))^2}$$
2. **Impulsive Thrust Velocity Change ($\Delta v$):**
   $$\Delta v = \sqrt{\Delta v_x^2 + \Delta v_y^2 + \Delta v_z^2}$$
3. **Rocket Equation (Fuel Mass Expended):**
   $$\Delta m = m_0 \left(1 - e^{-\frac{\Delta v}{I_{sp} \cdot g_0}}\right)$$
   *(Where $m_0$ is satellite dry+wet mass, $I_{sp}$ is specific impulse, $g_0 \approx 9.80665 \text{ m/s}^2$)*

---

## 3. System Architecture & Data Pipeline

```
[ Data Source: CelesTrak / Space-Track Live TLE Feeds ]
                         │
                         ▼
           [ Module A: TLE Ingestion & Parsing ]
                         │
                         ▼
        [ Module A: SGP4 Trajectory Propagator ]
       (Generates future 3D Cartesian coords x,y,z)
                         │
                         ▼
     [ Module B: 3D KD-Tree Broad-Phase Screener ]
     (Screens 10,000+ pairs in <50ms for proximity < 50 km)
                         │
                         ▼
   [ Module B: Narrow-Phase TCA & Miss-Distance Calculator ]
     (Pinpoints exact second of closest approach & geometry)
                         │
                         ▼
    [ Module C: 3D Covariance & Collision Probability (Pc) ]
     (Calculates risk probability & multi-factor AI score)
                         │
                         ▼
   [ Module D: Autonomous Delta-V Avoidance Optimizer ]
     (Calculates minimum fuel burn vector ensuring >10 km margin)
                         │
                         ▼
        [ Module E: FastAPI Gateway & WebSocket Hub ]
                         │
                         ▼
    [ Module F: 3D Mission Control Interactive UI ]
     (CesiumJS / Three.js Globe, Live Alerts, Orbit Controls)
```

---

## 4. Technology Stack Recommendation

| Layer | Recommended Technology | Why Chosen for Hackathon |
|---|---|---|
| **Programming Language** | **Python 3.11+** & **JavaScript/TypeScript** | Industry standard for aerospace analytics & modern web |
| **Orbital Mechanics** | `skyfield`, `sgp4`, `scipy` | Precise, fast, open-source SGP4 propagation & coordinate frame transformations |
| **Spatial Indexing & Math** | `scipy.spatial.KDTree`, `numpy` | Millisecond-level 3D spatial neighbor search across 10,000+ objects |
| **AI / ML Risk Model** | `scikit-learn`, `xgboost` | Fast training, lightweight inference, highly interpretable feature importance |
| **Optimization Algorithm** | `scipy.optimize.minimize` (SLSQP) | Formulate delta-V minimization as constrained non-linear optimization |
| **Backend API** | `FastAPI`, `Uvicorn`, `WebSockets` | High-speed async server with auto-documentation and real-time streaming |
| **3D Orbit Visualization** | `Three.js` / `CesiumJS` | Photorealistic 3D Earth, trajectory rendering, glowing alert rings |
| **Frontend UI** | `React + Vite` | Slick dark-mode mission control UI with responsive operational panels |

---

## 5. 6-Member Team Role & Work Breakdown Structure

```
+------------------------------------------------------------------------------------+
|                         6-MEMBER TEAM RESPONSIBILITY MATRIX                        |
+--------+------------------------+--------------------------------------------------+
| Member | Role                   | Primary Domain & Deliverables                     |
+--------+------------------------+--------------------------------------------------+
| **M1** | Orbital Data & SGP4    | Data pipelines, CelesTrak TLE fetching, SGP4     |
|        | Pipeline Lead          | continuous propagator, ECI/ECEF coordinates.     |
+--------+------------------------+--------------------------------------------------+
| **M2** | Conjunction Assessment | 3D KD-Tree broad phase filter, TCA finding,      |
|        | & Geometry Lead        | Miss-distance calculations, relative velocity.   |
+--------+------------------------+--------------------------------------------------+
| **M3** | AI/ML Risk Analysis    | Collision probability (Pc), ML risk scorer,      |
|        | & Analytics Lead       | false-alarm reducer, threat classification.      |
+--------+------------------------+--------------------------------------------------+
| **M4** | Autonomous Maneuver    | Delta-v optimizer, burn vector calculation,      |
|        | & Trajectory Optimizer | fuel consumption modeling, orbit restoration.    |
+--------+------------------------+--------------------------------------------------+
| **M5** | Backend API &          | FastAPI server, WebSocket feeds, CDM generator,  |
|        | Integration Lead       | orchestration pipeline, database storage.        |
+--------+------------------------+--------------------------------------------------+
| **M6** | 3D Mission Control &   | 3D Earth visualization, React UI, real-time      |
|        | Frontend Lead          | risk charts, interactive maneuver simulator.     |
+--------+------------------------+--------------------------------------------------+
```

---

## 6. Step-by-Step Implementation Roadmap

### Phase 1: Setup & Data Ingestion (Hours 0 - 6)
- Setup project folder structure for backend and frontend.
- Establish TLE data download streams from CelesTrak for active satellites and high-density debris clouds.
- Verify SGP4 propagation converting orbital elements into 3D Cartesian coordinates $(x, y, z)$.

### Phase 2: Conjunction Assessment Engine (Hours 6 - 14)
- Implement 3D spatial indexing (`KDTree`) to rapidly filter out non-threatening objects.
- Perform fine-grained search to identify the exact **Time of Closest Approach (TCA)**.
- Compute relative velocity vectors and minimum 3D Euclidean miss distances.
- Calculate positional error covariance ellipsoids and collision probability ($P_c$).

### Phase 3: AI Risk Scoring & Autonomous Maneuver Optimizer (Hours 14 - 24)
- Build an AI threat scoring model based on proximity, collision probability, urgency, and kinetic energy.
- Implement the $\Delta v$ optimization routine:
  - Formulate non-linear constrained optimization (minimize fuel while keeping miss distance $>15 \text{ km}$).
  - Evaluate prograde, retrograde, and out-of-plane burn geometries.
  - Calculate propellant mass consumption via the Tsiolkovsky Rocket Equation.

### Phase 4: Full Stack Integration & Real-Time Visualization (Hours 24 - 32)
- Expose REST endpoints and WebSocket telemetry feeds in FastAPI.
- Build the 3D globe showing Earth, satellite orbits, debris orbits, and dynamic avoidance trajectory branches.
- Implement interactive operator actions (e.g., clicking "Simulate Maneuver" updates the 3D orbit in real time).

### Phase 5: Testing, Polishing & Pitch Preparation (Hours 32 - 36)
- Package 3 realistic demo scenarios (e.g., ISS vs. ASAT Debris, Megaconstellation Close Approach).
- Fine-tune dark-mode visual styling, glowing alert badges, and telemetry readouts.
- Rehearse the 3-minute pitch and prepare responses for technical judges.

---

## 7. Module-by-Module Technical Deep Dive

### Module A: TLE Ingestion & SGP4 Propagation (Member 1)
* **Objective**: Ingest Two-Line Element sets and calculate time-series positions $(x, y, z)$ and velocities $(v_x, v_y, v_z)$ in the Earth-Centered Inertial (ECI) coordinate frame.
* **Key Steps**:
  1. Download satellite TLE batches from public CelesTrak catalogs.
  2. Parse header metadata, NORAD ID, inclination, eccentricity, and mean motion.
  3. Propagate orbits across future time horizons (e.g., 24 to 72 hours) at discrete time steps.
  4. Output structured ephemeris records containing timestamps, Cartesian positions, velocities, and altitudes.

### Module B: Conjunction Detection & Spatial Indexing (Member 2)
* **Objective**: Screen millions of potential satellite-debris pairs and identify close encounters in real time.
* **Key Steps**:
  1. **Broad Phase**: Group 3D positions at each time step into a KD-Tree spatial structure to isolate candidate pairs within a 50 km proximity threshold.
  2. **Narrow Phase**: Use polynomial interpolation or Golden Section Search to locate the exact second of closest approach (TCA).
  3. Calculate relative velocity vector and 3D miss distance at TCA.

### Module C: Collision Probability $P_c$ & AI Risk Engine (Member 3)
* **Objective**: Quantify encounter risk based on positional uncertainty and prioritize critical alerts.
* **Key Steps**:
  1. Combine positional error covariance matrices of both objects on the 2D encounter plane (B-plane).
  2. Integrate Gaussian probability density over the combined hard-body radius (Foster-1992 method).
  3. Feed proximity, $P_c$, time-to-TCA, and relative velocity into an AI risk scoring model that assigns a threat score (0–100) and priority level (Critical, Warning, Low Risk).

### Module D: Maneuver & $\Delta v$ Optimizer (Member 4)
* **Objective**: Compute the optimal thruster burn that clears the collision threat with minimal propellant consumption.
* **Key Steps**:
  1. Formulate cost function: Minimize burn magnitude $\Delta v = \sqrt{\Delta v_x^2 + \Delta v_y^2 + \Delta v_z^2}$.
  2. Define inequality constraint: Post-maneuver miss distance at TCA must exceed safety threshold (e.g., 15 km).
  3. Solve using Sequential Least Squares Programming (SLSQP).
  4. Compute fuel mass expended using spacecraft dry mass, thruster specific impulse ($I_{sp}$), and standard gravity ($g_0$).

### Module E: FastAPI Backend Services (Member 5)
* **Objective**: Provide reliable API endpoints and real-time event streaming for the mission control frontend.
* **Key Steps**:
  1. Expose REST endpoints to retrieve active satellite lists, active conjunction alerts, and maneuver simulations.
  2. Implement WebSocket connections to stream live orbital coordinates and conjunction telemetry.
  3. Structure automated Conjunction Data Message (CDM) exports following standard space data formats.

### Module F: 3D Mission Control Frontend (Member 6)
* **Objective**: Provide satellite operators with an intuitive, photorealistic space situational awareness dashboard.
* **Key Steps**:
  1. Render 3D textured Earth with orbital paths (nominal path, debris trajectory, avoidance trajectory).
  2. Implement interactive threat matrix with color-coded risk badges.
  3. Create an avoidance maneuver simulator panel allowing operators to review fuel costs, miss distance expansion, and authorize burns.

---

## 8. Hackathon Demo & Pitch Deck Strategy

### The 3-Minute Winning Demo Flow:
1. **Hook (0:00 - 0:30)**: Open the 3D Mission Control Dashboard showing thousands of satellites & debris swirling around Earth. Explain the rapid growth of mega-constellations and the threat of Kessler Syndrome.
2. **The Threat Alert (0:30 - 1:15)**: Trigger a live high-risk conjunction alert (e.g., *ISS vs Debris at TCA = 30 mins, Miss Distance = 150 meters, Critical Risk*).
3. **Autonomous Optimization (1:15 - 2:00)**: Click *"Calculate Optimal Maneuver"*. Show the system generating an optimized thruster burn that expands clearance to $18\text{ km}$ while using only a fraction of a kilogram of fuel.
4. **Interactive 3D Simulation (2:00 - 2:40)**: Authorize the burn and watch the green trajectory split safely away from the debris in real-time 3D.
5. **Impact & Summary (2:40 - 3:00)**: Highlight the commercial value: extending satellite lifespan, reducing operator fatigue, and preventing multi-million dollar catastrophic collisions.

---
*SOS Blueprint complete and ready for team execution.*
