# DEEKSHANT: BACKEND / ML OPS

## 🎯 Your Main Goal
You are the central nervous system of the project. Your goal is to build the API (using FastAPI) that connects the database, the AI models, and the frontend dashboard together so they can all communicate instantly.

## 🧠 What You Need to Learn
- **FastAPI (Python):** How to build a fast, modern API server.
- **REST APIs:** How the frontend asks the backend for data (like `GET /alerts`) and how the backend replies using JSON format.
- **Model Serving:** How to take Vinayak and Priyanshi's trained AI models and load them into your server so they can score transactions in real-time.
- **Neo4j Python Driver:** How to write Python code that talks to Srajan's graph database to get network data.
- **Docker & Deployment:** How to package all this code into a container so it runs smoothly on any machine.

## 🤝 How You Fit Into the Team
- **You take Srajan's database, Vinayak's ML model, and Priyanshi's GNN model** and plug them into your server.
- **You provide all the data to Shubhi** so she can build the visual dashboard.

## 🛠️ Features & Domain Responsibility
- FastAPI server design and implementation
- RESTful API endpoints for alerts and graph visualization (JSON format)
- Model serving pipelines (XGBoost & GNN integration)
- Neo4j Python Driver connectivity
- Docker containerization and deployment environments

## 📋 Step-by-Step Tasks
1. **Step 1 (Documentation):** Write down a list of API endpoints we will need (e.g., an endpoint to get an alert, an endpoint to get graph data).
2. **Step 2 (Documentation):** Draw a simple diagram of how your server connects to the database and the models.
3. **Step 3 (Implementation):** Build the FastAPI server framework.
4. **Step 4 (Implementation):** Connect the FastAPI server to the Neo4j database and serve predictions from the AI models.
5. **Step 5 (Implementation):** Write the Dockerfile to package and deploy the backend API.
