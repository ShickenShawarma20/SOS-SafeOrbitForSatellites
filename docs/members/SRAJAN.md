# SRAJAN: GRAPH ENGINEERING

## 🎯 Your Main Goal
You are building the network. Your goal is to take Sayansh's flat rows of data and turn them into a 3D web of connections using a Graph Database (Neo4j). You make it possible to see the hidden "fraud rings".

## 🧠 What You Need to Learn
- **Graph Basics:** What is a Node (a thing, like an Account) and an Edge (a relationship, like "Sent Money To").
- **Neo4j & Cypher:** Neo4j is the database we are using. Cypher is the language used to talk to it (like SQL, but for graphs).
- **Graph Algorithms:** Learn how algorithms like "Louvain" can automatically find groups of people working together (communities) or find the most important accounts (centrality).
- **Multi-Hop Queries:** How to write a query that finds money bouncing through 5 different accounts in a row.

## 🤝 How You Fit Into the Team
- **You take data from Sayansh** to build your graph database.
- **You provide Graph Features to Vinayak** (like telling him "this account has 50 connections" so he can use it in his ML model).
- **You provide the network structure to Priyanshi** so her advanced AI can learn from it.

## 🛠️ Features & Domain Responsibility
- Graph network topology mapping
- Neo4j database configuration and loading
- Cypher querying and optimization
- Graph algorithms (e.g., Louvain community detection, centrality metrics)
- Multi-hop queries to detect cascading transactions

## 📋 Step-by-Step Tasks
1. **Step 1 (Documentation):** Draw out the visual schema: What are our Nodes and what are our Edges?
2. **Step 2 (Documentation):** Write down 5 example Cypher queries we will need (e.g., "Find two accounts sharing the same device").
3. **Step 3 (Implementation):** Set up and configure the Neo4j database.
4. **Step 4 (Implementation):** Write the real Cypher queries to extract data and network features for the AI team.
