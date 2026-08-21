# PRIYANSHI: GNN / ADVANCED AI

## 1. Mission
Your mission is to design, understand, and eventually implement the Graph Neural Networks (GNNs) that detect complex topological fraud patterns. You are pushing the AI capabilities beyond traditional machine learning by allowing the models to learn directly from the network structure.

## 2. Neural Network Fundamentals
You must deeply understand deep learning concepts: tensors, backpropagation, loss functions (like Binary Cross-Entropy), activation functions (ReLU, Sigmoid), and gradient descent.

## 3. Why Graphs are Different from Tables
Standard neural networks expect a fixed-size input (e.g., a 256x256 image or a 10-column table). Graphs have arbitrary sizes and no fixed node ordering. You must understand permutation invariance and why CNNs/MLPs fail on graph structures.

## 4. GNN Fundamentals
You are studying architectures designed to operate on non-Euclidean graph data.

## 5. Message Passing
The core algorithm of GNNs. Nodes send their feature vectors along edges to their neighbors. You must understand how this iterative sharing allows a node to "see" further into the graph with each layer.

## 6. Neighborhood Aggregation
How a node combines the messages it receives (e.g., using Mean, Max, or Sum pooling) to update its own feature representation.

## 7. Node Features
The initial tabular data attached to a node before message passing begins (e.g., an account's age or balance).

## 8. Edge Features
Information contained on the edge (e.g., transaction amount, timestamp) that must be incorporated into the message passing step.

## 9. Node Classification
Your primary task. The GNN must output a probability (0 to 1) for specific nodes (e.g., predicting if an Account node is a mule).

## 10. Graph Classification
Predicting a label for an entire disconnected sub-graph (e.g., predicting if a cluster of 20 nodes is a coordinated fraud ring).

## 11. Graph Embeddings
The final output of the GNN layers before the classification head. A dense vector that mathematically represents the node's position and features in the network.

## 12. GraphSAGE
Graph SAmple and aggreGatE. You must study this architecture deeply. It scales to large graphs by sampling a fixed number of neighbors rather than processing the entire graph, making it ideal for dynamic financial networks.

## 13. GAT (Graph Attention Network)
You must understand Attention mechanisms. GAT learns to assign different weights to different neighbors. (e.g., It learns to ignore the edge to a local grocery store, but pays heavy attention to an edge connecting to a blacklisted IP).

## 14. Attention
The mathematical calculation (usually a softmax over neighbor similarities) that determines the edge weights in a GAT.

## 15. Heterogeneous GNN Concepts
Our graph has Accounts, Devices, and IPs. Standard GNNs treat all nodes the same. You must research models like HAN (Heterogeneous Graph Attention Network) that process different edge/node types differently.

## 16. Temporal GNN Concepts
Fraud happens in sequences. You must research how to incorporate time into GNNs (e.g., TGN - Temporal Graph Networks) so the model understands the order of transactions.

## 17. Training Graph Models
Understanding inductive vs. transductive learning, mini-batching on graphs (using tools like PyTorch Geometric's NeighborLoader), and train/val/test masking.

## 18. Leakage
Ensuring message passing doesn't accidentally aggregate labels from the test set into the training set.

## 19. Class Imbalance
Adapting focal loss or weighted cross-entropy to handle the rare nature of fraud in GNN training.

## 20. Evaluation
Working with Vinayak to ensure the GNN is evaluated on the exact same PR-AUC and F1 metrics as the XGBoost baseline.

## 21. GNN Explainability
A massive research area. You must document how we can extract explanations from the GNN (e.g., using GNNExplainer or interpreting GAT attention weights) to show the investigator *which* neighbors caused the high risk score.

## 22. Relationship with Graph Engineering
You rely entirely on Srajan to provide the adjacency matrix and edge indices. If his graph topology is flawed, your GNN learns noise.

## 23. Relationship with Traditional ML
Your GNN predictions will be fused with Vinayak's XGBoost predictions in the final Risk Engine.

## 24. Research Papers
You must read and summarize the original papers for GraphSAGE, GAT, and recent surveys on GNNs for financial fraud detection.

## 25. What You Should Study
- PyTorch Geometric (PyG) concepts.
- Mini-batching on large graphs.
- GNNExplainer methodologies.

## 26. What You Should Document
- The conceptual architecture of the GNN (e.g., 2 layers of GraphSAGE + Classifier).
- How Heterogeneous nodes will be handled.
- How Attention weights will be translated into UI explanations.
- Summaries of key GNN architectures.

## 27. Dependencies
You depend on **Sayansh** and **Srajan** for the graph data.
**Deekshant** depends on you to provide a deployable model format (like TorchScript).

## 28. Learning Roadmap
1. Deep Learning basics (PyTorch).
2. GraphSAGE and GAT architectures.
3. Heterogeneous and Temporal Graph concepts.
4. GNN Explainability.

## 29. Questions You Should Answer
- "What is the difference between GraphSAGE and GCN?"
- "How does a GAT decide which neighbors are important?"
- "How do we prevent data leakage during message passing in a temporal graph?"

## 30. Documentation-Phase Definition of Done
- [ ] GNN Architecture Strategy documented.
- [ ] Handling of Heterogeneous data documented.
- [ ] GNN Explainability strategy documented.
- [ ] NO GNN MODELS TRAINED OR IMPLEMENTED.

## 31. Future Implementation Responsibilities
In the next phase, you will write the PyTorch/PyG code to build, train, evaluate, and save the GNN models.
