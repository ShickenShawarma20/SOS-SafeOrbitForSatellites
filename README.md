# FraudGraph AI

## 1. Project Overview

FraudGraph AI is an AI-Based Financial Fraud Network Detection Platform. In simple terms, it is a system designed to detect coordinated financial crimes by analyzing the connections between different entities (like people, accounts, and devices) rather than just looking at individual transactions in isolation.

Financial fraud is difficult to detect because modern fraudsters do not operate alone using a single account. They use sophisticated networks of mule accounts, stolen identities, and coordinated devices to move money. Traditional transaction-by-transaction systems struggle with this because they evaluate each transaction in a vacuum. A $500 transfer from Account A to Account B might look perfectly normal on its own. 

The central idea of FraudGraph AI is that **a financial transaction should not always be viewed as an isolated event.** Instead, it is part of a complex network involving:
- Accounts
- Customers
- Devices
- IP addresses
- Merchants
- Locations
- Transactions

By connecting these entities into a graph, we can reveal suspicious behavior that is invisible when looking at isolated data points. For example, if ten different accounts all log in from the same device and send money to the same overseas merchant, the network reveals the fraud.

---

## 2. Problem Statement

Traditional fraud detection systems often evaluate transactions independently:
- Transaction A (Looks normal)
- Transaction B (Looks normal)
- Transaction C (Looks normal)

But coordinated fraud is a network problem. It may look like this:
```text
Account A
   ↓
Account B
   ↓
Account C
   ↓
Merchant D
```
Or this (fan-in pattern):
```text
Account A ─┐
Account B ─┤
Account C ─┼──→ Mule Account
Account D ─┘
```
When analyzed independently, none of these transactions exceed typical risk thresholds. However, when viewed as a network, the coordinated movement of funds becomes obvious. Network-level analysis is required to catch modern, sophisticated fraud rings that traditional rule-based systems miss.

---

## 3. Proposed Solution

FraudGraph AI solves this problem through an integrated pipeline that transforms raw data into actionable graph intelligence. The complete conceptual system operates as follows:

**Transaction Data** → Raw events stream in.
**Data Processing** → Data is cleaned, normalized, and entities are extracted.
**Dynamic Financial Network** → Data is modeled as a continuously updating knowledge graph.
**Graph Analytics** → Algorithms detect communities, central nodes, and structural anomalies.
**Machine Learning** → Traditional models evaluate node and edge-level features.
**Graph Neural Network** → Advanced AI learns complex, multi-hop patterns directly from the network structure.
**Risk Fusion** → Scores from rules, ML, and GNNs are combined.
**Explainable Risk Score** → A final probability of fraud is generated along with the *reasons* why.
**Fraud Alert** → High-risk activity is flagged for review.
**Investigator** → A human analyst reviews the alert.
**Network Visualization** → The investigator visually explores the graph of connected entities.
**Case Management** → The investigation is documented and resolved.

---

## 4. MAJOR FRAUD PATTERNS

### Mule Accounts
- **Definition:** Accounts used by fraudsters to receive and launder illicit funds before moving them elsewhere.
- **Example:** A student receives $1000 from an unknown account and is told to forward $900 to another account, keeping $100 as a "fee."
- **Why suspicious:** High velocity of funds entering and immediately leaving an account with no clear economic purpose.
- **Graph representation:** A node with a high "in-degree" followed by a high "out-degree" within a short time window.
- **AI detection:** GNNs can learn the structural signature of a mule account within a broader network.
- **Investigator view:** A visual node acting as a bridge between a cluster of victims and an exit point.

### Fraud Rings
- **Definition:** Organized groups of criminals working together using multiple synthesized or stolen identities.
- **Example:** Fifty accounts created using stolen SSNs, all cross-transacting to build credit history.
- **Why suspicious:** Dense connections between accounts that should theoretically have no relationship.
- **Graph representation:** A tightly knit community of nodes (high clustering coefficient).
- **AI detection:** Community detection algorithms and GNNs identify unusually dense subgraphs.
- **Investigator view:** A hairball of highly connected accounts, devices, and IPs.

### Fan-In
- **Definition:** Multiple accounts sending money to a single destination account.
- **Example:** Ten different accounts transfer $500 each to one newly created account.
- **Why suspicious:** Often indicates the collection of scammed funds or the consolidation phase of money laundering.
- **Graph representation:** Multiple directed edges converging on a single node.
- **AI detection:** High in-degree centrality combined with temporal bursts.
- **Investigator view:** A star-shaped graph pointing inward.

### Fan-Out
- **Definition:** A single account sending money to multiple destination accounts.
- **Example:** A compromised corporate account sends small payments to 100 different unfamiliar accounts.
- **Why suspicious:** Often indicates the dispersion phase of money laundering or a mass payout from a stolen funding source.
- **Graph representation:** Multiple directed edges radiating outward from a single node.
- **AI detection:** High out-degree centrality.
- **Investigator view:** A star-shaped graph pointing outward.

### Circular Transactions
- **Definition:** Funds moving in a loop across multiple accounts.
- **Example:** A → B → C → A.
- **Why suspicious:** Used to artificially inflate account activity, build false credit, or obfuscate the source of funds.
- **Graph representation:** A directed cycle in the graph.
- **AI detection:** Cycle detection algorithms and path-length analysis.
- **Investigator view:** A visual loop of transactions.

### Multi-Hop Money Movement
- **Definition:** Money moving through several intermediary accounts before reaching its final destination.
- **Example:** Victim → Mule 1 → Mule 2 → Crypto Exchange.
- **Why suspicious:** Deliberate layering to hide the origin of funds.
- **Graph representation:** A long directed path with short time intervals between edges.
- **AI detection:** GNN message passing captures features from nodes multiple hops away.
- **Investigator view:** A chain of nodes showing the flow of money.

### Shared Device Fraud
- **Definition:** Multiple seemingly unrelated accounts operated from the same physical device.
- **Example:** 15 different bank accounts logged into using the same mobile phone.
- **Why suspicious:** Legitimate users rarely share a device with 14 other bank customers.
- **Graph representation:** Multiple Account nodes connected to a single Device node.
- **AI detection:** Graph topology reveals the shared connection, creating a feature for ML.
- **Investigator view:** A central Device node linked to many Account nodes.

### Shared IP Fraud
- **Definition:** Multiple accounts operating from the same risky or anomalous IP address.
- **Example:** Transactions for 20 US-based customers originating from a single IP in a high-risk country.
- **Why suspicious:** Indicates a single actor or botnet controlling multiple accounts.
- **Graph representation:** Multiple Account nodes connected to a single IP node.
- **AI detection:** Shared IP edge connections increase the risk score of connected accounts.
- **Investigator view:** A cluster of accounts linked to an IP address.

### Transaction Velocity
- **Definition:** An unusually high number or value of transactions in a short period.
- **Example:** 50 micro-transactions in 2 minutes.
- **Why suspicious:** Often indicates a script or bot testing stolen card details.
- **Graph representation:** Dense parallel edges (multiple transactions) between nodes with tight timestamps.
- **AI detection:** Temporal GNNs identify anomalies in edge creation frequency.
- **Investigator view:** A timeline view showing a sudden burst of activity.

### Geographic Anomalies
- **Definition:** Transactions occurring in physically impossible or highly unusual locations.
- **Example:** A card-present transaction in New York, followed 10 minutes later by one in London.
- **Why suspicious:** Impossible travel time indicates compromised credentials.
- **Graph representation:** Nodes connected to Location entities with conflicting temporal constraints.
- **AI detection:** Spatiotemporal features flag the anomaly.
- **Investigator view:** A map or node layout showing conflicting locations.

### Merchant Collusion
- **Definition:** A merchant working with fraudsters to process fake transactions.
- **Example:** Fraudsters use stolen cards to buy non-existent goods from a shell company they control.
- **Why suspicious:** Creates a closed loop of illicit profit.
- **Graph representation:** Many high-risk accounts connected to a specific Merchant node.
- **AI detection:** The Merchant node's embedding shifts due to the toxic neighborhood of connected accounts.
- **Investigator view:** A merchant node disproportionately linked to flagged accounts.

### Dormant Account Activation
- **Definition:** An account with no activity for a long time suddenly exhibiting high velocity.
- **Example:** An account inactive for 2 years suddenly receives and wires $50,000.
- **Why suspicious:** Indicates a "sleeper" account or an account takeover.
- **Graph representation:** A node with an isolated past suddenly forming many high-value edges.
- **AI detection:** Temporal shift detection in node behavior.
- **Investigator view:** A timeline showing the sudden structural change in the account's network.

---

## 5. PROJECT ENTITIES

In FraudGraph AI, data is modeled as entities and relationships:

- **Customer:** The human or business entity that owns accounts.
- **Account:** The financial container (e.g., checking, savings, credit card).
- **Transaction:** The event transferring value between accounts.
- **Device:** The physical hardware (phone, laptop) used to initiate activity.
- **IP Address:** The network location of the device.
- **Merchant:** The business receiving funds in a commercial transaction.
- **Location:** The physical or geographical area of the event.
- **Fraud Ring:** A logical grouping of entities involved in coordinated fraud.
- **Investigation Case:** The record of a human analyst's review of a suspicious network.

These relate to each other: A *Customer* owns an *Account*. An *Account* makes a *Transaction* using a *Device* at an *IP Address* to pay a *Merchant* at a *Location*.

---

## 6. GRAPH CONCEPT

- **What is a graph?** A mathematical structure used to model pairwise relations between objects.
- **What is a node?** Also called a vertex, it represents an entity (e.g., an Account or a Device).
- **What is an edge?** A link connecting two nodes, representing a relationship (e.g., "TRANSFERRED_TO" or "LOGGED_IN_WITH").
- **What is a directed graph?** A graph where edges have a direction (e.g., money flows *from* A *to* B).
- **What is a weighted graph?** A graph where edges have values (e.g., the amount of money transferred).
- **What is a temporal graph?** A graph where nodes and edges have timestamps (e.g., when the transaction occurred).
- **What is a heterogeneous graph?** A graph with different *types* of nodes and edges (e.g., Account nodes and Device nodes, linked by 'used' edges).
- **What is a dynamic graph?** A graph that changes over time as new transactions occur.

FraudGraph AI requires these concepts because financial fraud is fundamentally a dynamic, heterogeneous network of money movement.

---

## 7. KNOWLEDGE GRAPH

- **What is a knowledge graph?** A graph that captures knowledge by integrating data from various silos into a unified semantic network of entities and relationships.
- **How is it different from a normal relational database?** A relational database stores data in rigid tables linked by foreign keys, making deep relationship queries (like "find friends of friends of friends") very slow. A knowledge graph stores relationships natively, making network traversal instantaneous.
- **Why relationships matter?** In fraud, *who* you transact with is often more predictive of risk than *what* you transact.
- **Representing financial activity:** By turning rows of transaction logs into a knowledge graph, we instantly see the topology of fraud rings.

---

## 8. GRAPH DATABASE

- **What is Neo4j?** A popular native graph database designed to store and query highly connected data.
- **What is Cypher?** The query language for Neo4j (similar to how SQL is used for relational databases). It uses ASCII-art style syntax to describe patterns: `(Account A)-[:TRANSFERRED]->(Account B)`.
- **Why a graph database?** It allows us to query complex multi-hop paths (e.g., finding circular money flows in milliseconds), which would take hours and massive JOIN operations in a traditional SQL database.

---

## 9. MACHINE LEARNING

- **What is machine learning?** The use of algorithms and statistical models that enable computers to learn patterns from data without being explicitly programmed.
- **What is supervised learning?** Training a model on historical data that already contains the "answers" (labels).
- **What is classification?** The task of predicting which category an entity belongs to (e.g., "Fraud" vs. "Legitimate").
- **What are features?** The measurable properties or characteristics used as inputs to the model (e.g., transaction amount, account age).
- **What are labels?** The ground truth target variable the model tries to predict (e.g., 1 for Fraud, 0 for Legitimate).
- **What is a training dataset?** The data used to teach the model.
- **What is a test dataset?** Unseen data used to evaluate how well the model learned.
- **What is fraud probability?** A number between 0 and 1 indicating how likely the model thinks an event is fraudulent.
- **What is a risk score?** A scaled representation of fraud probability (e.g., 0 to 100) used for decision-making.

**Traditional Models:**
- **Logistic Regression:** A simple, interpretable model baseline.
- **Random Forest:** An ensemble of decision trees that handles non-linear patterns well.
- **XGBoost / LightGBM:** Highly optimized gradient boosting frameworks that typically dominate tabular data tasks.

**Why traditional ML is still useful:** Traditional ML is fast, interpretable, and excellent at analyzing tabular features. It serves as a powerful baseline and component in the final risk fusion process, complementing the GNNs.

---

## 10. GRAPH FEATURES

Graph analytics can extract topological metrics that become powerful *features* for traditional ML models:
- **Degree:** How many edges connect to a node.
- **Weighted degree:** The total sum of values (e.g., money) on connecting edges.
- **Fan-in:** Number of incoming edges.
- **Fan-out:** Number of outgoing edges.
- **Centrality:** How important or central a node is in the network (e.g., PageRank).
- **Transaction velocity:** Rate of edge creation over time.
- **Number of connected accounts / shared devices / shared IPs:** Structural counts.
- **Community membership:** Which cluster the node belongs to.
- **Path length:** The distance between nodes.
- **Multi-hop relationships:** Connections beyond direct neighbors.

---

## 11. GRAPH NEURAL NETWORKS

- **What is a neural network?** A computing system inspired by biological neural networks, consisting of layers of interconnected nodes (neurons) that learn representations of data.
- **Why normal neural networks struggle with graphs?** Standard NNs expect fixed-size, grid-like inputs (like images or tabular data). Graphs have arbitrary sizes, no fixed ordering, and complex topologies.
- **What is a GNN?** A Graph Neural Network is an architecture designed specifically to operate on graph-structured data.
- **What is message passing?** The core mechanism of GNNs where nodes iteratively exchange information (features) with their direct neighbors.
- **What is neighborhood aggregation?** Combining the messages received from neighbors to update a node's own representation.
- **What is node classification?** Predicting the label (e.g., fraud) of a specific node in the graph.
- **What is a graph embedding?** A dense, low-dimensional vector representation of a node that captures both its features and its structural position in the network.

**GNN Architectures:**
- **GraphSAGE:** Samples a fixed number of neighbors and aggregates their features, making it highly scalable for large, dynamic graphs.
- **GAT (Graph Attention Networks):** Uses attention mechanisms to weigh the importance of different neighbors (e.g., paying more attention to a suspicious shared device than a benign shared merchant).

**Why GNNs?** They learn complex, non-linear network patterns automatically. While traditional ML requires humans to manually engineer graph features (like calculating PageRank), GNNs learn the optimal structural representations directly from the raw graph.

---

## 12. TEMPORAL GRAPH INTELLIGENCE

- **Why time matters:** Fraud is a sequence of events. A network snapshot misses the story.
- **Example:**
  `A → B (10:01)`
  `B → C (10:02)`
  `C → D (10:04)`
- **Sequence importance:** This rapid chronological chain strongly suggests money laundering or automated money movement. If the times were reversed, it would just be random transactions.
- **Concepts:**
  - **Temporal graphs:** Graphs where edges exist only at specific times.
  - **Transaction sequences:** The ordered flow of events.
  - **Velocity and Burst behavior:** Sudden spikes in graph activity.
  - **Time-aware fraud detection:** Using temporal GNNs (like TGNs) to model the evolution of the graph over time.

---

## 13. RISK SCORING

FraudGraph AI relies on **Risk Fusion**, combining multiple signals:
- **Rule score:** Heuristics (e.g., if velocity > 100, score = high).
- **ML score:** Tabular model output based on engineered features.
- **Graph score:** Algorithmic risk based on centrality and community.
- **GNN score:** Neural network prediction based on structural embeddings.

**Example Fusion:**
- Rule = 0.90
- ML = 0.91
- Graph = 0.93
- GNN = 0.95

These scores are conceptually ensembled (e.g., via logistic regression or a weighted average) to produce a final, robust risk score that minimizes false positives. *(Note: No particular weighting is claimed as universally optimal; it requires tuning based on data).*

---

## 14. EXPLAINABLE AI

Saying "Fraud probability = 95%" is **not enough**. Investigators need to know *why* to take action.
- **Prediction:** The output score.
- **Explanation:** The evidence justifying the score.

**Examples of Explanations:**
- "12 accounts share a device."
- "High transaction velocity."
- "Suspicious 3-hop money flow detected."
- "Account belongs to a high-risk community."

**Methods:**
- **SHAP concept:** Quantifies the contribution of each individual feature to the final prediction.
- **Graph evidence:** Highlighting the specific nodes and edges (e.g., attention weights in GAT) that triggered the GNN.
- **Human-readable evidence:** Translating AI tensors into English sentences for the investigator.

---

## 15. REAL-TIME ANALYTICS

To stop fraud, the system must conceptually operate in real-time:
`Transaction event` → `Processing` → `Graph update` → `Feature update` → `Model inference` → `Risk score` → `Alert`

- **Kafka / Message Broker:** Conceptual systems to handle high-throughput streams of transaction events.
- **Producer:** Generates the transaction events.
- **Consumer:** Reads the events for processing.
- **Stream processing:** Updating graph state and running models on the fly.

---

## 16. BACKEND

- **What is a backend?** The server-side logic that powers the system, handles data, and serves the frontend.
- **What is an API?** Application Programming Interface; how the frontend talks to the backend.
- **What is REST?** A standard architectural style for APIs.
- **What is FastAPI?** A modern, fast web framework for building APIs with Python.
- **Conceptual Role:** The backend orchestrates the ML models, queries the graph database, processes risk scoring, and serves case data and graph visualizations to the frontend via endpoints.

---

## 17. FRONTEND

- **What is React?** A popular JavaScript library for building user interfaces.
- **What is an investigator dashboard?** The UI where human fraud analysts review alerts.
- **What should an investigator see?**
  - **Dashboard:** High-level metrics and queue of alerts.
  - **Alert list:** Prioritized list of suspicious entities.
  - **Risk score & Evidence panel:** The explainable AI output.
  - **Network graph:** Visual representation of the fraud ring.
  - **Transaction timeline:** Chronological view of events.
  - **Entity profile:** Details on a specific customer or account.
  - **Case management:** Tools to approve, reject, or escalate cases.

---

## 18. GRAPH VISUALIZATION

A graph visualization tool helps investigators comprehend complex networks instantly.
- **Node size:** Could indicate transaction volume or risk score.
- **Node type:** Differentiated by colors/icons (Account, Device, IP).
- **Edge direction:** Arrows showing money flow.
- **Edge weight:** Thickness showing the amount of money.
- **Timeline:** A slider to watch the graph evolve over time.
- **Filtering & Expansion:** The ability to hide irrelevant nodes or double-click to "expand" and see an entity's neighbors (multi-hop investigation).

---

## 19. CYBERSECURITY

Financial systems require maximum security. Conceptual pillars include:
- **Authentication:** Verifying who the investigator is.
- **Authorization & Role-based access:** Ensuring they only see what they are allowed to see.
- **Audit logs:** Tracking every action taken by the investigator.
- **Input validation:** Preventing injection attacks.
- **Secrets management:** Securely storing database passwords and API keys.
- **Data privacy & Encryption:** Protecting PII (Personally Identifiable Information) in transit and at rest.
- **Least privilege:** Granting systems and users only the minimum permissions necessary.

---

## 20. EVALUATION

- **Accuracy:** (Correct predictions / Total predictions). **Why it is insufficient:** If fraud is 0.1% of transactions, a model that simply guesses "Not Fraud" every time is 99.9% accurate but completely useless.
- **Precision:** Of all the transactions flagged as fraud, how many were actually fraud?
- **Recall:** Of all the actual fraud in the system, how many did we successfully catch?
- **F1 Score:** The harmonic mean of Precision and Recall.
- **ROC-AUC & PR-AUC:** Metrics evaluating the model's performance across different threshold settings. PR-AUC is especially important for highly imbalanced data like fraud.
- **Confusion Matrix:** A table showing True Positives, False Positives, True Negatives, and False Negatives.
- **False Positive:** A legitimate customer wrongly flagged as fraud (causes customer friction).
- **False Negative:** A fraudster that slipped through (causes financial loss).

---

## 21. PROJECT DIFFERENTIATION

FraudGraph AI is differentiated by its holistic approach. It is not just another tabular transaction classifier. 
Instead, it integrates:
**Network Architecture + Temporal Behavior + Traditional ML + GNNs + Explainability + Human-centric Investigation UI.**

While inspired by existing academic research and industry best practices, the integration of these components into a seamless, explainable end-to-end platform is what makes FraudGraph AI powerful.

---

## 22. RESEARCH BACKGROUND

This project draws upon several active research areas:
- **Graph-based fraud detection & AML (Anti-Money Laundering) graph analytics.**
- **Financial transaction networks.**
- **GNN fraud detection** (using network topology for classification).
- **Temporal GNNs** (accounting for time in graphs).
- **Heterogeneous graph learning** (handling different entity types).
- **Explainable graph learning.**

Relevant public datasets and research directions include IBM AMLSim, the Elliptic dataset, and Elliptic2. While FraudGraph AI learns from these concepts, the system architecture is custom-designed for broader multi-entity intelligence.

---

## 23. COMPLETE SYSTEM ARCHITECTURE

**Conceptual Architecture Diagram:**

```text
       [ TRANSACTION DATA STREAM ]
                  ↓
       [ DATA PROCESSING LAYER ]
      (Normalization, Entity Extraction)
                  ↓
     [ DYNAMIC FINANCIAL NETWORK ]
   (Knowledge Graph / Graph Database)
                  ↓
       [ FEATURE ENGINEERING ]
   (Graph Analytics & Node Topology)
                  ↓
       [ ML & AI MODELING ]
    [ Traditional ML ] + [ GNNs ]
                  ↓
          [ RISK ENGINE ]
           (Risk Fusion)
                  ↓
       [ EXPLAINABILITY LAYER ]
      (SHAP, Graph Evidence)
                  ↓
           [ ALERTING ]
                  ↓
       [ INVESTIGATION UI ]
(Dashboard, Graph Vis, Case Management)
```
- Raw data is processed into a dynamic graph.
- Features are extracted and passed to both traditional ML and GNN models.
- The Risk Engine fuses scores and queries the Explainability layer.
- High-risk scores trigger alerts pushed to the Frontend UI for human investigation.
