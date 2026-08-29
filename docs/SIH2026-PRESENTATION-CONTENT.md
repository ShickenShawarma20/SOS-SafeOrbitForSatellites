# SIH 2026 — Idea Presentation (Filled Content)

> This document contains the **ready-to-paste content for every slide** of the
> SIH2026-IDEA-Presentation-Format.pptx template. Copy each section into the
> corresponding slide. Keep points concise — avoid paragraphs. Use diagrams and
> infographics where noted. Export to PDF before uploading to the portal.

---

## SLIDE 1 — TITLE PAGE

```
SMART INDIA HACKATHON 2026
```

| Field | Value |
|-------|-------|
| **Problem Statement ID** | *(fill from SIH portal)* |
| **Problem Statement Title** | Space Situational Awareness & Autonomous Satellite Collision Avoidance System |
| **Theme** | Space Technology |
| **PS Category** | Software |
| **Team ID** | *(fill from SIH portal)* |
| **Team Name** | *(fill from SIH portal — registered name)* |

**Project Name:** SOS · SafeOrbitForSattelites

**Tagline:** *Autonomous Space Situational Awareness & Collision Avoidance
Flight Director Console*

---

## SLIDE 2 — IDEA TITLE / PROPOSED SOLUTION

### Solution Name
**SOS (Safe Orbit for Satellites)** — an intelligent, full-stack Space
Situational Awareness (SSA) and Autonomous Collision Avoidance System for
safeguarding LEO satellites from hypervelocity debris encounters.

### Detailed Explanation of the Proposed Solution

- **3D Orbital Digital Twin** — a real-time WebGL Earth globe (Three.js) that
  propagates satellite & debris positions using authentic Keplerian orbital
  elements (two-body propagation in the ECI frame). Operators see the *actual*
  orbits, not animations.
- **Conjunction Detection & Assessment** — the backend continuously screens
  the catalogued object set (~21,430 tracked objects), computes Time of
  Closest Approach (TCA), miss distance, and collision probability (Pc) using
  a Foster 2D Gaussian integrator over the B-plane encounter geometry with
  covariance ellipses and Hard-Body-Radius keep-out circles.
- **AI Flight Director (AI Engine)** — reads each conjunction and generates
  a structured flight directive: fuel-optimal burn epoch, ΔV vector, risk
  urgency class, and a telecommand checklist. A deterministic astrodynamics
  fallback engine keeps the system running even if the AI is unavailable.
- **Maneuver Planner & Simulation Lab** — proposes multiple candidate burns
  (prograde/retrograde/radial/cross-track), computes propellant cost via the
  Tsiolkovsky rocket equation, predicts post-burn miss distance & Pc, and
  re-screens the post-burn trajectory for 72 hours to catch secondary
  conjunctions.
- **Autonomous Autopilot Engine** — a closed-loop policy engine that
  auto-executes avoidance burns when Pc exceeds a configurable threshold,
  with a 5-stage execution pipeline (telecommand signing → attitude slew →
  burn → orbit determination → secondary screening).
- **Live SGP4 Tracking** — fetches real TLEs from CelesTrak and propagates ISRO
  satellite positions client-side via satellite.js, with time-scrub controls.
- **CCSDS CDM Exporter** — exports Conjunction Data Messages in XML/JSON/KVN
  (CCSDS 508.0-B-1) for inter-agency coordination.

### How It Addresses the Problem

- **Problem:** 21,000+ tracked debris objects in LEO; collision risk is
  growing (Kessler Syndrome). Current tools are fragmented, manual, and
  slow — operators get warnings but no actionable, physics-backed burn plans.
- **Our Solution:** One console that *detects* the threat, *assesses* the
  risk with real physics, *recommends* an optimal burn using AI, and can
  *execute* it autonomously — reducing response time from hours to minutes.

### Innovation and Uniqueness

- **Real astrodynamics, not mocks** — Keplerian propagation, RK4 integrators,
  golden-section TCA search, and numerical Pc integration (Foster method)
  run live in the browser and backend.
- **AI + deterministic fallback** — the system never goes dark; if the AI Engine is
  rate-limited, a built-in astrodynamics engine produces deterministic
  directives.
- **B-plane encounter visualization** — covariance ellipses and Hard-Body
  Radius keep-out circles rendered on a live canvas, so operators *see* the
  risk geometry.
- **End-to-end autonomy** — from detection to burn execution to
  post-burn verification, all in one console.

---

## SLIDE 3 — TECHNICAL APPROACH

### Technologies Used

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+), Three.js (WebGL 3D globe), Canvas 2D (B-plane, charts) |
| **Backend** | Node.js, Express, TypeScript (tsx), REST API |
| **AI / LLM** | AI Engine (deterministic fallback engine) |
| **Astrodynamics** | satellite.js (SGP4), custom Keplerian/RK4 propagator, Foster Pc integrator |
| **Orbital Data** | CelesTrak TLE/GP API (real NORAD catalog data), CCSDS 508.0-B-1 CDM format |
| **Deployment** | Vercel (serverless), Render (Node host), static CDN |
| **Dev Tools** | Git, npm, esbuild, tsc |

### Methodology & Implementation Process

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    DATA INGESTION LAYER                      │
  │  CelesTrak TLE API  →  SGP4 propagation  →  ECI state vectors │
  └───────────────────────────┬──────────────────────────────────┘
                              │
  ┌───────────────────────────▼──────────────────────────────────┐
  │                  CONJUNCTION SCREENING ENGINE                │
  │  Catalog cross-screen  →  TCA search (golden-section)        │
  │  →  B-plane projection  →  Foster Pc integration             │
  └───────────────────────────┬──────────────────────────────────┘
                              │
  ┌───────────────────────────▼──────────────────────────────────┐
  │                 AI FLIGHT DIRECTOR (AI ENGINE)               │
  │  CDM + elements + fuel  →  burn directive + ΔV + checklist   │
  │  (deterministic fallback if AI unavailable)                 │
  └───────────────────────────┬──────────────────────────────────┘
                              │
  ┌───────────────────────────▼──────────────────────────────────┐
  │              MANEUVER PLANNING & SIMULATION                  │
  │  Candidate burns  →  Tsiolkovsky fuel cost  →  72h re-screen │
  └───────────────────────────┬──────────────────────────────────┘
                              │
  ┌───────────────────────────▼──────────────────────────────────┐
  │            AUTONOMOUS AUTOPILOT EXECUTION                    │
  │  Policy gate  →  5-stage pipeline  →  Post-burn verification │
  └───────────────────────────┬──────────────────────────────────┘
                              │
  ┌───────────────────────────▼──────────────────────────────────┐
  │              3D OPERATIONAL CONSOLE (FRONTEND)               │
  │  Three.js globe  ·  B-plane plot  ·  Telemetry  ·  AI insight│
  └──────────────────────────────────────────────────────────────┘
```

### Key Algorithmic Components

1. **Keplerian → ECI conversion** — 3-1-3 Euler rotation
   (Rz(Ω)·Rx(i)·Rz(ω)) maps orbital elements to 3D Cartesian positions.
2. **TCA search** — golden-section minimization of inter-object range over
   time, seeded by a coarse grid sweep.
3. **Collision probability (Pc)** — Foster 2D method: 1D-reduction Simpson
   quadrature (N=512) of a 2D Gaussian over the combined hard-body disc,
   with covariance orientation.
4. **Tsiolkovsky rocket equation** — Δm = m₀(1 − e^(−ΔV/(Isp·g₀))).
5. **SGP4 propagation** — satellite.js propagates real TLEs for live
   tracking of ISRO fleet.

---

## SLIDE 4 — FEASIBILITY AND VIABILITY

### Feasibility Analysis

- **Technical feasibility: PROVEN** — a working prototype exists with 12
  pages, a live Express/TypeScript backend, a Three.js 3D globe, real SGP4
  tracking from CelesTrak, and an AI Engine integration. All core
  algorithms (Pc, TCA, maneuver planning) are implemented and tested.
- **Data feasibility: SOLVED** — orbital data is freely available from
  CelesTrak's public GP/TLE API (no API key required, 3× daily updates).
  The system includes a bundled TLE snapshot for offline fallback.
- **Deployment feasibility: READY** — the app deploys as a static frontend
  + serverless functions (Vercel) or a Node host (Render). No specialised
  hardware required.
- **Scalability: DESIGNED** — the backend caches TLEs and refreshes every 6
  hours; the Pc computation is O(N²) over the catalog but runs in
  milliseconds per conjunction pair. The architecture supports horizontal
  scaling of the screening engine.

### Potential Challenges and Risks

| Challenge | Risk | Mitigation |
|-----------|------|------------|
| **TLE accuracy degradation** | TLEs have ~1 km positional uncertainty; Pc may drift from reality | Use latest CDM data when available; show covariance ellipses so operators understand uncertainty |
| **AI Engine API rate limits** | AI may be unavailable during peak usage | Deterministic astrodynamics fallback engine guarantees continuous operation |
| **Catalog growth** | 21,000+ objects today, growing ~10% per year | Screening is parallelizable; cache per-pair geometry; prune low-risk pairs by Pc threshold |
| **Real-burn execution safety** | Autonomous burns carry physical risk | 72-hour secondary screening gate; operator sign-off required for non-autonomous mode; DRY RUN simulation mode |
| **Space weather variability** | Solar storms alter drag & orbit prediction | Space weather telemetry (F10.7, Kp, drag multiplier) feeds into covariance growth model |

### Strategies for Overcoming Challenges

- **Dual-mode AI** — the AI Engine for rich reasoning + deterministic fallback for
  guaranteed uptime. The system never goes dark.
- **CCSDS standard compliance** — CDM export in XML/JSON/KVN ensures
  interoperability with existing agency infrastructure (ISRO, NASA CARA,
  ESA).
- **Layered autonomy** — STANDBY (manual) → DRY RUN (simulate only) → ARMED
  (auto-execute), so operators choose their trust level.
- **72-hour forward screening** — every proposed burn is checked against the
  full catalog for 3 days post-burn to prevent creating *new* conjunctions.

---

## SLIDE 5 — IMPACT AND BENEFITS

### Potential Impact on Target Audience

| Audience | Impact |
|----------|--------|
| **Satellite operators (ISRO, NSIL)** | Reduced collision response time from hours to minutes; fewer manual calculations; lower risk of satellite loss |
| **Mission control teams** | A single console replaces fragmented tools; situational awareness at a glance |
| **Space traffic management agencies** | CCSDS-compliant CDM export enables inter-agency coordination |
| **Constellation operators** | Fleet-wide autonomous clearance — one click screens and clears the entire constellation |
| **The orbital environment** | Prevents collisions that create more debris; directly fights Kessler Syndrome |

### Benefits of the Solution

**Social:**
- Protects satellite services that millions depend on — weather forecasting
  (INSAT-3DS), disaster warning, communication, navigation (NavIC),
  earth observation (EOS series).
- Prevents cascading debris generation (Kessler Syndrome) that could render
  LEO unusable for future generations.

**Economic:**
- A single satellite costs ₹200–₹2,000 crore to build and launch; avoiding
  one collision saves the full asset value plus downstream service revenue.
- Reduces operator workload — one console replaces 5+ disparate tools,
  cutting staffing costs.
- Autonomous mode reduces response time, minimizing service disruption
  windows.

**Environmental:**
- Every collision avoided prevents thousands of new debris fragments that
  would persist in orbit for decades.
- Preserves LEO as a sustainable resource for future satellite missions and
  human spaceflight.

**Technological:**
- First Indian SSA console integrating the AI Engine with real
  astrodynamics physics for civilian satellite operations.
- Open, extensible architecture — new object types, constellations, and
  screening algorithms can be added without rearchitecting.
- Live SGP4 tracking from real CelesTrak data — not a simulation.

---

## SLIDE 6 — RESEARCH AND REFERENCES

### Standards & Methodologies

| Reference | Description |
|-----------|-------------|
| **CCSDS 508.0-B-1** | Conjunction Data Message (CDM) standard — the international format for sharing conjunction warnings between agencies |
| **NASA CARA** | Conjunction Assessment Risk Analysis — Pc threshold framework (Critical ≥ 1×10⁻⁴, High ≥ 1×10⁻⁵) |
| **Foster, J. L. (1992)** | "A Parametric Approach to Collision Probability" — the 2D Gaussian integration method for Pc estimation used in our engine |
| **Bate, Mueller & White** | *Fundamentals of Astrodynamics* — Keplerian orbit propagation, two-body problem, Lambert's problem |
| **Vallado, D.** | *Fundamentals of Astrodynamics and Applications* — SGP4/SDP4 propagation, coordinate frame conversions |
| **Tsiolkovsky rocket equation** | Δm = m₀(1 − e^(−ΔV/(Isp·g₀)) — propellant mass calculation for maneuver planning |

### Data Sources

| Source | URL | Use |
|--------|-----|-----|
| **CelesTrak** | https://celestrak.org/NORAD/elements/gp.php | Real TLE/GP orbital data for ISRO fleet (free, no key) |
| **Space-Track** | https://www.space-track.org | Catalogued object data (supplementary) |
| **NOAA SWPC** | https://swpc.noaa.gov | Space weather data (F10.7 solar flux, Kp geomagnetic index) |

### Technology References

| Technology | URL |
|-----------|-----|
| **Three.js** | https://threejs.org (WebGL 3D rendering) |
| **satellite.js** | https://github.com/nasa/satellite.js (SGP4 propagation) |
| **AI Engine** | AI Flight Director (deterministic fallback engine) |
| **Express.js** | https://expressjs.com (REST API backend) |

### Project Links

| Resource | Location |
|----------|----------|
| **Source code** | GitHub repository *(fill repo URL)* |
| **Live demo** | *(fill deployed URL)* |
| **Workflow doc** | `docs/WORKFLOW.md` |
| **Feature guide** | `docs/FEATURES.md` |

---

## PRESENTATION TIPS (from the template's instruction slide)

- Keep maximum **6 slides** (including title slide).
- **Avoid paragraphs** — use points, diagrams, infographics, pictures.
- Keep explanations **precise and easy to understand**.
- The idea should be **unique and novel**.
- Use **only the provided template** without changing the idea-detail
  pointers.
- **Save as PDF** and upload to the portal — no PPT or Word format accepted.
- **Delete the instruction slide** before uploading.

### Suggested Diagrams/Infographics to Add

1. **Slide 2** — Screenshot of the 3D globe with satellite orbits + the
   collision-avoidance demo (5-phase DETECT → BURN → CLEAR flow).
2. **Slide 3** — The architecture flow diagram (above) + a screenshot of the
   B-plane encounter plot with covariance ellipses.
3. **Slide 4** — The 5-stage autopilot execution pipeline diagram.
4. **Slide 5** — Before/after comparison: Pc 2.8×10⁻⁴ (critical, red) →
   2.2×10⁻⁶ (safe, green) after the burn, with the AI Risk Map showing the
   live color transition.
