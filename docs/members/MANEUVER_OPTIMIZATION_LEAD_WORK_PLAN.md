# 🛰️ Astrodynamics Lab & Maneuver Optimization Lead
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: Collision Avoidance Maneuver Design, Multi-Axis $\Delta V$ Optimization & B-Plane Encounter Lab.
* **Assigned Files**:
  - `public/maneuvers.html` (Maneuver planner page)
  - `public/js/approach.js` (B-Plane encounter geometry canvas)
  - `server/src/services/maneuver.ts` (Maneuver computation, CW equations)
* **Goal**: Build the interactive Maneuver Simulation Lab and the 2D B-Plane encounter visualizer where operators can test multi-axis thruster burns, optimize fuel consumption, and verify collision clearance.

---

### 📚 Concepts to Master
1. **3-Axis Burn Mechanics**:
   - **Prograde / Retrograde ($\Delta V_t$)**: Tangential burn modifying orbital energy and semi-major axis.
   - **Radial In / Radial Out ($\Delta V_r$)**: Modifying eccentricity and rotating the line of apsides.
   - **Normal / Anti-Normal ($\Delta V_n$)**: Cross-track burn tilting inclination and shifting the orbital plane.
2. **Tsiolkovsky Propellant Equation**: Calculating exact fuel mass $\Delta m = m_0(1 - e^{-\Delta V / (I_{sp} g_0)})$.
3. **B-Plane Collision Geometry**: Visualizing the $(\xi, \zeta)$ encounter plane with $1\sigma, 2\sigma, 3\sigma$ dispersion ellipses against the Hard Body Radius.
4. **Secondary Conjunction Screening**: Simulating 72-hour forward orbits to ensure the avoidance maneuver does not create a new collision hazard.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: Maneuver Lab Controls & State (Hours 0 - 8)
- [ ] Build the interactive 3-axis burn control panel in `ManeuverSimulationLab.tsx`:
  - Prograde/Retrograde slider ($\pm 10\text{ m/s}$).
  - Radial In/Out slider ($\pm 10\text{ m/s}$).
  - Normal/Anti-Normal slider ($\pm 10\text{ m/s}$).
- [ ] Implement real-time metrics calculation:
  - Total Delta-V magnitude: $\|\Delta V\| = \sqrt{\Delta V_t^2 + \Delta V_r^2 + \Delta V_n^2}$.
  - Fuel consumed in kilograms based on satellite mass and thruster $I_{sp}$.
  - Change in orbital period ($\Delta T$, seconds).

#### Phase 2: Post-Burn Trajectory & Miss Distance Calculation (Hours 8 - 16)
- [ ] Implement the post-maneuver state vector update:
  - Add $\Delta \vec{V}$ to the satellite's velocity vector at the chosen burn epoch.
  - Compute the new modified orbital elements (new semi-major axis, eccentricity, inclination).
  - Calculate the new projected miss distance at the time of closest approach (TCA).
- [ ] Connect with **3D Graphics & WebGL Engineer** so moving the $\Delta V$ sliders updates the green diverted trajectory line on the 3D globe in real time!

#### Phase 3: Auto-Solve Minimum Fuel Optimizer (Hours 16 - 22)
- [ ] Implement the "Auto-Solve Optimal Burn" feature:
  - Given a desired safety clearance (e.g., $15\text{ km}$), calculate the minimal $\Delta V$ burn vector that meets or exceeds this clearance.
  - Prioritize prograde burns (which require the lowest $\Delta V$ per kilometer of separation) over cross-track burns.
  - Display before vs. after clearance comparison badges.

#### Phase 4: 2D B-Plane Encounter Plot & Error Ellipses (Hours 22 - 28)
- [ ] Build `BPlaneCollisionPlot.tsx` using SVG or Canvas:
  - Draw the cross-track ($\xi$) and radial ($\zeta$) coordinate axes centered at the primary satellite.
  - Draw the circular Hard Body Radius (HBR) danger zone.
  - Draw the debris positional uncertainty ellipses ($1\sigma, 2\sigma, 3\sigma$).
  - Draw the impact vector $\vec{B}$ showing initial collision point vs. post-maneuver safe point.

#### Phase 5: 72-Hour Forward Screening & Polish (Hours 28 - 36)
- [ ] Build a secondary conjunction risk chart showing distance-to-nearest-objects over the next 72 hours after the burn.
- [ ] Add an "Execute & Authorize Maneuver" action button that triggers the satellite telemetry update in the **Fleet Telemetry Specialist**'s Fleet Manager.

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**:
  - From **Lead Astrodynamicist**: Orbital perturbation math and B-plane transformation equations.
  - From **AI Flight Director & Prompt Engineer**: AI-recommended $\Delta V$ burn values.
  - From **Fleet Telemetry & Standards Specialist**: Satellite mass ($m_0$) and thruster specific impulse ($I_{sp}$).
* **Outputs to Provide**:
  - To **3D Graphics & WebGL Engineer**: New post-burn orbital elements to render the green diverted orbit on the 3D globe.
  - To **Operations Console UI Lead**: The completed `ManeuverSimulationLab.tsx` and `BPlaneCollisionPlot.tsx` components.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Demonstrate the maneuver lab live—adjust the $\Delta V$ sliders to show how a small $2\text{ m/s}$ burn saves the spacecraft while burning less than 400 grams of fuel, and verify safety on the B-plane plot.
