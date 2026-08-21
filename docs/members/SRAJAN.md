# SRAJAN: GRAPH ENGINEERING

## 1. Mission
Your mission is to design the graph topology, map relational data into a graph database (Neo4j), and develop the Cypher queries and graph algorithms that extract network intelligence. You turn static rows of data into a dynamic, queryable web of relationships.

## 2. Why Graph Engineering Matters
Fraud is a network phenomenon. Relational databases are too slow and rigid to detect complex multi-hop patterns (like circular money flows) in real-time. The graph database is the core engine of FraudGraph AI.

## 3. Graph Fundamentals
You must deeply understand graph theory: how networks are formed, traversed, and analyzed mathematically.

## 4. Nodes
The entities in our network. You must define the labels (e.g., `:Account`, `:Device`, `:IP`).

## 5. Edges
The relationships connecting the nodes. You must define the types and directions (e.g., `[:TRANSFERRED_TO]`, `[:LOGGED_IN_FROM]`).

## 6. Directed Graphs
Financial networks are directed. Money flows *from* A *to* B. You must understand how edge direction impacts queries and algorithms.

## 7. Weighted Graphs
Edges have properties. A transfer of $10 is different from a transfer of $10,000. You must understand how algorithms handle edge weights.

## 8. Temporal Graphs
Transactions happen at specific times. You must understand how to model time in a graph (e.g., storing timestamps on edges) so we can query chronological sequences.

## 9. Heterogeneous Graphs
Our graph is not just accounts sending money to accounts. It involves devices, IPs, and merchants. You must design a schema that handles multiple node and edge types gracefully.

## 10. Knowledge Graphs
Understand how integrating various data silos (user profiles, transaction logs, device telemetry) creates a semantic knowledge graph that provides a 360-degree view of an entity.

## 11. Financial Network Modeling
You must document the exact Neo4j schema: What are the node properties? What are the edge properties? What indexes are required for fast querying?

## 12. Neo4j Concepts
Understand the architecture of Neo4j, why it is a "native" graph database, and how index-free adjacency allows for lightning-fast traversals.

## 13. Cypher Concepts
Cypher is your primary language. You must master pattern matching: `MATCH (a:Account)-[r:TRANSFERRED]->(b:Account)`.

## 14. Graph Queries
You need to design queries that the Backend will use. For example: "Find all accounts that share an IP address with this specific account."

## 15. Graph Features
You are responsible for generating structural metrics that Vinayak (ML) will use. This includes degree counts, multi-hop counts, and algorithmic outputs.

## 16. Centrality
Understand algorithms like PageRank or Betweenness Centrality to identify "hub" accounts (often mules) routing large amounts of money.

## 17. Communities
Fraud rings act as dense clusters. You must understand how to find groups of nodes that interact with each other more than the rest of the network.

## 18. Louvain
A highly efficient algorithm for community detection based on modularity optimization.

## 19. Leiden
An improvement over Louvain that guarantees well-connected communities, often used in modern graph analytics.

## 20. Money-Flow Analysis
Understanding how to trace the source and destination of funds through multiple intermediaries.

## 21. Multi-Hop Relationships
Writing queries that look 3, 4, or 5 steps away (e.g., `MATCH (a)-[*1..4]->(d)`).

## 22. Suspicious Subgraphs
Defining the structural signatures of fraud (e.g., finding cycles: `MATCH p=(a)-[*3..5]->(a)`).

## 23. Dynamic Graphs
Understanding that the graph constantly updates. How do you recalculate features when new transactions arrive?

## 24. How Your Work Supports ML
Vinayak's XGBoost models cannot see the network. You must extract structural features (e.g., "PageRank score") and provide them as tabular columns for his models.

## 25. How Your Work Supports GNN
Priyanshi's GNN requires the graph structure (adjacency matrix) to perform message passing. You build the environment her models learn from.

## 26. What You Should Research
- Best practices for modeling financial data in Neo4j.
- The Neo4j Graph Data Science (GDS) library.
- Cypher query optimization for large datasets.

## 27. What You Should Document
- The complete Neo4j Entity-Relationship diagram.
- 5-10 critical Cypher queries for fraud patterns (Cycles, Fan-In, Shared Devices).
- A list of Graph Algorithms to be executed for feature engineering.

## 28. Dependencies
You depend on **Sayansh** to define the raw data. 
**Vinayak**, **Priyanshi**, and **Deekshant** all depend on your graph structure and queries.

## 29. Learning Roadmap
1. Graph Theory basics.
2. Neo4j architecture and Cypher syntax.
3. Graph Data Science (Centrality & Community detection).
4. Translating fraud typologies into Cypher patterns.

## 30. Questions You Should Answer
- "How do we model a transaction: as a node or an edge?"
- "What is the Cypher query to find a 3-hop money laundering cycle?"
- "How does Louvain community detection help find fraud rings?"

## 31. Documentation-Phase Definition of Done
- [ ] Graph Schema Diagram completed.
- [ ] Cypher query portfolio documented.
- [ ] Graph algorithmic strategy documented.
- [ ] NO IMPLEMENTATION CODE WRITTEN.
- [ ] NO NEO4J DATABASE INSTALLED OR CONFIGURED.

## 32. Future Implementation Responsibilities
In the next phase, you will deploy a Neo4j instance, write the scripts to ingest Sayansh's data, write the Cypher queries to extract features, and optimize the database for real-time querying.
