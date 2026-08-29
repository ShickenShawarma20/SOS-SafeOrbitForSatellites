# SIH 2026 — Idea Presentation (Filled Content)

> Ready-to-paste content for every slide of the SIH2026-IDEA-Presentation-Format.pptx template. Keep points short. Use diagrams where noted. Export to PDF before uploading.

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
| **Team Name** | *(fill from SIH portal)* |

**Project:** SOS · SafeOrbitForSattelites
**Tagline:** *Autonomous SSA & Collision Avoidance Flight Director Console*

---

## SLIDE 2 — IDEA TITLE / PROPOSED SOLUTION

### Solution Name
**SOS (Safe Orbit for Satellites)** — full-stack SSA & autonomous collision avoidance for LEO satellites.

### Key Features
- **3D Orbital Digital Twin** — WebGL Earth globe (Three.js) with real Keplerian propagation (ECI frame). Operators see actual orbits, not animations.
- **Conjunction Detection** — screens ~21,430 tracked objects; computes TCA, miss distance & collision probability (Pc) via Foster 2D Gaussian integrator over B-plane geometry.
- **AI Flight Director** — generates burn epoch, ΔV vector, risk class & telecommand checklist; deterministic astrodynamics fallback if AI is down.
- **Maneuver Planner & Simulation Lab** — candidate burns (prograde/retrograde/radial/cross-track), propellant cost via Tsiolkovsky equation, 72h post-burn re-screen.
- **Autonomous Autopilot** — closed-loop auto-burn when Pc exceeds threshold; 5-stage pipeline (sign → slew → burn → orbit det. → re-screen).
- **Live SGP4 Tracking** — real TLEs from CelesTrak, ISRO fleet tracking via satellite.js.
- **CCSDS CDM Exporter** — XML/JSON/KVN (CCSDS 508.0-B-1) for inter-agency coordination.

### How It Addresses the Problem
- **Problem:** 21,000+ debris objects in LEO; Kessler risk rising. Tools are fragmented & manual — warnings without burn plans.
- **Solution:** One console that **detects → assesses (real physics) → recommends burn (AI) → executes** autonomously. Response time: hours → minutes.

### Innovation
- **Real astrodynamics** — Keplerian propagation, RK4, golden-section TCA, Foster Pc (live in browser).
- **AI + deterministic fallback** — system never goes dark.
- **B-plane visualization** — covariance ellipses & Hard-Body keep-out circles on live canvas.
- **End-to-end autonomy** — detection to execution to verification, one console.

---

## SLIDE 3 — TECHNICAL APPROACH

### Technologies Used

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+), Three.js, Canvas 2D |
| **Backend** | Node.js, Express, TypeScript, REST API |
| **AI / LLM** | AI Engine + deterministic fallback |
| **Astrodynamics** | satellite.js (SGP4), custom Keplerian/RK4, Foster Pc |
| **Orbital Data** | CelesTrak TLE/GP API, CCSDS 508.0-B-1 CDM |
| **Deployment** | Vercel (serverless), Render, static CDN |
| **Dev Tools** | Git, npm, esbuild, tsc |

### Methodology Pipeline
```
DATA INGESTION (CelesTrak TLE → SGP4 → ECI vectors)
        ↓
CONJUNCTION SCREENING (TCA search → B-plane → Foster Pc)
        ↓
AI FLIGHT DIRECTOR (CDM + fuel → burn directive + ΔV + checklist)
        ↓
MANEUVER PLANNING (candidate burns → Tsiolkovsky cost → 72h re-screen)
        ↓
AUTONOMOUS AUTOPILOT (policy gate → 5-stage pipeline → verification)
        ↓
3D OPERATIONAL CONSOLE (globe · B-plane · telemetry · AI insight)
```

### Key Algorithms
1. **Keplerian → ECI** — 3-1-3 Euler rotation: Rz(Ω)·Rx(i)·Rz(ω).
2. **TCA search** — golden-section minimization of inter-object range.
3. **Pc (Foster 2D)** — Simpson quadrature (N=512) over combined hard-body disc.
4. **Tsiolkovsky** — Δm = m₀(1 − e^(−ΔV/(Isp·g₀)).
5. **SGP4** — satellite.js propagates real TLEs for ISRO fleet.

---

## SLIDE 4 — FEASIBILITY AND VIABILITY

### Feasibility
- **Technical: PROVEN** — working prototype (12 pages, Express/TS backend, Three.js globe, live SGP4, AI Engine). All core algorithms implemented & tested.
- **Data: SOLVED** — free CelesTrak GP/TLE API (no key, 3× daily updates) + bundled offline snapshot.
- **Deployment: READY** — static frontend + serverless functions. No special hardware.
- **Scalability: DESIGNED** — TLE cache (6h refresh); Pc is O(N²) but ms per pair; horizontal scaling supported.

### Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| TLE accuracy (~1 km uncertainty) | Use latest CDM; show covariance ellipses |
| AI API rate limits | Deterministic astrodynamics fallback guarantees uptime |
| Catalog growth (~10%/yr) | Parallel screening; per-pair cache; Pc threshold pruning |
| Real-burn safety | 72h re-screen gate; operator sign-off; DRY RUN mode |
| Space weather (drag) | F10.7/Kp/drag multiplier feed covariance model |

### Strategies
- **Dual-mode AI** — rich reasoning + deterministic fallback. Never goes dark.
- **CCSDS compliance** — interoperable with ISRO, NASA CARA, ESA.
- **Layered autonomy** — STANDBY → DRY RUN → ARMED (operator chooses trust level).
- **72h forward screening** — prevents burns from creating new conjunctions.

---

## SLIDE 5 — IMPACT AND BENEFITS

### Impact on Audience

| Audience | Impact |
|----------|--------|
| **ISRO, NSIL** | Response time hours → minutes; lower satellite loss risk |
| **Mission control** | One console replaces fragmented tools |
| **Space traffic agencies** | CCSDS CDM export enables inter-agency coordination |
| **Constellation operators** | Fleet-wide autonomous clearance in one click |
| **Orbital environment** | Prevents debris-generating collisions; fights Kessler Syndrome |

### Benefits

**Social:**
- Protects satellite services millions depend on (weather, disaster warning, NavIC, EOS).
- Prevents Kessler Syndrome from rendering LEO unusable.

**Economic:**
- One satellite = ₹200–₹2,000 crore; avoiding one collision saves full asset + revenue.
- One console replaces 5+ tools → lower staffing cost.
- Autonomous mode cuts service disruption windows.

**Environmental:**
- Each avoided collision prevents thousands of long-lived debris fragments.
- Preserves LEO for future missions & human spaceflight.

**Technological:**
- First Indian SSA console integrating AI Engine with real astrodynamics.
- Open, extensible architecture. Live SGP4 tracking — not a simulation.

---

## SLIDE 6 — RESEARCH AND REFERENCES

### Standards & Methodologies

| Reference | Description |
|-----------|-------------|
| **CCSDS 508.0-B-1** | CDM standard for inter-agency conjunction warnings |
| **NASA CARA** | Pc threshold framework (Critical ≥ 1×10⁻⁴, High ≥ 1×10⁻⁵) |
| **Foster, J. L. (1992)** | 2D Gaussian Pc integration method used in engine |
| **Bate, Mueller & White** | *Fundamentals of Astrodynamics* — Keplerian propagation |
| **Vallado, D.** | SGP4/SDP4 propagation, frame conversions |
| **Tsiolkovsky equation** | Δm = m₀(1 − e^(−ΔV/(Isp·g₀)) |

### Data Sources

| Source | Use |
|--------|-----|
| **CelesTrak** | Real TLE/GP for ISRO fleet (free, no key) |
| **Space-Track** | Catalogued object data (supplementary) |
| **NOAA SWPC** | Space weather (F10.7, Kp) |

### Technology References

| Technology | Use |
|-----------|-----|
| **Three.js** | WebGL 3D rendering |
| **satellite.js** | SGP4 propagation |
| **AI Engine** | AI Flight Director + fallback |
| **Express.js** | REST API backend |

### Project Links

| Resource | Location |
|----------|----------|
| **Source code** | GitHub *(fill repo URL)* |
| **Live demo** | *(fill deployed URL)* |
| **Workflow doc** | `docs/WORKFLOW.md` |
| **Feature guide** | `docs/FEATURES.md` |

---

## PRESENTATION TIPS

- Max **6 slides** (incl. title). **Avoid paragraphs** — use points/diagrams.
- Keep explanations **precise**. Idea must be **unique & novel**.
- Use only the provided template. **Save as PDF** (no PPT/Word).
- **Delete instruction slide** before uploading.

### Suggested Diagrams
1. **Slide 2** — 3D globe screenshot + DETECT → BURN → CLEAR flow.
2. **Slide 3** — Architecture pipeline + B-plane covariance plot.
3. **Slide 4** — 5-stage autopilot pipeline diagram.
4. **Slide 5** — Before/after: Pc 2.8×10⁻⁴ (red) → 2.2×10⁻⁶ (green) with AI Risk Map.
