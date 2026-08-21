# DEEKSHANT: BACKEND / ML OPS

## 1. Mission
Your mission is to build the central nervous system of FraudGraph AI. You will design the APIs, orchestrate the data flow, serve the machine learning models, query the graph database, and ensure the system is scalable, secure, and ready for production.

## 2. Backend Fundamentals
You must deeply understand server architectures, request/response lifecycles, and how to structure a robust web application.

## 3. API Fundamentals
The Application Programming Interface is the contract between the frontend and the backend. You must design clean, logical routes.

## 4. REST
Representational State Transfer. You must understand HTTP methods (GET, POST, PUT, DELETE) and how to design a RESTful API around our entities (e.g., `GET /api/alerts`, `GET /api/graph/{entity_id}`).

## 5. JSON
JavaScript Object Notation. The format in which data is sent and received. You must design the JSON schemas for the API responses.

## 6. FastAPI Concepts
FastAPI is the chosen framework. You must understand its asynchronous nature, dependency injection, and Pydantic validation.

## 7. Model Serving
You are responsible for taking the trained models from Vinayak and Priyanshi and loading them into memory so they can make predictions on incoming data in milliseconds.

## 8. Risk Engine
You must conceptually design the core logic layer that triggers the models, evaluates the rules, and computes the final score.

## 9. Risk Fusion
Document the logic of how the backend will combine the XGBoost score and the GNN score (e.g., a weighted average or a meta-classifier).

## 10. Alert Generation
If the fused risk score exceeds a threshold, the backend must create an Alert object and store it in a database for the frontend to fetch.

## 11. Explainability Service
When the frontend requests details on an alert, your API must query the SHAP values and GNN attention weights and format them into readable JSON for the UI.

## 12. Graph Service
You must write the backend code that connects to Srajan's Neo4j database using the official driver, executes his Cypher queries, and returns the network topology to the frontend (formatted for Cytoscape.js).

## 13. ML Service
The integration points for the XGBoost model predictions.

## 14. GNN Service
The integration points for the PyTorch GNN predictions.

## 15. Database Concepts
Aside from Neo4j (for the graph), you must conceptualize a relational database (like PostgreSQL or SQLite) to store application state, users, and case management data.

## 16. Configuration
How the app manages different environments (Dev, Test, Prod) using `.env` files.

## 17. Environment Variables
Securely injecting database passwords and API keys without hardcoding them in the source code.

## 18. Logging
Designing a structured logging system to track requests, errors, and system health.

## 19. Error Handling
Ensuring the API returns appropriate HTTP status codes (400, 404, 500) and helpful error messages instead of crashing.

## 20. Testing
Conceptualizing unit tests for the API endpoints and integration tests for the database connections.

## 21. Docker
Understanding containerization. How to package the FastAPI app, the models, and the dependencies into a single, deployable Docker image.

## 22. ML Ops
The operationalization of machine learning. How to track model versions, handle model updates without downtime, and ensure reliable inference.

## 23. Model Versioning
How the backend knows whether it is running "XGBoost_v1" or "XGBoost_v2".

## 24. Monitoring
How to track API latency, memory usage, and model inference times.

## 25. Health Checks
Creating a `/health` endpoint for infrastructure to verify the API is alive.

## 26. Scalability
Designing the API statelessly so it can be scaled horizontally across multiple servers if transaction volume spikes.

## 27. Security
Implementing JWT (JSON Web Tokens) for authentication, CORS policies, and input validation to protect the system.

## 28. How Your Role Integrates Everyone
You are the glue. You take Sayansh's data concepts, Srajan's database, Vinayak/Priyanshi's models, and you package them up to serve to Shubhi's frontend.

## 29. What You Should Document
- A complete OpenAPI/Swagger-style spec of the required endpoints.
- The system architecture diagram (FastAPI, Neo4j, Models).
- The JSON response format required by the frontend graph visualization.

## 30. Dependencies
You depend on **Vinayak/Priyanshi** for models and **Srajan** for Cypher queries.
**Shubhi** depends entirely on your API documentation to build the frontend.

## 31. Learning Roadmap
1. FastAPI and Pydantic.
2. Neo4j Python Driver.
3. Model Serving (scikit-learn, PyTorch inference).
4. REST API Design and Docker.

## 32. Questions You Should Answer
- "How do we format a Neo4j query result so React/Cytoscape can render it?"
- "How do we load a PyTorch model in FastAPI without blocking asynchronous requests?"
- "What happens if the Neo4j database goes down? How does the API respond?"

## 33. Documentation-Phase Definition of Done
- [ ] REST API endpoints documented (Inputs, Outputs, Methods).
- [ ] Backend Architecture Diagram completed.
- [ ] Integration strategy for ML and GNN models documented.
- [ ] NO BACKEND CODE WRITTEN.
- [ ] NO DOCKERFILES OR CONFIGURATIONS CREATED.

## 34. Future Implementation Responsibilities
In the next phase, you will write the FastAPI application, the database connectors, the Dockerfiles, and the deployment scripts.
