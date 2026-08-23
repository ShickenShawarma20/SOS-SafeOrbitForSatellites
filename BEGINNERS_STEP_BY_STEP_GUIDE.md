# 🚀 SOS (Safe Orbit for Satellites)
## Complete Beginner-to-Advanced Step-by-Step Implementation Handbook
### A Plain-English, Zero-to-Hero Guide for a 6-Member Team Building an AI-Powered Satellite Collision Avoidance System

---

## 📖 Welcome to Space Engineering & AI!

If you or your team members have never worked with orbital mechanics, 3D graphics, or AI-based trajectory optimization before, **don't worry!** This handbook explains **every single concept from absolute scratch** in simple, clear terms, followed by a detailed step-by-step roadmap for building the system together.

---

## 🧭 Table of Contents
1. [Core Concepts in Plain English](#1-core-concepts-in-plain-english)
   - [What is an Orbit & How do Satellites Move?](#what-is-an-orbit)
   - [What is a TLE (Two-Line Element Set)?](#what-is-a-tle)
   - [What is SGP4 Propagation?](#what-is-sgp4-propagation)
   - [Coordinate Frames: ECI vs. ECEF vs. Lat/Lon/Alt](#coordinate-frames)
   - [Conjunction Assessment (CA), TCA & Miss Distance](#conjunction-assessment)
   - [Collision Probability ($P_c$) & Error Covariance](#collision-probability)
   - [Delta-V ($\Delta v$) & Avoidance Maneuvers](#delta-v--avoidance-maneuvers)
2. [Team Work Distribution: 6-Member Roles & Responsibilities](#2-team-work-distribution)
3. [Step 0: Developer Environment & Tooling Setup](#step-0-environment-setup)
4. [Step 1: Ingesting Real Satellite Data (TLEs)](#step-1-ingesting-tle-data)
5. [Step 2: Propagating Orbits Over Time (SGP4 Physics)](#step-2-orbit-propagation)
6. [Step 3: Fast Conjunction Screening (3D Spatial Indexing)](#step-3-conjunction-screening)
7. [Step 4: Pinpointing TCA & Calculating Collision Probability ($P_c$)](#step-4-tca-and-collision-probability)
8. [Step 5: AI/ML Risk Scoring & Threat Classification](#step-5-ai-ml-risk-scoring)
9. [Step 6: Autonomous Maneuver & $\Delta v$ Optimization](#step-6-autonomous-maneuver-optimization)
10. [Step 7: Backend Architecture & Real-Time Event Streaming](#step-7-backend-architecture)
11. [Step 8: 3D Mission Control Frontend Design](#step-8-3d-mission-control-frontend)
12. [Step 9: Pre-Packaged Demo Scenarios for Judges](#step-9-demo-scenarios)
13. [Step 10: Hackathon Pitch & Presentation Strategy](#step-10-hackathon-pitch-strategy)

---

## 1. Core Concepts in Plain English

### What is an Orbit?
An orbit is not a satellite floating in zero gravity. It is an object in **perpetual free fall** around Earth. 
* A satellite in Low Earth Orbit (LEO, 200 km – 2,000 km altitude) travels at approximately **7.8 kilometers per second (~28,000 km/h)**.
* At this extreme speed, even a **1 cm paint fleck or bolt** has the kinetic energy of an exploding hand grenade.
* If two objects collide, they shatter into thousands of pieces, creating a cascade of uncontrolled collisions known as **Kessler Syndrome**.

---

### What is a TLE?
A **Two-Line Element set (TLE)** is the universal data format created by NORAD and NASA to describe the orbit of an Earth-orbiting object at a specific point in time (the epoch).

A TLE consists of two lines of 69 characters each:
* **NORAD Catalog ID**: A unique identifier for every tracked satellite or piece of debris.
* **Inclination ($i$)**: The tilt angle of the orbital plane relative to Earth's equator ($0^\circ$ is equatorial, $90^\circ$ is polar).
* **Right Ascension of the Ascending Node ($\Omega$)**: The orientation of the orbital ring in 3D space.
* **Eccentricity ($e$)**: How circular or stretched the orbit is ($0$ means a perfect circle, values between $0$ and $1$ are ellipses).
* **Argument of Perigee ($\omega$)**: Where in the orbit the satellite gets closest to Earth.
* **Mean Motion ($n$)**: How many complete revolutions the satellite completes around Earth per day (typically ~15 to 16 orbits/day in LEO).
* **BSTAR Drag Term**: A parameter modeling how upper atmospheric friction slows the satellite down and decays its altitude over time.

---

### What is SGP4 Propagation?
**SGP4 (Simplified General Perturbations 4)** is the industry-standard mathematical physics model that takes a TLE and calculates the exact 3D position $(x, y, z)$ and velocity $(v_x, v_y, v_z)$ of the object at any past or future timestamp.

SGP4 accounts for:
* **Earth Oblateness ($J_2$ effect)**: Earth is not a perfect sphere; its equatorial bulge twists and rotates orbital planes over time.
* **Atmospheric Drag**: Upper atmosphere friction that gradually shrinks orbital radius.
* **Gravitational Perturbations**: The gravitational pulls of the Sun and Moon.

---

### Coordinate Frames: Where is the Satellite?
1. **ECI (Earth-Centered Inertial - TEME / J2000)**:
   * Origin $(0,0,0)$ is at the center of the Earth.
   * Coordinate axes point toward fixed distant stars, not rotating with Earth.
   * **Why we use it**: Satellite orbital equations of motion work naturally in ECI because Earth spins underneath the satellite's path.
2. **ECEF (Earth-Centered, Earth-Fixed)**:
   * Coordinate axes rotate together with the Earth.
   * **Why we use it**: Needed to determine what continent, city, or ground station the satellite is flying over.
3. **Geodetic (Latitude, Longitude, Altitude)**:
   * Traditional map coordinates for ground tracking.

---

### Conjunction Assessment: Close Encounters
* **Conjunction**: An event where two space objects pass dangerously close to each other.
* **TCA (Time of Closest Approach)**: The exact second when the Euclidean distance between the satellite and the debris reaches its absolute minimum.
* **Miss Distance**: The 3D Euclidean distance between the two objects at TCA:
  $$\text{Miss Distance} = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2 + (z_1 - z_2)^2}$$
  * A miss distance $< 5 \text{ km}$ triggers a warning alert.
  * A miss distance $< 1 \text{ km}$ triggers a critical red collision alert.

---

### Collision Probability ($P_c$) & Error Covariance
Because ground-based radars and optical telescopes cannot track space debris with infinite precision, every satellite position has an **uncertainty bubble (a 3D Gaussian Covariance Ellipsoid)**.
* **$P_c$ (Probability of Collision)**: The mathematical likelihood that the two positional error clouds overlap at TCA.
* If $P_c > 1 \times 10^{-4}$ (a 1-in-10,000 chance or 0.01%), space agencies (NASA, ESA) mandate an **avoidance maneuver**.

---

### Delta-V ($\Delta v$) & Avoidance Maneuvers
**Delta-V ($\Delta v$)** represents the velocity change (measured in meters per second, m/s) produced by firing the satellite's chemical or electric thrusters.
* **Prograde Burn (+V)**: Firing thrusters forward in the direction of motion. This raises the satellite's altitude on the opposite side of the orbit.
* **Retrograde Burn (-V)**: Firing thrusters backward against motion. This lowers the satellite's altitude.
* **Out-of-Plane Burn (Cross-Track / Normal)**: Tilts orbital inclination to move laterally away from debris.
* **Fuel Cost (Tsiolkovsky Rocket Equation)**:
  $$\Delta m = m_{\text{total}} \cdot \left(1 - e^{-\frac{\Delta v}{I_{sp} \cdot g_0}}\right)$$
  *(Where $I_{sp}$ is the thruster specific impulse and $g_0 \approx 9.80665 \text{ m/s}^2$).*

---

## 2. Team Work Distribution

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    6-MEMBER TASK ALLOCATION WORKFLOW                       │
└────────────────────────────────────────────────────────────────────────────┘

 [Member 1: Data & SGP4] ──────> Generates 3D Coordinates over time (x,y,z)
              │
              ▼
 [Member 2: Conjunction Engine] ─> Finds Closest Encounters (TCA, Miss Dist)
              │
              ▼
 [Member 3: AI & Risk Scorer] ──> Calculates Collision Probability & Risk Rank
              │
              ▼
 [Member 4: Delta-V Optimizer] ─> Calculates Minimum Fuel Thruster Burn
              │
              ▼
 [Member 5: FastAPI Backend] ───> Packs everything into REST & WebSocket APIs
              │
              ▼
 [Member 6: 3D Mission Control] ─> Renders 3D Globe, Trajectories & Alerts UI
```

---

## Step 0: Developer Environment & Tooling Setup

### Backend Environment Requirements
* Python 3.10 or higher.
* Orbital & Math Libraries: `skyfield`, `sgp4`, `numpy`, `scipy`.
* Machine Learning: `scikit-learn`, `xgboost`.
* API Framework: `fastapi`, `uvicorn`, `pydantic`, `websockets`.

### Frontend Environment Requirements
* Node.js (v18+) and npm.
* Framework: React with Vite.
* Visualization & Icons: `Three.js` (or `CesiumJS`), `lucide-react`.

---

## Step 1: Ingesting Real Satellite Data (TLEs)

### What to Ingest:
1. **Active Satellites**: High-value assets like the International Space Station (ISS), Earth observation spacecraft, and communication constellations (e.g., Starlink, OneWeb).
2. **Space Debris**: High-density debris clouds such as fragments from the Cosmos 1408 or Fengyun-1C breakups.
3. **Data Source**: CelesTrak public ephemeris endpoints (accessible freely via standard HTTP requests).

### Parsing Process:
* Read incoming 3-line blocks: Object Name, TLE Line 1, TLE Line 2.
* Validate line checksums and extract metadata (NORAD Catalog Number, Epoch timestamp, Object Type).
* Store parsed records in an in-memory dictionary or lightweight database for instant access.

---

## Step 2: Propagating Orbits Over Time (SGP4 Physics)

### Propagation Workflow:
1. Initialize the SGP4 satellite model using the two TLE lines and a high-precision timescale.
2. Define a future time simulation window (e.g., propagating from current time $t_0$ forward 24 to 72 hours in 1-minute steps).
3. Compute the Geocentric Cartesian coordinates $(x, y, z)$ in kilometers and velocity components $(v_x, v_y, v_z)$ in km/s.
4. Calculate derived orbital parameters at each step:
   * Orbital Radius: $r = \sqrt{x^2 + y^2 + z^2}$
   * Orbital Altitude: $h = r - 6378.137\text{ km}$ (Earth equatorial radius)
   * Orbital Speed: $v = \sqrt{v_x^2 + v_y^2 + v_z^2}$

---

## Step 3: Fast Conjunction Screening (3D Spatial Indexing)

### Why Brute-Force Comparisons Fail:
Evaluating 1,000 satellites against 10,000 debris objects over 1,440 time steps requires over **14 billion** distance calculations per run.

### The Two-Phase Spatial Screening Solution:
1. **Broad-Phase Screening (Spatial Indexing)**:
   * At each time step, feed all debris 3D coordinates into a **3D KD-Tree** (or Octree).
   * Query the KD-Tree with satellite positions using a radial search radius (e.g., 50 km).
   * This reduces computational complexity from $O(N \cdot M)$ to $O(N \log M)$, executing thousands of proximity checks in under 50 milliseconds.
2. **Narrow-Phase Screening (Trajectory Geometry)**:
   * For pairs flagged during broad phase, extract the relative trajectory segment.
   * Calculate the relative position vector $\Delta \vec{r} = \vec{r}_{\text{sat}} - \vec{r}_{\text{deb}}$ and relative velocity vector $\Delta \vec{v} = \vec{v}_{\text{sat}} - \vec{v}_{\text{deb}}$.

---

## Step 4: Pinpointing TCA & Calculating Collision Probability ($P_c$)

### Finding Time of Closest Approach (TCA):
* The exact minimum distance occurs when the relative position vector is perpendicular to the relative velocity vector:
  $$\Delta \vec{r}(t) \cdot \Delta \vec{v}(t) = 0$$
* Use numerical root-finding (such as Newton's method or Golden Section Search) to pinpoint the exact second of closest approach and the minimum miss distance.

### Computing Collision Probability ($P_c$):
* Project the 3D error covariance matrices of both objects onto the 2D encounter plane (the B-plane perpendicular to relative velocity).
* Combine positional standard deviations ($\sigma_x, \sigma_y$).
* Define the combined **Hard Body Radius (HBR)** representing the physical size of both spacecraft.
* Integrate the 2D Gaussian probability density over the collision cross-sectional disk to obtain $P_c$.

---

## Step 5: AI/ML Risk Scoring & Threat Classification

### Multi-Factor Threat Modeling:
The AI risk engine evaluates conjunction events across four key dimensions:
1. **Proximity Severity**: Miss distance evaluated on an inverse exponential scale (critical if $< 1 \text{ km}$).
2. **Probability Severity**: Collision probability evaluated against the standard $10^{-4}$ threshold.
3. **Urgency Severity**: Time remaining until TCA (encounters within $<6 \text{ hours}$ receive highest operational priority).
4. **Kinetic Severity**: Relative impact velocity squared ($v_{\text{rel}}^2$), measuring the destructive potential of an impact.

### Threat Categorization:
* **CRITICAL (Score 70–100)**: Immediate avoidance maneuver calculation and execution required.
* **WARNING (Score 40–69)**: Prepare maneuver strategy and schedule high-cadence tracking updates.
* **LOW RISK (Score 0–39)**: Routine automated tracking and monitoring.

---

## Step 6: Autonomous Maneuver & $\Delta v$ Optimization

### Mathematical Formulation:
* **Goal**: Find the 3D velocity change vector $\Delta \vec{v} = (\Delta v_x, \Delta v_y, \Delta v_z)$ that pushes the satellite outside the danger zone while burning the least possible propellant.
* **Cost Function to Minimize**:
  $$J(\Delta \vec{v}) = \|\Delta \vec{v}\| = \sqrt{\Delta v_x^2 + \Delta v_y^2 + \Delta v_z^2}$$
* **Constraint**:
  $$\text{Miss Distance at TCA}(\Delta \vec{v}) \ge \text{Safety Margin (e.g., 15 km)}$$

### Optimization Method:
* Solve the constrained optimization problem using **Sequential Least Squares Programming (SLSQP)**.
* Evaluate both **Prograde** (raising orbit) and **Retrograde** (lowering orbit) strategies.
* Calculate the exact fuel consumption in kilograms using the Tsiolkovsky equation.
* Compute post-maneuver orbit restoration parameters to return the satellite to its nominal slot once the debris has passed.

---

## Step 7: Backend Architecture & Real-Time Event Streaming

### API Service Structure:
* **Data Management**: Background ingestion worker refreshing TLE sets and maintaining ephemeris caches.
* **REST Endpoints**:
  * Satellite catalog retrieval.
  * Conjunction risk matrix and threat list.
  * On-demand maneuver simulation and optimization.
  * Conjunction Data Message (CDM) standard exports.
* **WebSocket Feeds**: Real-time push of updated 3D coordinates, dynamic distance readouts, and automated alert dispatches.

---

## Step 8: 3D Mission Control Frontend Design

### Key Dashboard Modules:
1. **Photorealistic 3D Globe**:
   * Interactive Earth with orbital rings for tracked satellites.
   * Color-coded trajectory trails (Blue for nominal satellite path, Red for debris path, Green for proposed avoidance trajectory).
   * Glowing proximity hazard spheres at predicted conjunction encounter points.
2. **Threat Matrix & Alert Feed**:
   * Live filterable table of conjunctions ranked by AI risk score.
   * Countdown timers showing time remaining until TCA.
3. **Maneuver Command Center**:
   * Strategy comparison cards (e.g., Minimum Fuel vs. Maximum Clearance vs. Rapid Orbit Return).
   * Interactive sliders to preview burn vectors and simulated trajectory alterations.
   * Action button for operators to authorize thruster execution.

---

## Step 9: Pre-Packaged Demo Scenarios for Judges

Judges value realistic, high-impact simulations. Prepare 3 switchable demonstration presets:

1. **Scenario 1: High-Stakes Manned Spacecraft Encounter**
   * *Target*: International Space Station (ISS) vs. High-Velocity ASAT Debris Fragment.
   * *TCA*: 35 minutes.
   * *Initial Miss Distance*: 180 meters.
   * *Threat Level*: CRITICAL ($P_c > 85\%$).
   * *Demonstration*: Immediate prograde burn calculation expanding clearance to $18.5\text{ km}$ using $<0.5\text{ kg}$ propellant.

2. **Scenario 2: Commercial Megaconstellation Close Approach**
   * *Target*: Starlink Satellite vs. Defunct Rocket Upper Stage.
   * *TCA*: 3 hours.
   * *Initial Miss Distance*: 620 meters.
   * *Threat Level*: WARNING ($P_c \approx 12\%$).
   * *Demonstration*: Autonomous multi-strategy evaluation comparing cross-track vs. prograde burns.

3. **Scenario 3: Earth Observation Satellite Avoidance & Recovery**
   * *Target*: Sun-Synchronous Earth Observation Spacecraft.
   * *Demonstration*: Two-burn sequence: initial avoidance burn followed by an orbital restoration burn 12 hours later to resume imaging operations.

---

## Step 10: Hackathon Pitch & Presentation Strategy

### Pitch Breakdown (3 Minutes Total):
1. **0:00 – 0:30 (The Hook & Space Crisis)**:
   * Show the 3D globe swarming with satellites and debris.
   * Explain the exponential growth of orbital debris and the risk of Kessler Syndrome.
2. **0:30 – 1:15 (The Problem & Live Conjunction Alert)**:
   * Trigger the critical demo alert showing an imminent 180-meter close approach.
   * Explain why manual operator response is too slow for thousands of daily warnings.
3. **1:15 – 2:00 (The Solution: AI Risk & Autonomous Optimization)**:
   * Click *"Calculate Optimal Maneuver"*.
   * Highlight the AI risk score and the fuel-minimized $\Delta v$ solution.
4. **2:00 – 2:40 (3D Trajectory Execution)**:
   * Execute the burn in the 3D visualizer; show the green trajectory branching safely away from the debris in real time.
5. **2:40 – 3:00 (Business & Mission Impact)**:
   * Summarize how SOS preserves satellite lifespan, reduces operational overhead, and safeguards the future of orbital space.

---
*Follow this handbook step-by-step to build and present a winning hackathon project!*
