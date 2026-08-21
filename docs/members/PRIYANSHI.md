# PRIYANSHI: GNN / ADVANCED AI

## 🎯 Your Main Goal
Your goal is to build the most advanced part of our system: a Graph Neural Network (GNN). While normal models look at individual rows of data, your model looks at the entire shape of the network to find hidden fraud patterns.

## 🧠 What You Need to Learn
- **Graph Neural Networks (GNNs):** How neural networks can actually learn from network shapes instead of just flat images or text.
- **Message Passing:** The core idea of GNNs where connected nodes "talk" to each other to share information about their risk.
- **GraphSAGE:** A specific type of GNN that is great for large networks because it only samples a few neighbors at a time instead of the whole graph.
- **Graph Attention (GAT):** A type of GNN that learns which connections are actually suspicious (e.g., paying more attention to a shared IP address than a shared grocery store).
- **Graph Explainability:** How to highlight the exact connections in the network that made your AI suspicious.

## 🤝 How You Fit Into the Team
- **You rely completely on Srajan** to provide the network structure.
- **Your score is combined with Vinayak's score** to make the final decision.

## 📝 What You Have to Do RIGHT NOW (Documentation Phase)
- Read up on GraphSAGE and GAT, and write a simple summary of how we will use them.
- Document how your model will figure out which neighbors are suspicious (Explainability).
- **Do not train any neural networks or write code yet!** Just document the plan.

## 🚀 What You Will Build LATER (Implementation Phase)
- Write the PyTorch code to build and train the GNN.
- Export the trained model so the backend can use it.
