# TEAM WORKFLOW & INTEGRATION GUIDE

FraudGraph AI is a highly interconnected system. No single component works in isolation. This guide defines how the six roles collaborate, share knowledge, and integrate their work.

## 1. How the Six Roles Connect

The project operates as a continuous pipeline:
1. **SAYANSH (Data)** defines the raw reality (transactions, entities).
2. **SRAJAN (Graph)** takes that raw reality and maps it into a complex network topology.
3. **VINAYAK (ML)** extracts tabular and structural features from the network to establish baseline AI rules.
4. **PRIYANSHI (GNN)** learns directly from the complex network topology to catch advanced patterns.
5. **DEEKSHANT (Backend)** wraps the database, the ML model, and the GNN model into a scalable API.
6. **SHUBHI (Frontend)** consumes the API to provide human investigators with an explainable, visual dashboard.

## 2. What Everyone Needs to Understand
Every single team member must conceptually grasp:
- The difference between tabular data and graph data.
- Why isolated transaction monitoring fails.
- What a node, an edge, and a fraud ring are.
- The fundamental concept of Explainable AI (investigators need to know *why*).

## 3. Specialized Deep Dives
You do not need to learn everything.
- Only **Srajan** and **Deekshant** need to deeply study Cypher and Neo4j internals.
- Only **Vinayak** and **Priyanshi** need to deeply understand gradient descent, precision/recall, and SHAP.
- Only **Shubhi** needs to understand React state and DOM manipulation.
- Only **Sayansh** needs to deeply understand financial simulation schemas.

## 4. Communication Flow
- The team should hold regular alignment meetings.
- **API Contracts:** Deekshant and Shubhi must agree on exact JSON structures before any code is written in the next phase.
- **Data Contracts:** Sayansh, Srajan, and the ML team must agree on exact column names and edge types.

## 5. Dependency Flow
```text
SAYANSH
    ↓
SRAJAN
    ↓
VINAYAK

SRAJAN
    ↓
PRIYANSHI

VINAYAK + PRIYANSHI + SRAJAN
    ↓
DEEKSHANT

DEEKSHANT
    ↓
SHUBHI
```
*Note: While the dependencies flow downwards linearly in production, development is collaborative. Deekshant can build mock APIs for Shubhi before the ML models are finished.*

## 6. Research Sharing
- If Priyanshi finds a paper on Temporal GNNs that requires a specific timestamp format, she must communicate this back to Sayansh to ensure the data supports it.
- Srajan must share his Cypher query capabilities with Deekshant to ensure the backend can execute them efficiently.

## 7. Documentation Standards
All documentation must be stored in this repository as Markdown files. 
- Use clear headings.
- Avoid jargon where possible, or define it in the Glossary.
- Use Mermaid or conceptual ASCII diagrams to explain complex architectures.

## 8. Git Concepts (For Later Phases)
When implementation begins, the team will use Git.
- Never push directly to `main`.
- Create feature branches (e.g., `feature/graph-schema`, `feature/api-auth`).
- Review each other's Pull Requests.

## 9. Integration Strategy
Do not wait until the final day to connect the components.
- **Step 1:** Sayansh provides dummy CSV data.
- **Step 2:** Srajan loads dummy data into Neo4j.
- **Step 3:** Deekshant connects FastAPI to Neo4j and serves dummy JSON.
- **Step 4:** Shubhi renders the dummy JSON in the React graph.
- **Step 5:** Vinayak and Priyanshi swap out the dummy logic with real AI models.

## 10. Avoiding Duplicated Work
- Vinayak and Priyanshi should share data preprocessing scripts to ensure they are evaluating their models on the exact same train/test splits.
- Srajan and Deekshant should collaborate on database queries so Deekshant doesn't rewrite Srajan's Cypher logic.

## 11. Reviewing Work
- Cross-review documentation. Does Shubhi understand the explanations Priyanshi is providing? If not, the UI will be confusing.
- Ensure the Glossary contains all terms used by individual members.

## 12. Hackathon Preparation
The final goal is a working prototype and a compelling presentation.
- **Technical perfection is less important than a complete story.** A perfectly tuned GNN is useless in a hackathon if the backend crashes and the frontend is blank.
- The team must prioritize end-to-end integration over isolated complexity.
