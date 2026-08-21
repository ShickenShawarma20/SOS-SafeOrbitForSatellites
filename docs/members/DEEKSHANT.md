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

## 📝 What You Have to Do RIGHT NOW (Documentation Phase)
- Write down a list of API endpoints we will need (e.g., an endpoint to get an alert, an endpoint to get graph data).
- Draw a simple diagram of how your server connects to the database and the models.
- **Do not write any backend server code yet!** Just document the plan.

## 🚀 What You Will Build LATER (Implementation Phase)
- Build the FastAPI server.
- Connect it to the database and the AI models.
- Write the Dockerfile to deploy it.
