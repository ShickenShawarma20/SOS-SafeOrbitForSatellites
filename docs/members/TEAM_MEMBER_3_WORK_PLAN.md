# 🛰️ Team Member 3: AI Flight Director & Prompt Engineer
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: AI Engine AI Integration, Astrodynamics Prompt Engineering & Fallback Systems.
* **Assigned Files**:
  - `server.ts` (AI Engine API integration)
  - `src/components/AiFlightDirectorAdvisor.tsx` (AI console UI)
  - `src/utils/aiAssessmentFallback.ts` (Deterministic mathematical fallback engine)
* **Goal**: Build the intelligent AI Astrodynamics Flight Director that processes Conjunction Data Messages, generates structured flight directives, and provides operator telecommand checklists.

---

### 📚 Concepts to Master
1. **Google Gen AI SDK**: Connecting to the AI Engine, managing system instructions, and temperature controls.
2. **Structured JSON Schema Output**: Forcing the LLM to return strictly typed JSON matching `ManeuverDirective` (burn epoch, $\Delta V$ components, risk level, checklist).
3. **Astrodynamics Prompt Engineering**: Crafting domain-specific system prompts with satellite physics rules, collision thresholds, and operational constraints.
4. **Deterministic Fallbacks**: Ensuring flight directives are instantly generated mathematically even if the AI API is rate-limited or offline.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: AI Engine API Server & Backend Routes (Hours 0 - 8)
- [ ] Set up `server.ts` using Express to handle AI assessment requests.
- [ ] Initialize the Google Gen AI client with environment variable `AI_API_KEY`.
- [ ] Create endpoint `POST /api/assess-conjunction`:
  - Receives satellite telemetry, debris telemetry, and miss distance.
  - Sends a structured prompt to AI Engine.
  - Returns the validated JSON flight directive to the frontend.

#### Phase 2: System Prompt Design & Schema Definition (Hours 8 - 14)
- [ ] Craft the AI Flight Director system prompt:
  - Role: Senior Spacecraft Astrodynamics & Collision Avoidance Officer.
  - Directives: Calculate optimal burn direction (prograde vs. retrograde vs. cross-track), minimize fuel, ensure $>10\text{ km}$ safety clearance, and format a 4-step operator telecommand checklist.
- [ ] Define the strict JSON response schema enforcing fields: `burnEpoch`, `deltaV` (prograde, radial, normal, magnitude), `fuelKg`, `projectedMissDistanceKm`, `riskAssessment`, `telecommandChecklist`.

#### Phase 3: Deterministic Astrodynamics Fallback Engine (Hours 14 - 22)
- [ ] Implement `src/utils/aiAssessmentFallback.ts`:
  - If the AI Engine API returns an error or no API key is provided, compute the recommended $\Delta V$ using classical analytical formulas from **Member 1**.
  - Generate standard procedural telecommands deterministically.
  - Ensure the user interface indicates `Mode: AI-Powered (AI Engine)` or `Mode: Deterministic Fallback Active`.

> **Note:** The standalone AI Command Center page (with its interactive chat UI)
> has been removed from the console. The AI Engine now powers the dashboard's
> AI Assessment bar directly. Time from the former chat phase is reallocated to
> the fallback engine below.

#### Phase 4: UI Polish & Directive Transfer (Hours 22 - 28)
- [ ] Add an "Apply Directive to Maneuver Lab" button that transfers the AI's recommended $\Delta V$ values directly to **Member 4**'s Maneuver Simulation Lab.
- [ ] Add copy-to-clipboard functionality for the operator telecommand checklist.

---

### 🔄 Team Collaboration Interfaces
* **Inputs Needed**:
  - From **Member 1**: Satellite state vectors, B-plane parameters, and mathematical fallback formulas.
  - From **Member 5**: Conjunction Data Messages (CDMs) and satellite fuel reserves.
* **Outputs to Provide**:
  - To **Member 4**: Recommended $\Delta V$ burn vectors to populate the Maneuver Lab.
  - To **Member 6**: The complete `AiFlightDirectorAdvisor.tsx` component for dashboard embedding.

---

### 🎤 Hackathon Presentation Role
* **Your Pitch Moment**: Show how AI Engine evaluates the collision threat in under 2 seconds, generates precise $\Delta V$ flight directives, and answers live questions from flight operators during high-pressure conjunctions.
