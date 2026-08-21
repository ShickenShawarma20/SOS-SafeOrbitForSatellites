# SAYANSH: DATA ENGINEERING + RESEARCH

## 1. Role Overview
You are the Data Engineer and Researcher for FraudGraph AI. You are responsible for understanding the domain data, generating the foundational scenarios, defining the network schema, and researching the datasets that will drive the machine learning models.

## 2. Mission
Your mission is to understand how financial data flows, how fraud is represented in raw data, and to design the data architecture that transforms raw logs into a rich graph format. Without your data pipeline, the rest of the team has nothing to analyze or model.

## 3. Why Your Role Matters
Graph models and GNNs are entirely dependent on the quality of the underlying data structure. If the transaction data does not correctly link to devices, IPs, and accounts, the network topology will be broken, and the AI will fail. You provide the "ground truth."

## 4. Concepts You Need to Understand
You must deeply understand relational data, event streaming, data cleaning, and how tabular data transforms into graph edges and nodes.

## 5. Financial Data Fundamentals
You need to document what real-world banking data looks like. What fields exist in a typical transaction ledger? (e.g., Sender ID, Receiver ID, Timestamp, Amount, Currency, Device Fingerprint, Session IP).

## 6. Transaction Data
A transaction is not just an amount. It is an event that occurs in time. You need to understand how to structure this event data so it can be effectively parsed into a network.

## 7. Entities
You define the entities of the system:
- Customers
- Accounts
- Devices
- IPs
- Merchants
You must document the attributes (features) each of these entities possess.

## 8. Synthetic Data
Because real financial data is protected by privacy laws, you must research how to generate realistic synthetic data. This data must contain both normal traffic and hidden fraud patterns.

## 9. Ground Truth
You are responsible for defining the "labels" (1 for Fraud, 0 for Legitimate) in the synthetic data so the ML engineers can train their models.

## 10. Fraud Scenario Generation
You must understand and document how to mathematically or logically simulate:
- Money laundering cycles
- Mule account fan-ins
- Account takeovers via shared IPs

## 11. Data Quality
You need to understand missing values, malformed timestamps, and duplicate transactions, and how to handle them before they reach the graph database.

## 12. Data Validation
How do we prove the synthetic data accurately reflects the real world? You must document the statistical properties the data should exhibit.

## 13. Feature Engineering
While Vinayak will engineer ML features, you are responsible for the raw data extraction that makes feature engineering possible (e.g., parsing dates, normalizing currencies, geo-locating IPs).

## 14. Event Streaming
Understand the concept of continuous data flow rather than static CSV files. Real fraud detection happens in real-time.

## 15. Kafka Concepts
Understand what Apache Kafka is: Topics, Producers, and Consumers. Document how a transaction event streams conceptually into the pipeline.

## 16. Research Methodology
You are the primary researcher. You must adopt a rigorous approach to studying existing literature and datasets.

## 17. Literature Review
You must read and summarize how other researchers have tackled graph-based AML and fraud detection.

## 18. Dataset Research
Investigate publicly available datasets and simulators (e.g., IBM AMLSim, Elliptic). Document their schemas, strengths, and weaknesses.

## 19. Existing Projects
Look for open-source implementations of GNN fraud detection. Document what they did right and what FraudGraph AI can do better.

## 20. Research Papers
Find key academic papers on Temporal GNNs and Heterogeneous Graph learning in finance. Extract the core ideas for the team.

## 21. What You Should Investigate
- How does IBM AMLSim generate data?
- What are the most common schema designs for financial graphs?
- How is event streaming handled in modern fintech architectures?

## 22. What You Should Document
- A complete schema of all raw data tables.
- A mapping of how raw tables convert to Graph Nodes and Edges.
- Summaries of 3-5 relevant research papers.
- An analysis of IBM AMLSim.

## 23. What Your Work Provides to Other Members
- You provide the graph schema to **Srajan** (Graph Engineering).
- You provide the clean tabular datasets to **Vinayak** (ML Engineering).
- You provide the research foundation for **Priyanshi** (GNN).

## 24. Dependencies
You are at the very beginning of the pipeline. Everyone is dependent on your conceptual data design. You depend on the team's feedback to ensure you are providing the fields they need.

## 25. Learning Roadmap
1. Relational Databases vs. Graph Models
2. Financial Transaction Schemas
3. Synthetic Data Generation (IBM AMLSim)
4. Event Streaming (Kafka basics)

## 26. Questions You Should Be Able to Answer
- "What fields are required to connect an account to a device?"
- "How do we represent a money laundering cycle in a CSV file?"
- "Why can't we just use the Elliptic dataset out of the box?"

## 27. Definition of Done (Documentation Phase)
- [ ] Raw Data Schema documented.
- [ ] Node/Edge Mapping documented.
- [ ] IBM AMLSim research summary completed.
- [ ] Literature review of 3 key papers documented.
- [ ] NO IMPLEMENTATION CODE WRITTEN.

## 28. Future Implementation Responsibilities
In the next phase, you will write the Python scripts to generate or parse the synthetic dataset, clean it using pandas, and potentially simulate the Kafka producer stream.
