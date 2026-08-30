# 🛰️ Team Member 2: 3D Graphics & WebGL Engineer
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: 3D Digital Twin, WebGL Rendering, Orbit Trajectory Shaders & Camera Rig.
* **Assigned Files**:
  - `public/js/orbital.js` (Three.js 3D Earth globe + Keplerian visualization)
  - `public/js/sim-core.js` (Client-side astrodynamics)
* **Goal**: Build the photorealistic, interactive 3D Earth digital twin showing real-time satellite positions, glowing orbital tracks, close-encounter hazard markers, and post-maneuver trajectory branching.

---

### 📚 Concepts to Master
1. **Three.js Scene Graph**: Scene, Perspective Camera, WebGLRenderer, Ambient / Directional Lighting.
2. **Earth Geometry & Scaling**: Building the Earth sphere scaled to $6,378\text{ km}$ basis, applying surface textures, bump maps, and atmospheric glow shaders.
3. **Orbital Line Rendering**: Using `THREE.BufferGeometry` and `LineBasicMaterial` to render smooth continuous 3D orbital rings.
4. **Interactive Controls**: `OrbitControls` for smooth panning, zooming, rotating, and tracking focused satellites.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: 3D Canvas & Earth Sphere Setup (Hours 0 - 6)
- [ ] Initialize Three.js canvas within a responsive React component container.
- [ ] Create the Earth mesh (Sphere geometry with realistic radius scaling).
- [ ] Add high-resolution Earth day texture, specular map (ocean reflection), and atmospheric rim-lighting shader.
- [ ] Add a subtle celestial starfield background cube/particle field.

#### Phase 2: Orbit Ring & Trajectory Line Rendering (Hours 6 - 14)
- [ ] Implement nominal satellite orbit rendering (Cyan glowing line) using coordinate arrays from **Member 1**.
- [ ] Implement secondary debris orbit rendering (Red pulsating line).
- [ ] Implement post-maneuver diverted trajectory rendering (Neon Green glowing line) that appears when a maneuver is simulated.
- [ ] Ensure lines re-render smoothly whenever orbital parameters change.

#### Phase 3: Satellite 3D Models & Orientation (Hours 14 - 20)
- [ ] Construct a 3D satellite mesh (main spacecraft bus, dual solar panel arrays, communication antenna).
- [ ] Position the satellite dynamically at its current true anomaly on the orbit.
- [ ] Orient the satellite's velocity vector along the tangent of the orbital curve.
- [ ] Render secondary debris objects as jagged red polygonal meshes or pulsating threat spheres.

#### Phase 4: Encounter Hazard Points & Camera Modes (Hours 20 - 28)
- [ ] Add a flashing conjunction hazard beacon at the point of closest approach (TCA).
- [ ] Implement camera presets:
  - **Global Earth View**: Wide orbital perspective.
  - **Satellite Chase Cam**: Smoothly follow the active satellite along its trajectory.
  - **Encounter View**: Close-up zoom focusing on the gap between satellite and debris.
- [ ] Add responsive canvas resizing for different screen resolutions.

#### Phase 5: UI Overlay & Visual Polish (Hours 28 - 36)
- [ ] Add onscreen 3D telemetry HUD overlays (Current Altitude, Speed, Latitude/Longitude).
- [ ] Add smooth orbit transitions when the operator selects different satellites in the fleet.
- [ ] Coordinate with **Member 6** to integrate the 3D canvas seamlessly into the main console dashboard.

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**:
  - From **Member 1**: 3D coordinate points $(x, y, z)$ for nominal, debris, and diverted orbits.
  - From **Member 4**: New orbital coordinates after a simulated $\Delta V$ burn.
  - From **Member 6**: Current selected satellite and conjunction event from the dashboard.
* **Outputs to Provide**:
  - To **Member 6**: The interactive 3D WebGL viewport embedded inside `App.tsx`.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Control the live 3D camera during the presentation—zoom in on the debris cloud, demonstrate the flashing encounter point, and trigger the green post-maneuver trajectory branch when the burn is authorized.
