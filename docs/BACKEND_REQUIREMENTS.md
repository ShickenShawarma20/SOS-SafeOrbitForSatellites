# SOS · SafeOrbitForSattelites — Backend Requirements for Frontend

This document catalogs **every backend feature, API endpoint, data contract, and real-time channel** the frontend needs to work properly. It is derived from a full audit of the current frontend. The Express/Astro backend now serves real computed conjunction, maneuver, analytics, and tracking data (with pre-seeded mock data used only as a full demo fallback); this doc defines the contracts the frontend relies on.

> **Convention:** Every page shares a persistent sidebar + topbar shell
> (`js/shell.js`). For a step-by-step operational walkthrough, see the
> [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md).

---

## 1. Conventions

- **Base URL:** `/api/v1`
- **Format:** JSON (UTF-8), ISO-8601 UTC timestamps (`2024-05-26T04:32:18Z`)
- **Auth:** Bearer token / session cookie; operator roles (Mission Controller, Mission Director)
- **Errors:** `{ "error": { "code": "...", "message": "..." } }` with proper HTTP status codes
- **Pagination:** `?page=&limit=` with `{ "items": [...], "total": n }`
- **Realtime:** WebSocket endpoint `wss://…/ws` (see §11)

### Shared enums
- **Severity:** `critical | high | medium | low`
- **Satellite status:** `operational | degraded | standby | offline`
- **Orbit regime:** `LEO | MEO | GEO | HEO`
- **Object type:** `payload | rocket_body | fragmentation | unknown`
- **Maneuver purpose:** `collision_avoidance | station_keeping | orbit_raise | deorbit`

### Core TypeScript-style types

```ts
interface Satellite {
  id: string;                 // "SAT-51656"
  noradId: number;            // 51656
  name: string;
  type: string;               // "Earth Observation"
  operator: string;           // "ISRO"
  launchDate: string;         // ISO date
  massKg: number;             // 1200
  status: SatelliteStatus;
  orbitClass: string;         // "SSO · Sun-synchronous"
  elements: OrbitalElements;
  fuel: FuelState;
  subsystems: SubsystemStatus[];
}

interface OrbitalElements {
  altitudeKm: number;         // 450
  inclinationDeg: number;     // 97.6
  raanDeg: number;            // 132.4
  eccentricity: number;       // 0.000126
  periodMin: number;          // 92.67
  argPerigeeDeg: number;      // 91.2
  tle: { line1: string; line2: string; epoch: string };
  eciPosition?: [number, number, number];   // km, ECI frame (for 3D view)
  eciVelocity?: [number, number, number];   // km/s
}

interface FuelState {
  pctRemaining: number;       // 78
  totalKg: number;            // 154.8
  usableKg: number;           // 121.0
  reservedKg: number;         // 33.8
  estEndOfLife: string;       // "2029 Q3"
  ispSec: number;             // thruster specific impulse (for Tsiolkovsky)
  dryMassKg: number;
}

interface DebrisObject {
  id: string;                 // "OBJ-8821"
  noradId?: number;
  type: ObjectType;           // "fragmentation" → displayed as "Frag."
  elements: OrbitalElements;
}

interface Conjunction {
  id: string;                 // "CD-2024-0526-0417"
  satelliteId: string;        // "SAT-51656"
  objectId: string;           // "OBJ-8821"
  severity: Severity;
  tca: string;                // time of closest approach
  probabilityOfCollision: number;  // Pc, e.g. 3.2e-4
  missDistanceMeters: number;      // 742
  relativeVelocityKms: number;     // 15.29
  relativeSpeedKmh: number;        // 55041
  combinedUncertaintyKm: number;   // 1.29
  screeningVolumeKm: [number,number,number]; // [10,10,10]
  hardBodyRadiusM: number;
  bPlane?: { xiKm: number; zetaKm: number }; // encounter-plane coords
  covariance?: { sigma1: number; sigma2: number; orientationDeg: number };
  assessment: string;         // human-readable recommendation text
  acknowledged: boolean;
  watchlisted: boolean;
}

interface ManeuverPlan {
  id: string;
  conjunctionId: string;
  satelliteId: string;
  label: string;              // "PLAN A"
  recommended: boolean;
  direction: "prograde|retrograde|radial_in|radial_out|normal|anti_normal";
  burnWindow: { earliest: string; latest: string };
  deltaVmps: number;          // 0.42
  burnDurationSec: number;    // 154
  thrustN: number;            // 1.1
  fuelImpactPct: number;      // -0.08
  fuelImpactKg: number;       // -12.4
  newMissDistanceKm: number;  // 2.45
  riskReductionPct: number;   // 92.1
  postBurnPc: number;         // 2.2e-6
  altitudeChangeKm: number;   // 0.62
  groundTrackShiftKm: number; // 14.2
  secondaryScreeningClear: boolean; // 72 h post-burn re-screening
  notes: string;              // visibility/recovery notes
  approvalStatus: "draft|pending_approval|approved|rejected|executed";
}
```

---

## 2. Dashboard (index.html)

| Feature | Endpoint |
|---|---|
| Critical alert banner (SAT-51656 ↔ OBJ-8821: TCA, Pc 3.2e-4, miss 742 m, rel. velocity 15.29 km/s) | `GET /api/v1/conjunctions/critical` → highest-severity active `Conjunction` |
| Alert summary donut (12 alerts: 1 crit / 3 high / 8 med / 0 low, last 48 h) | `GET /api/v1/conjunctions/summary?window=48h` → counts by severity |
| Upcoming conjunctions table (5 rows + total screened count 21,430) | `GET /api/v1/conjunctions/upcoming?limit=5` and catalog size from `GET /api/v1/catalog/stats` |
| Next maneuver card (SAT-51656 window, ΔV 0.42 m/s, fuel −0.08%/12.4 kg, duration 2m34s) | `GET /api/v1/maneuvers/next` |
| System feed (alert/tracking/maneuver/TLE/weather events with timestamps) | `GET /api/v1/events/feed?limit=20` (also via WS push) |
| Ground-station coverage map (station positions lat/lon, online/offline, coverage %) | `GET /api/v1/groundstations` → `[{id,name,lat,lon,status}]`, `GET /api/v1/network/status` → `{stationsOnline:32, stationsOffline:2, coveragePct:98.7, latencySec:1.2}` |
| Conjunction timeline (±12 h events per satellite with Pc labels) | `GET /api/v1/conjunctions/timeline?window=±12h` → per-satellite event offsets |
| Fleet fuel status gauge (78%, total/usable/reserved kg) | `GET /api/v1/satellites/{id}/fuel` or aggregate `GET /api/v1/fleet/fuel-summary` |
| Topbar KPIs (124 active sats, 12 conjunction alerts, 3 planned maneuvers, 98% system health) | `GET /api/v1/dashboard/kpis` |
| Sidebar system status (tracking sources online, data latency, coverage) | included in `/dashboard/kpis` or `/network/status` |
| Alert actions modal — watchlist & acknowledge/silence | `POST /api/v1/conjunctions/{id}/watchlist`, `POST /api/v1/conjunctions/{id}/acknowledge` |

---

## 3. Conjunction Detail (conjunction.html)

| Feature | Endpoint |
|---|---|
| Conjunction record by ID (CD-2024-0526-0417 header, badges) | `GET /api/v1/conjunctions/{id}` |
| Risk metrics panel (Pc, miss distance, rel velocity/speed, uncertainty, screening volume) | included in `Conjunction` payload |
| Assessment text ("Pc exceeds 10⁻⁴ threshold…") | included; generated by risk-assessment engine |
| Close-approach geometry canvas (nominal trajectories + 3σ covariance ellipses + TCA point) | `GET /api/v1/conjunctions/{id}/geometry` → sampled ECI trajectory points for both objects + covariance ellipses in B-plane |
| Orbital information blocks (both objects' altitude, incl., period, type) | `GET /api/v1/conjunctions/{id}/objects` |
| Event history feed (CDM updates with timestamps) | `GET /api/v1/conjunctions/{id}/history` |
| Probability evolution table (last 6 CDMs: epoch, miss dist, Pc, trend %) | `GET /api/v1/conjunctions/{id}/cdms` → CDM series (CCSDS 508.0-B-1 records) |
| Tabs: Overview / Analysis / History / Maneuver Options | Analysis tab: `GET …/bplane`; Maneuver Options tab: `GET /api/v1/maneuvers/plans?conjunctionId={id}` |
| Watchlist button | `POST /api/v1/conjunctions/{id}/watchlist` |

**CDM ingestion (backend feature):** periodic import of CCSDS CDMs (JSON/XML) from tracking sources; each new CDM triggers re-computation of Pc/miss distance and pushes updates to the frontend.

### 3.1 Propagation / physics engine (server-side authority)

The frontend ships a client-side two-body engine (`js/sim-core.js`) used by the
Close Approach Geometry canvas: RK4 propagation, golden-section TCA search,
conjunction-plane (B-plane) kinematics, and numerical Pc integration over the
combined covariance with a spherical hard-body radius. The reference scenario is:

| Parameter | SAT-51656 | OBJ-8821 |
|---|---|---|
| Orbit | circular, 450 km, prograde | circular, 449.258 km, retrograde |
| Covariance (B-plane) | σ₁ = 1.05 km (along rel-velocity), σ₂ = 0.74 km (perpendicular), combined |
| Hard-body radius | 60 m combined |

Computed outputs the backend **must reproduce** for `CD-2024-0526-0417`:
`TCA +1200 s after epoch`, `miss = 742 m`, `rel. velocity = 15.29 km/s (55,041 km/h)`,
`Pc = 3.2 × 10⁻⁴`, `combined uncertainty = 1.29 km`.

Backend requirements to stay consistent with the client sim:

- `GET /api/v1/conjunctions/{id}/geometry` should return trajectory samples generated by the
  same class of propagator (RK4 or better; SGP4 for production), plus the B-plane covariance
  and hard-body radius so the canvas can switch from local computation to server data without
  changing the rendered result.
- Pc must be computed with a recognized method (Foster 1992 / Chan's analytic approximations,
  or numerical B-plane integration as in `sim-core.js`) — values within ~10% of the client
  engine for identical inputs.
- All ephemerides in ECI (km, km/s); timestamps ISO-8601 UTC.

---

## 4. Satellite Registry / Detail (satellite.html)

| Feature | Endpoint |
|---|---|
| Satellite list / registry | `GET /api/v1/satellites?page&status&type&q=` |
| Satellite profile (type, operator, launch date, mass, NORAD ID, mission elapsed) | `GET /api/v1/satellites/{id}` |
| Status badges (OPERATIONAL, "1 CRITICAL CONJUNCTION") | `GET /api/v1/satellites/{id}/conjunctions?severity=critical&active=true` (count) |
| Download TLE button | `GET /api/v1/satellites/{id}/tle` (text/plain two-line or JSON) |
| Fuel card (78% gauge, total/usable/reserved, EOL estimate) | included in profile (`fuel`) |
| Subsystem status list (Power, Propulsion, ADCS, Comms, Payload — nominal/degraded) | `GET /api/v1/satellites/{id}/subsystems` |
| Current orbit tiles (altitude, incl., RAAN, ecc., period, arg. of perigee) | included (`elements`) |
| Recent events feed | `GET /api/v1/satellites/{id}/events?limit=20` |
| Upcoming ground passes table (AOS time, station, duration, max elevation) | `GET /api/v1/satellites/{id}/passes?hours=24` → `[{aos, station, durationSec, maxElevDeg}]` |
| Telemetry tab (live housekeeping values) | WS channel (§11) or `GET /api/v1/satellites/{id}/telemetry/latest` |
| Orbit tab (propagated track for map/globe) | `GET /api/v1/satellites/{id}/track?span=24h&step=60s` |
| Files tab (23 documents: ICDs, manuals) | `GET /api/v1/satellites/{id}/files`, `GET …/files/{fid}` |

---

## 5. Maneuver Planner (maneuvers.html)

| Feature | Endpoint |
|---|---|
| Planner context (target conjunction, TCA, Pc) | `GET /api/v1/conjunctions/{id}` |
| Burn window slider bounds (earliest 02:10 / latest 02:45 UTC) | part of plan set response |
| Candidate plans A/B/C cards (ΔV, fuel impact, new miss distance, risk reduction, RECOMMENDED flag) | `GET /api/v1/maneuvers/plans?conjunctionId={id}` → `ManeuverPlan[]` |
| Plan details (burn direction, duration, thrust, altitude change, post-burn Pc, ground-track shift, notes about station visibility & recovery) | `GET /api/v1/maneuvers/plans/{planId}` |
| **Simulate Plan** (high-fidelity propagation vs latest CDM ephemeris, ~45 s async job) | `POST /api/v1/maneuvers/simulate {planId}` → `{jobId}`; poll `GET /api/v1/jobs/{jobId}` or WS progress; result includes post-burn trajectory samples + secondary conjunction screening (72 h forward) |
| **Save Plan → Submit for Approval** (queued for mission-director sign-off, then command scheduler upload) | `POST /api/v1/maneuvers/plans/{planId}/submit`; approval workflow: `GET /api/v1/approvals`, `POST /api/v1/approvals/{id}/approve|reject` |
| Export Plan | `GET /api/v1/maneuvers/plans/{planId}/export?format=json|xml|pdf` |
| Orbital comparison canvas (current orbit + candidate plan orbits + corridor) | result of simulate job or `GET /api/v1/maneuvers/plans/{planId}/trajectory` |

**Backend math required (server-side authority):**
- Tsiolkovsky propellant computation: `Δm = m₀(1 − e^(−ΔV/(Isp·g₀)))`
- Keplerian→Cartesian propagation (ECI), post-burn orbit reconstruction
- Post-burn miss distance, Pc recomputation, risk-reduction %
- Secondary conjunction screening on post-burn trajectory

---

## 6. Analytics (analytics.html)

| Feature | Endpoint |
|---|---|
| Range filter chips (7D/14D/30D) | query param `?range=7d|14d|30d` |
| Top metrics (total conjunctions 156, avg Pc 4.2e-5, maneuvers executed 7, risk reduction 94.6%, each with trend vs previous period) | `GET /api/v1/analytics/summary?range=30d` |
| Conjunctions over time (weekly series) | `GET /api/v1/analytics/conjunctions-over-time?range=…&bucket=week` |
| Conjunctions by severity × orbit regime (LEO/MEO/GEO/HEO grouped bars) | `GET /api/v1/analytics/by-severity?groupBy=regime` |
| Top objects by conjunctions (top N objects last 30 days) | `GET /api/v1/analytics/top-objects?range=30d&limit=5` |
| Conjunctions by altitude band (<400, 400–550, … >1000 km) | `GET /api/v1/analytics/by-altitude-band?range=…` |
| Export Report button | `GET /api/v1/analytics/report/export?range=…&format=pdf|csv` |

---

## 7. Search (global topbar)

- `GET /api/v1/search?q=<query>` → unified results across satellites, debris objects, conjunction IDs, TCA times.
  Response: `{ satellites: […], objects: […], conjunctions: […] }`

## 8. Notifications (bell icon)

- `GET /api/v1/notifications?unread=true`
- `POST /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/read-all`
- New critical alerts must arrive as WS push events.

## 9. Settings / Reports / Operator

- `GET/PUT /api/v1/settings` — alert thresholds (Pc maneuver threshold 10⁻⁴), screening volumes, notification prefs, layer defaults
- `GET /api/v1/reports?type=daily|conjunction|maneuver` + export endpoints
- Auth/session: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (operator name, role, avatar initials)
- Audit log: all alert acknowledgements, plan submissions, approvals recorded server-side (`GET /api/v1/audit`)

## 10. AI Flight Director (per README architecture)

- `POST /api/v1/ai/assess {conjunctionId}` — AI Engine structured flight directive (burn epoch, ΔV vector, urgency class, telecommand checklist)
- `POST /api/v1/ai/chat {sessionId, message}` — multi-turn astrodynamics advisor chat
- Backend must implement **deterministic fallback engine + caching** so these respond even without API key / during rate limits.

## 11. Real-time WebSocket channels (`wss://…/ws`)

| Channel / Event | Payload | Feeds |
|---|---|---|
| `conjunction.new` / `conjunction.update` | `Conjunction` | dashboard alert, tables, nav badge, notifications |
| `telemetry.{satId}` | position (ECI), subsystem states, fuel | orbital viewer, telemetry tab |
| `event.feed` | feed item | system feed widgets |
| `weather.update` | space weather (F10.7 solar flux, Kp index, drag density multiplier) | weather bar / drag dispersion |
| `network.status` | station up/down changes, latency, coverage | sidebar status, coverage map |
| `job.progress {jobId, pct, stage}` | simulation progress | Simulate Plan modal |
| `maneuver.status` | plan approval/execution state changes | planner summary bar |

Client sends subscribe messages: `{ "subscribe": ["conjunction", "telemetry.SAT-51656", …] }`.

## 12. Space Weather & Catalog (supporting features)

- `GET /api/v1/spaceweather/current` → `{ f107: number, kpIndex: number, dragMultiplier: number }`
- `GET /api/v1/catalog/stats` → `{ trackedObjects: 21430, lastTleUpdate: iso }`
- `GET /api/v1/catalog?q=&regime=&type=` — searchable debris/object catalog
- Scheduled TLE refresh job from external providers (CelesTrak/18 SDS); freshness shown in feed ("New TLE Data Received").

## 13. Non-functional requirements

1. **Latency:** REST responses < 300 ms; telemetry push ≤ 1–2 s (matches "Data Latency 1.2 s" UI claim).
2. **Availability:** graceful degradation — if the AI Engine is unavailable, deterministic fallback; if WS drops, frontend falls back to polling (`Retry-After` headers).
3. **CORS:** allow the static frontend origin(s).
4. **Caching:** conjunction summaries/KPIs cacheable (~15–60 s); CDM history immutable.
5. **Validation:** all POST bodies validated; audit-log every state-changing action.
6. **Timezone discipline:** everything UTC; frontend renders UTC clock locally.
7. **Versioning:** `/api/v1` prefix; additive-only changes within v1.

---

## 14. Implementation priority (minimum viable backend)

1. Satellites CRUD + TLE + elements (registry page dead without it)
2. Conjunctions: list/detail/summary/critical + CDM series
3. Maneuver plans: generate/list/detail + submit-for-approval
4. Simulation job endpoint (async)
5. Dashboard KPIs + event feed
6. Search + notifications
7. WebSocket push layer
8. Analytics aggregation endpoints
9. AI endpoints (with fallback)
