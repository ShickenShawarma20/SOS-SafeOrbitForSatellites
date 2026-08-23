# 🛰️ Team Member 3: AI Flight Director & Prompt Engineer
## Individual Work Plan & Step-by-Step Task Guide

---

### 👤 Role Overview
* **Domain**: Google Gemini 3.7 AI Integration, Astrodynamics Prompt Engineering & Fallback Systems.
* **Assigned Files**:
  - `server.ts` (Gemini 3.7 API integration)
  - `src/components/AiFlightDirectorAdvisor.tsx` (AI console UI)
  - `src/utils/aiAssessmentFallback.ts` (Deterministic mathematical fallback engine)
* **Goal**: Build the intelligent AI Astrodynamics Flight Director that processes Conjunction Data Messages, generates structured flight directives, provides operator telecommand checklists, and enables real-time interactive chat.

---

### 📚 Concepts to Master
1. **Google Gen AI SDK**: Connecting to Gemini 3.7 Flash (`@google/genai`), managing system instructions, and temperature controls.
2. **Structured JSON Schema Output**: Forcing the LLM to return strictly typed JSON matching `ManeuverDirective` (burn epoch, $\Delta V$ components, risk level, checklist).
3. **Astrodynamics Prompt Engineering**: Crafting domain-specific system prompts with satellite physics rules, collision thresholds, and operational constraints.
4. **Deterministic Fallbacks**: Ensuring flight directives are instantly generated mathematically even if the AI API is rate-limited or offline.

---

### 📋 Step-by-Step Action Plan

#### Phase 1: Gemini 3.7 API Server & Backend Routes (Hours 0 - 8)
- [ ] Set up `server.ts` using Express to handle AI assessment requests.
- [ ] Initialize the Google Gen AI client with environment variable `GEMINI_API_KEY`.
- [ ] Create endpoint `POST /api/assess-conjunction`:
  - Receives satellite telemetry, debris telemetry, and miss distance.
  - Sends a structured prompt to Gemini 3.7 Flash.
  - Returns the validated JSON flight directive to the frontend.

#### Phase 2: System Prompt Design & Schema Definition (Hours 8 - 14)
- [ ] Craft the AI Flight Director system prompt:
  - Role: Senior Spacecraft Astrodynamics & Collision Avoidance Officer.
  - Directives: Calculate optimal burn direction (prograde vs. retrograde vs. cross-track), minimize fuel, ensure $>10\text{ km}$ safety clearance, and format a 4-step operator telecommand checklist.
- [ ] Define the strict JSON response schema enforcing fields: `burnEpoch`, `deltaV` (prograde, radial, normal, magnitude), `fuelKg`, `projectedMissDistanceKm`, `riskAssessment`, `telecommandChecklist`.

#### Phase 3: Interactive Operator Advisory Chat (Hours 14 - 22)
- [ ] Create endpoint `POST /api/chat-advisor` in `server.ts` supporting multi-turn chat with conversation history.
- [ ] Build the interactive chat UI inside `AiFlightDirectorAdvisor.tsx`:
  - Quick action suggestion chips (*"What if we delay the burn?", "Calculate cross-track option", "Explain the B-plane risk"*).
  - Streaming or real-time message bubble display with flight officer avatars.

#### Phase 4: Deterministic Astrodynamics Fallback Engine (Hours 22 - 28)
- [ ] Implement `src/utils/aiAssessmentFallback.ts`:
  - If the Gemini API returns an error or no API key is provided, compute the recommended $\Delta V$ using classical analytical formulas from **Member 1**.
  - Generate standard procedural telecommands deterministically.
  - Ensure the user interface indicates `Mode: AI-Powered (Gemini 3.7)` or `Mode: Deterministic Fallback Active`.

#### Phase 5: UI Polish & Directive Transfer (Hours 28 - 36)
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
* **Your Pitch Moment**: Show how Gemini 3.7 evaluates the collision threat in under 2 seconds, generates precise $\Delta V$ flight directives, and answers live questions from flight operators during high-pressure conjunctions.
