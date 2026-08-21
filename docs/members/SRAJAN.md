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

## 📝 What You Have to Do RIGHT NOW (Documentation Phase)
- Draw out the visual schema: What are our Nodes and what are our Edges?
- Write down 5 example Cypher queries we will need (e.g., "Find two accounts sharing the same device").
- **Do not install Neo4j or write code yet!** Just document the plan.

## 🚀 What You Will Build LATER (Implementation Phase)
- Set up the Neo4j database.
- Write the real Cypher queries to extract data and features for the AI team.
