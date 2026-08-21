# SHUBHI: FRONTEND / INVESTIGATION UI

## 1. Mission
Your mission is to design and conceptualize the user interface that fraud analysts will use. You must translate complex AI outputs, risk scores, and graph topologies into an intuitive, visually stunning dashboard that allows humans to rapidly investigate and stop fraud.

## 2. Frontend Fundamentals
You must deeply understand browser rendering, DOM manipulation, asynchronous JavaScript, and responsive design.

## 3. React Concepts
React is the core library. You must understand Component architecture, Props, Hooks (useState, useEffect), and functional programming principles.

## 4. Components
Designing the UI as modular, reusable pieces (e.g., a `<RiskBadge />`, an `<AlertCard />`, a `<GraphViewer />`).

## 5. State
Understanding how to manage the data within the application (e.g., currently selected alert, graph filtering options) using React State or Context.

## 6. API Communication
Understanding how to use `fetch` or Axios to make asynchronous HTTP requests to Deekshant's backend API and handle loading/error states.

## 7. Dashboard Design
Conceptualizing the main screen: summary statistics, high-level metrics, and the queue of pending alerts.

## 8. Alert Design
How to display an incoming fraud alert so the investigator immediately knows the severity, the entities involved, and the overall risk score.

## 9. Risk Visualization
How to visually represent the fused risk score (e.g., color-coded gauges, progress bars, breakdown charts showing Rule vs ML vs GNN contributions).

## 10. Graph Visualization
The most critical part of your role. You must understand how to render interactive network graphs in the browser.

## 11. Cytoscape.js Concepts
Cytoscape.js (or similar libraries like React Flow or G6) is used for rendering networks. You must research how it consumes JSON nodes and edges, how to apply CSS-like styles to the graph, and how to configure physics-based layouts (like force-directed layouts) to untangle "hairball" networks.

## 12. Entity Visualization
Designing distinct visual representations (colors, icons, sizes) for Accounts, Devices, IPs, and Merchants within the graph.

## 13. Transaction Timeline
Fraud is chronological. You must design a component (like a timeline or a slider) that allows the investigator to step through the sequence of events.

## 14. Money-Flow Visualization
How to show the direction and magnitude of transactions (e.g., using directed arrows and varied edge thickness).

## 15. Evidence Panel
The UI component dedicated to Explainable AI. How to translate SHAP values and GAT attention weights into human-readable text and charts (e.g., "Risk driven by: High Velocity (40%), Shared IP (35%)").

## 16. Fraud-Ring Visualization
How to visually highlight the specific cluster or community of nodes that the GNN flagged as a coordinated ring.

## 17. Investigation Workflow
Designing the user journey:
1. Click alert.
2. View summary.
3. Explore graph.
4. Read AI explanation.
5. Make decision.

## 18. Case Management
Conceptualizing the forms and buttons needed to resolve a case (e.g., "Mark as True Positive," "Add Notes," "Escalate").

## 19. UX Principles
User Experience. Ensuring the interface is intuitive, minimizes clicks, and reduces cognitive load for analysts looking at complex data.

## 20. Investigator-Centered Design
Understanding that your end-user is a financial crime analyst. They need fast, dense information, not consumer-app fluff.

## 21. Accessibility
Ensuring colors contrast well (especially for color-coded risk alerts) and the UI is navigable.

## 22. How Frontend Connects to Backend
You rely entirely on the JSON structures defined by Deekshant. You must agree on the API contracts early.

## 23. What You Should Research
- Best practices in graph visualization UIs (look at tools like Linkurious or Maltego).
- Cytoscape.js integration with React.
- Modern dashboard design aesthetics (dark mode, glassmorphism, clean typography).

## 24. What You Should Document
- UI/UX wireframes or mockups of the main views (Dashboard, Investigation View).
- Component hierarchy (React structure).
- The required JSON shape for the Graph Visualization component.

## 25. Dependencies
You depend completely on **Deekshant's** API to provide data.
You depend on the **ML and GNN teams** to define what "evidence" needs to be visualized.

## 26. Learning Roadmap
1. React fundamentals and State management.
2. Cytoscape.js (or similar graph rendering libraries).
3. API fetching and asynchronous UI states.
4. Dashboard UX design for complex data.

## 27. Questions You Should Answer
- "How do we prevent a graph with 1,000 nodes from freezing the browser?"
- "How do we visually differentiate a GNN-identified fraud ring from normal transactions in the UI?"
- "What JSON format does Cytoscape.js need to render nodes and edges?"

## 28. Documentation-Phase Definition of Done
- [ ] UI/UX conceptual wireframes documented.
- [ ] Graph Visualization technical strategy documented (Library choice and JSON shape).
- [ ] React Component hierarchy mapped out.
- [ ] NO REACT CODE WRITTEN.
- [ ] NO FRONTEND APPLICATION BUILT.

## 29. Future Implementation Responsibilities
In the next phase, you will write the React application, integrate the graph visualization library, connect to the backend APIs, and apply the CSS styling to create a premium, responsive UI.
