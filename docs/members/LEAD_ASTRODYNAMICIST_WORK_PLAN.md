# 🛰️ Lead Astrodynamicist & Mathematical Architect
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: Orbital Mechanics, Celestial Coordinate Transformations & Mathematical Formulations.
* **Assigned Files**:
  - `server/src/services/kepler.ts` (Keplerian propagation, RK4, TCA, B-plane)
  - `server/src/types.ts` (Core astrodynamics interfaces)
* **Goal**: Provide the core mathematical algorithms that convert orbital parameters into 3D space vectors, compute B-Plane collision coordinates, and calculate precise miss distances.

---

### 📚 Concepts to Master
1. **Keplerian Orbital Elements**: Semi-major axis ($a$), Eccentricity ($e$), Inclination ($i$), RAAN ($\Omega$), Argument of Perigee ($\omega$), True Anomaly ($\nu$).
2. **Coordinate Transformation**: Converting perifocal vectors ($\vec{r}_{pqw}$) to Earth-Centered Inertial (ECI) coordinates using 3-1-3 Euler rotation matrices.
3. **B-Plane Collision Geometry**: Calculating axes $\vec{\xi}, \vec{\zeta}$ perpendicular to the relative velocity vector $\vec{v}_{\text{rel}}$.
4. **Gaussian Error Covariance**: Transforming $3\sigma$ positional uncertainty matrices into the encounter plane.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: Mathematical Foundations & Types (Hours 0 - 6)
- [ ] Define the TypeScript types for `OrbitalElements`, `Vector3D`, `ECICoordinates`, `BPlaneParameters`, and `CovarianceMatrix` in `server/src/types.ts`.
- [ ] Implement the Keplerian-to-Cartesian conversion function:
  - Calculate orbital radius $r$ from semi-major axis, eccentricity, and true anomaly.
  - Form the position vector in the perifocal plane.
  - Apply the Euler rotation matrix using inclination, RAAN, and argument of perigee to produce Cartesian $(x, y, z)$ in ECI space.

#### Phase 2: Orbit Path Sampling & Interpolation (Hours 6 - 12)
- [ ] Implement an orbit path generator that steps the true anomaly from $0^\circ$ to $360^\circ$ in increments of $2^\circ$ to produce 180 coordinate points for smooth 3D orbit rendering.
- [ ] Implement satellite velocity vector calculation:
  - Compute velocity components in the perifocal frame.
  - Rotate velocity components to the ECI frame to yield $(v_x, v_y, v_z)$ in km/s.

#### Phase 3: B-Plane Encounter Formulations (Hours 12 - 18)
- [ ] Implement relative state vector calculations ($\Delta \vec{r} = \vec{r}_{\text{sat}} - \vec{r}_{\text{debris}}$ and $\vec{v}_{\text{rel}} = \vec{v}_{\text{sat}} - \vec{v}_{\text{debris}}$).
- [ ] Implement the B-plane coordinate frame basis vectors:
  - Unit vector $\vec{k}$ along relative velocity.
  - Unit vector $\vec{h}$ along angular momentum.
  - Axis $\vec{\xi}$ (cross-track) and axis $\vec{\zeta}$ (radial).
- [ ] Project the miss distance vector $\vec{B}$ onto the encounter plane to obtain $B_\xi$ and $B_\zeta$.

#### Phase 4: Error Ellipses & Collision Probability Logic (Hours 18 - 26)
- [ ] Implement combined covariance projection onto the B-plane.
- [ ] Formulate the analytical collision probability integral ($P_c$) over the combined Hard Body Radius ($R_{\text{HBR}}$).
- [ ] Provide utility functions to scale covariance dispersion based on space weather atmospheric drag multipliers.

#### Phase 5: Testing & Integration with Teammates (Hours 26 - 36)
- [ ] Validate mathematical outputs against known test cases (e.g., circular LEO orbits at 500 km altitude).
- [ ] Hand over clean, typed math helper functions to **3D Graphics & WebGL Engineer** (3D Visualizer) and **Maneuver Optimization Lead** (Maneuver Lab).

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**: None (You build the foundational math layer).
* **Outputs to Provide**:
  - To **3D Graphics & WebGL Engineer**: Orbit path coordinate arrays for 3D trajectory rendering.
  - To **Maneuver Optimization Lead**: B-Plane coordinates, miss distance calculations, and covariance formulas.
  - To **AI Flight Director & Prompt Engineer**: State vectors and collision parameters for AI prompt generation.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Explain to technical judges how the system performs two-body Keplerian propagation into ECI coordinates and how the B-plane transformation accurately predicts close-encounter geometry.
