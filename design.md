# SATSAFE — Satellite Collision Avoidance System
## Frontend Design Specification

### 1. Product Overview

SATSAFE is a mission-control style web application for satellite collision avoidance, conjunction assessment, orbital monitoring, and maneuver planning.

The interface should feel like a professional aerospace operations console rather than a generic analytics dashboard. The visual direction is a dark, cinematic space-operations UI with a large interactive 3D orbital visualization as the primary focal point and high-priority conjunction information surfaced immediately around it.

### 2. Design Goals

- Make collision risk immediately understandable.
- Prioritize actionable information over raw telemetry.
- Keep critical alerts visible without overwhelming the operator.
- Provide an interactive 3D representation of Earth, satellites, orbital tracks, and conjunctions.
- Allow operators to move naturally from alert → analysis → maneuver → simulation.
- Maintain a high information density while preserving clear visual hierarchy.
- Support desktop mission-control workflows first.

### 3. Visual Direction

#### Overall Style

- Dark aerospace / mission-control aesthetic.
- Premium, futuristic, technical appearance.
- Subtle glassmorphism rather than excessive transparency.
- Thin borders and restrained glow effects.
- Large rounded cards with consistent spacing.
- High contrast for critical operational information.
- Avoid excessive neon decoration.

#### Color System

```text
Background:
#050A12
#08111D
#0B1422

Panels:
#0C1727
#101D2D
#142238

Primary text:
#F4F7FB

Secondary text:
#94A3B8

Primary accent:
#38BDF8

Success / nominal:
#22C55E

Warning:
#F59E0B

High risk:
#F97316

Critical:
#EF4444

Borders:
rgba(148, 163, 184, 0.18)
```

Color should communicate operational state rather than decoration.

### 4. Typography

Recommended font:

- Inter
- Geist
- IBM Plex Sans

Use a slightly heavier weight for headings and numerical telemetry.

Suggested hierarchy:

```text
Page title:       24–30px / 600–700
Section title:    15–18px / 600
Metric value:     24–32px / 600–700
Body:             13–15px / 400–500
Metadata:         11–12px / 400–500
Navigation:       13–14px / 500
```

Numerical telemetry should use tabular numerals where possible.

### 5. Application Shell

Desktop layout:

```text
┌────────────────────────────────────────────────────────────────────┐
│ TOP STATUS / GLOBAL METRICS                                        │
├──────────────┬─────────────────────────────────────┬───────────────┤
│              │                                     │               │
│   SIDEBAR    │         3D ORBITAL VIEW             │ ALERT PANEL   │
│              │                                     │               │
│ Navigation   │                                     │ Critical      │
│              │                                     │ conjunction   │
│ System       │                                     │ alerts        │
│ status       │                                     │               │
├──────────────┴─────────────────────────────────────┴───────────────┤
│ CONJUNCTION TABLE          │ NEXT MANEUVER │ SYSTEM FEED           │
├─────────────────────────────┴────────────────┴─────────────────────┤
│ ORBITAL COVERAGE │ CONJUNCTION TIMELINE │ FUEL STATUS              │
└────────────────────────────────────────────────────────────────────┘
```

The main dashboard should be a 12-column grid.

Suggested proportions:

- Sidebar: 200–220px
- Main content: flexible
- Right alert panel: 320–360px
- Dashboard gutters: 12–20px
- Card radius: 12–18px

### 6. Top Status Bar

The top bar contains compact system-level metrics.

Required metrics:

1. UTC time
2. Active satellites
3. Conjunction alerts
4. Maneuvers planned
5. System health
6. Search
7. Notifications
8. Settings / operator menu

Example:

```text
19:42:18 UTC
May 26, 2024

Active Satellites
124

Conjunction Alerts
12

Maneuvers Planned
3

System Health
98%
```

Critical metrics should be visually emphasized without dominating the interface.

### 7. Left Navigation

Primary navigation:

- Home
- Conjunctions
- Satellites
- Maneuvers
- Orbits
- Ground Stations
- Analytics
- Reports
- Settings

The active route should use a subtle illuminated panel with a blue/cyan accent.

Bottom section:

```text
SYSTEM STATUS
NOMINAL

Tracking Sources
32 Online

Data Latency
1.2s

Coverage
98.7%
```

Operator profile can appear beneath the system status.

### 8. Main 3D Orbital View

This is the primary visual element.

#### Required elements

- 3D Earth
- Satellite markers
- Orbital tracks
- Object/debris tracks
- Satellite labels
- Conjunction markers
- Closest-approach corridor
- Selected satellite highlight
- Camera controls
- Zoom controls
- Layer controls
- Timeline controls
- Live state indicator

#### Visual behavior

Normal satellite:

- Cyan/blue track
- Small illuminated marker

Warning object:

- Amber marker

High-risk conjunction:

- Orange trajectory
- Orange/red approach corridor

Critical conjunction:

- Red marker
- Pulsing risk indicator
- Highlighted closest-approach region

The Earth should have a dark surface with subtle city-light and geographic detail. Avoid making the globe brighter than the surrounding operational UI.

### 9. Orbital Timeline

Place a timeline directly beneath the 3D view.

Controls:

```text
[Play]

-2h ───────── NOW ───────── +2h

             ● TCA

[2x] [Fullscreen]
```

The timeline allows operators to understand where an event occurs relative to the current time.

### 10. Critical Alert Panel

The right-side panel should always prioritize the highest-risk conjunction.

Example:

```text
CRITICAL ALERT

SAT-042  ↔  OBJ-8821
HIGH RISK

TCA
04:32:18

Probability of Collision
2.8 × 10⁻⁴

Miss Distance
742 m

Relative Velocity
13.7 km/s

Relative Speed
27,650 km/h

[ View Conjunction ]
```

Do not hide TCA, probability of collision, or miss distance behind secondary navigation.

### 11. Alert Summary

Use a compact donut/ring chart.

Example:

```text
12
Total

Critical    1
High        3
Medium      8
Low         0
```

The chart should be readable at a glance.

### 12. Upcoming Conjunctions

Use a dense table/card hybrid.

Columns:

- Satellite
- Object
- TCA
- Miss distance
- Pc
- Risk

Example:

```text
SAT-042   OBJ-8821   04:32:18   742 m    2.8e-4
SAT-078   OBJ-3421   11:15:42   1.2 km   7.6e-6
SAT-021   OBJ-1123   15:42:09   3.8 km   1.2e-6
SAT-109   OBJ-7781   02d 01:33  5.6 km   2.3e-6
SAT-033   OBJ-9912   2d 06:55   8.1 km   3.1e-6
```

Rows should be sortable and filterable.

### 13. Next Maneuver Card

Show the next planned maneuver with a direct route to simulation.

Required information:

- Satellite
- Maneuver status
- Maneuver window
- Delta-V
- Purpose
- Fuel impact
- Duration
- Maneuver visualization

Example:

```text
SAT-042
PLANNED

Window
May 26, 02:10–02:45 UTC

Delta-V
0.42 m/s

Purpose
Collision Avoidance

Impact on Fuel
-0.08% (12.4 kg)

Duration
2m 34s

[View Maneuver Plan] [Simulate]
```

### 14. System Feed

Use a chronological event stream.

Event types:

- Conjunction alert
- Tracking update
- Maneuver completed
- New TLE/data received
- Ground station status
- Weather update
- System warning

Each item should have:

- Severity icon
- Message
- Relative timestamp

### 15. Orbital Coverage

Small world map showing tracking/ground-station coverage.

Metrics:

```text
32 Stations Online
2 Stations Offline
98.7% Global Coverage
```

Use subtle map illumination and small location markers.

### 16. Conjunction Timeline

Show several satellites/events across a shared time axis.

Example:

```text
          -12h     -6h      NOW      +6h      +12h

SAT-042     ●───────●───────●───────●
SAT-078     ●───────────────●───────●
SAT-021     ●───────────────●───────●
```

Risk levels should be encoded through point/segment states.

### 17. Fuel Status

Use a circular progress visualization.

Example:

```text
78%

Fuel Remaining

Total Fuel
154.8 kg

Usable Fuel
121.0 kg

Reserved
33.8 kg
```

Fuel consumption should be connected to maneuver planning.

### 18. Interaction Model

Primary interaction flow:

```text
Dashboard
   ↓
Critical Conjunction
   ↓
View Conjunction
   ↓
Conjunction Analysis
   ↓
Maneuver Options
   ↓
Simulate
   ↓
Compare Results
   ↓
Approve / Export
```

Operators should never need more than 1–2 clicks to inspect a critical event from the dashboard.

### 19. Conjunction Detail Screen

The detail screen should expand the selected event into a full analysis workspace.

Recommended layout:

```text
┌──────────────────────────────────────────────────────────────────┐
│ SAT-042 ↔ OBJ-8821       HIGH RISK       TCA 04:32:18            │
├───────────────────────────────┬──────────────────────────────────┤
│                               │ Risk Metrics                     │
│      Close Approach           │ Pc                               │
│      Visualization            │ Miss Distance                    │
│                               │ Relative Velocity                │
│                               │ Uncertainty                      │
├───────────────────────────────┼──────────────────────────────────┤
│ Orbit / Position Data         │ Maneuver Recommendations         │
│                               │                                  │
└───────────────────────────────┴──────────────────────────────────┘
```

### 20. Maneuver Planning Screen

Support comparison between:

- No maneuver
- Maneuver A
- Maneuver B
- Maneuver C

For every maneuver display:

- Delta-V
- TCA
- New miss distance
- New probability of collision
- Fuel cost
- Orbit change
- New conjunctions introduced
- Operational constraints

A recommended maneuver can be highlighted, but the operator should retain explicit approval control.

### 21. Risk Hierarchy

Use consistent states throughout the application:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Suggested behavior:

- LOW: neutral/blue indicator
- MEDIUM: amber indicator
- HIGH: orange indicator
- CRITICAL: red indicator + stronger visual emphasis

Do not use color alone. Include labels/icons for accessibility.

### 22. Component Library

Core reusable components:

```text
AppShell
Sidebar
TopStatusBar
MetricCard
StatusBadge
AlertCard
AlertSummary
OrbitalViewer
OrbitLayerControl
Timeline
ConjunctionTable
ConjunctionRow
ManeuverCard
ManeuverComparison
SystemFeed
CoverageMap
FuelGauge
SatelliteCard
SatelliteDetail
Modal
Drawer
CommandButton
FilterBar
Search
NotificationCenter
```

### 23. Buttons

Primary:

```text
View Conjunction
Analyze
Simulate
View Maneuver Plan
Compare
```

Secondary:

```text
View All
Details
Export
Filter
```

Destructive / critical actions should require explicit confirmation.

### 24. Responsive Strategy

Desktop is the primary target.

At tablet width:

- Collapse sidebar.
- Stack alert panel below orbital viewer.
- Convert lower dashboard cards to two-column layout.

At mobile width:

- Prioritize alerts.
- Replace the large 3D viewer with a simplified orbital visualization.
- Use bottom navigation.
- Convert tables into expandable cards.
- Keep TCA, Pc, miss distance, and risk visible without scrolling horizontally.

### 25. Accessibility

Requirements:

- WCAG AA contrast target.
- Do not communicate risk using color alone.
- Keyboard navigable controls.
- Visible focus states.
- Tooltips for orbital visualization controls.
- Screen-reader labels for telemetry and chart values.
- Large enough hit areas for mission-control interaction.

### 26. Animation

Use motion sparingly.

Recommended:

- Subtle orbit movement.
- Pulsing critical conjunction marker.
- Smooth timeline transitions.
- Alert arrival animation.
- Hover elevation on cards.
- Soft status indicator transitions.

Avoid:

- Constantly moving UI panels.
- Excessive particle effects.
- Large transitions between routine screens.
- Decorative animation that competes with alerts.

### 27. Technical Frontend Direction

Recommended stack:

```text
Framework:      Next.js / React
Language:       TypeScript
Styling:        Tailwind CSS
Components:     shadcn/ui or custom component system
3D:             Three.js / React Three Fiber
Charts:         Recharts / ECharts
Maps:           Mapbox GL or equivalent
State:          Zustand
Data fetching:  TanStack Query
Icons:          Lucide
```

The 3D orbital engine should be isolated from the general dashboard components so that orbital rendering performance does not degrade the rest of the application.

### 28. Data Model Concepts

Core entities:

```text
Satellite
OrbitalState
Conjunction
TrackedObject
Maneuver
GroundStation
TelemetryEvent
TrackingSource
RiskAssessment
```

A conjunction should contain at minimum:

```text
id
primarySatellite
secondaryObject
tca
probabilityOfCollision
missDistance
relativeVelocity
uncertainty
riskLevel
trackingSources
lastUpdated
maneuverOptions
```

### 29. Design Principle

The most important rule for SATSAFE is:

> What is at risk → how serious is it → when will it happen → why do we believe it → what can we do → what happens if we do it?

The dashboard should make that sequence visually obvious.

### 30. Reference Composition

The final UI should combine:

- The cinematic dark-glass visual language of the reference.
- A large central Earth/orbital visualization.
- Dense aerospace telemetry.
- Persistent conjunction alerts.
- Compact operational cards.
- Strong numerical hierarchy.
- Professional mission-control information architecture.

The result should feel like a real **Space Situational Awareness / Collision Avoidance Operations Center**, not a generic futuristic dashboard.
