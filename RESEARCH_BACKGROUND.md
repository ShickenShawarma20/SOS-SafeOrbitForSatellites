# RESEARCH BACKGROUND

To build FraudGraph AI, the team must understand the existing landscape of financial fraud detection research, datasets, and methodologies. This document outlines the current state-of-the-art and how our proposed system integrates these concepts.

## 1. The Evolution of Fraud Detection

### Traditional Fraud Detection
Historically, fraud detection relied on **Rule-Based Systems**. Analysts wrote manual rules (e.g., `IF amount > $10,000 AND location = 'Foreign' THEN Alert`). While highly interpretable, these systems are rigid, suffer from high false-positive rates, and cannot adapt to evolving fraud tactics.

### Machine Learning in Anti-Money Laundering (AML)
The industry transitioned to tabular Machine Learning (Random Forests, XGBoost) to evaluate individual transactions based on engineered features (e.g., velocity, account age). While a massive improvement over rules, these models suffer from "network blindness"—they evaluate a transaction without understanding the complex multi-hop topology surrounding it.

## 2. Graph-Based Fraud Detection

### Graph Analytics
Researchers began mapping financial logs into databases (like Neo4j) to extract structural features:
- **Centrality metrics** to find key mules.
- **Community detection (Louvain/Leiden)** to identify fraud rings.
These engineered graph features were then fed into traditional ML models, significantly improving precision and recall.

### Graph Neural Networks (GNNs)
The breakthrough in recent years is the application of GNNs. Instead of humans manually calculating graph metrics, GNNs (like GraphSAGE and GAT) learn the optimal structural embeddings directly via message passing.
- **GraphSAGE:** Pioneered scalable learning on large graphs by sampling neighbors.
- **GAT (Graph Attention Networks):** Allowed models to weigh the importance of different neighbors (e.g., a shared fraudulent IP is weighted heavier than a shared generic merchant).

### Temporal Graph Learning
Because fraud is inherently chronological, researchers developed Temporal GNNs (TGNs). A temporal graph understands that money flowing A → B then B → C is highly suspicious, whereas B → C then A → B might just be a coincidence.

### Heterogeneous Graph Learning
Financial networks are not homogenous. They contain different node types (Accounts, Devices, Merchants) and edge types (Transfers, Logins). Heterogeneous GNNs (like HAN - Heterogeneous Graph Attention Network) are designed to process these varying semantics, which is crucial for FraudGraph AI.

## 3. Explainable AI (XAI) in Graphs

A major hurdle for AI in finance is regulatory compliance. Investigators cannot act on "black box" predictions.
- **Tabular XAI:** SHAP (SHapley Additive exPlanations) is widely used to explain XGBoost models by attributing feature importance.
- **Graph XAI:** Explaining GNNs is an active research area (e.g., GNNExplainer). It involves highlighting the specific sub-graph (nodes and edges) that maximally contributed to the model's prediction.

## 4. Relevant Datasets

Because real financial data is strictly confidential, researchers rely on specific public datasets and simulators:

### IBM AMLSim
A sophisticated simulator built by IBM and MIT that generates synthetic multi-agent financial networks containing known money laundering typologies (fan-in, fan-out, cycles). It is highly relevant for generating the synthetic data FraudGraph AI will eventually need.

### The Elliptic Dataset
One of the most famous graph-based financial datasets. It maps Bitcoin transactions, where nodes are transactions and edges are the flow of Bitcoin. The goal is to classify nodes as "licit" or "illicit".

### Elliptic2 Dataset
A more recent evolution of the Elliptic dataset that focuses on sub-graph detection and more complex entity clustering in the cryptocurrency space.

*(Important Note: While these datasets deal with cryptocurrency or pure transaction nodes, FraudGraph AI aims to model a broader heterogeneous retail banking graph including Devices and IPs.)*

## 5. Existing Open-Source Projects

There are numerous open-source repositories and papers demonstrating GNNs on the Elliptic dataset using frameworks like PyTorch Geometric (PyG) and DGL (Deep Graph Library). 

## 6. Our Proposed Integration (Differentiation)

**Important:** We do not claim that using a GNN for fraud detection is a novel invention. It is a well-established academic concept.

The differentiation of **FraudGraph AI** lies in the *system integration*. We are not just training a model in a Jupyter notebook; we are conceptually designing an end-to-end platform that combines:
1. Heterogeneous Graph Construction (Neo4j)
2. Tabular ML + GNN Ensembles (Risk Fusion)
3. Explainable AI Outputs
4. A Human-in-the-loop Investigation UI (React/Cytoscape)

By synthesizing these advanced research concepts into a unified investigator tool, FraudGraph AI bridges the gap between academic graph AI and practical financial operations.
