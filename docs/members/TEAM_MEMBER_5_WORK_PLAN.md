# 🛰️ Team Member 5: Fleet Telemetry, Space Weather & Standards Specialist
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: Constellation Health Telemetry, Space Weather Integration, Standard CCSDS CDM Formats & Mock Orbital Datasets.
* **Assigned Files**:
  - `src/components/SatelliteFleetManager.tsx`
  - `src/components/SpaceWeatherBar.tsx`
  - `src/components/CdmExporterModal.tsx`
  - `src/data/mockOrbitalData.ts`
* **Goal**: Manage fleet-level propellant budgets, provide real-time solar/geomagnetic atmospheric drag feeds, build realistic orbital mock datasets, and export compliant CCSDS Conjunction Data Messages.

---

### 📚 Concepts to Master
1. **Satellite Constellation Management**: Tracking wet mass, dry mass, remaining propellant reserve, cumulative $\Delta V$ budget, and solar power status.
2. **Space Weather Astrodynamics**: Solar Radio Flux ($F_{10.7}$) and geomagnetic storm index ($K_p$), which heat Earth's upper thermosphere and increase atmospheric drag on satellites.
3. **CCSDS 508.0-B-1 Conjunction Data Message (CDM)**: The international standard format (used by NASA, ESA, and USSPACECOM) for exchanging conjunction assessment data in JSON and XML.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: Mock Datasets & Scenario Design (Hours 0 - 8)
- [ ] Build `src/data/mockOrbitalData.ts`:
  - **Active Satellite Fleet**: Create 3 active satellites (e.g., `SOS-1 [LEO 550km]`, `SOS-2 [Sun-Sync 700km]`, `SENTINEL-X [LEO 600km]`) with realistic Keplerian orbital elements, mass (500 kg), propellant reserve (50 kg), and $I_{sp}$ (220 s).
  - **Space Debris Catalog**: Create 5 realistic debris objects (Cosmos 1408 ASAT debris, Fengyun-1C fragment, defunct rocket upper stage, SL-16 booster).
  - **Conjunction Events**: Create 3 critical conjunction events with varying miss distances (142m, 420m, 1.8km), collision probabilities, and B-plane parameters.

#### Phase 2: Fleet Manager & Propellant Budget (Hours 8 - 16)
- [ ] Build `SatelliteFleetManager.tsx`:
  - Card/Grid view of all satellites in the fleet.
  - Telemetry readouts: Propellant mass remaining ($\text{kg}$), percentage of fuel remaining with color-coded progress bars, cumulative Delta-V spent, thruster status, and operational health.
  - Active satellite selector to switch the focus of the entire mission control console.

#### Phase 3: Space Weather Telemetry Bar (Hours 16 - 22)
- [ ] Build `SpaceWeatherBar.tsx`:
  - Display Solar Radio Flux ($F_{10.7}$) in solar flux units (e.g., $185\text{ sfu}$).
  - Display Planetary Geomagnetic Storm Index ($K_p$, e.g., $4.8\text{ Minor Storm}$).
  - Display the calculated **Atmospheric Drag Density Multiplier** ($\times 1.65$).
  - Add interactive slider / toggle allowing operators to simulate a solar storm and watch orbital positional covariance error ellipses expand!

#### Phase 4: CCSDS Conjunction Data Message (CDM) Exporter (Hours 22 - 28)
- [ ] Build `CdmExporterModal.tsx`:
  - Implement standard CCSDS 508.0-B-1 formatter:
    - Object identification (NORAD IDs, object names, catalog status).
    - TCA epoch timestamp in UTC ISO format.
    - 3D Cartesian state vectors in ECI (TEME/J2000).
    - Covariance matrix and miss distance parameters.
  - Provide both **JSON** and **XML** tabs with syntax highlighting and one-click "Copy to Clipboard" and "Download CDM File" buttons.

#### Phase 5: Integration & Data Flow (Hours 28 - 36)
- [ ] Ensure that when **Member 4** executes a maneuver, the propellant consumed is deducted from the active satellite's fuel reserve in real time.
- [ ] Ensure space weather drag multipliers scale the error ellipses in **Member 4**'s B-plane plot and **Member 3**'s AI risk score.

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**:
  - From **Member 1**: Orbital element schemas and coordinate formats.
  - From **Member 4**: Fuel mass consumed ($\Delta m$) from authorized avoidance burns.
* **Outputs to Provide**:
  - To **Member 2, 3, 4, 6**: The master `mockOrbitalData.ts` containing all satellites, debris, and active conjunctions.
  - To **Member 4**: Space weather drag multipliers for covariance scaling.
  - To **Member 6**: The completed `SatelliteFleetManager.tsx`, `SpaceWeatherBar.tsx`, and `CdmExporterModal.tsx` components.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Show how the system incorporates real-time Space Weather ($F_{10.7}, K_p$) to adjust collision uncertainty, and show how the system instantly exports international-standard CCSDS Conjunction Data Messages for NASA/ESA inter-agency coordination.
