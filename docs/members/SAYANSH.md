# SAYANSH: DATA ENGINEERING + RESEARCH

## 🎯 Your Main Goal
You are the foundation of the project. Your goal is to figure out what our fake banking data should look like, how to generate it, and how to organize it so the rest of the team can use it. 

## 🧠 What You Need to Learn
- **Financial Data:** What information is actually in a bank transaction? (Sender, Receiver, Amount, Time, Device, IP).
- **Synthetic Data Generation:** Since real bank data is private, how can we use tools like IBM AMLSim to create fake data that still has hidden fraud rings in it?
- **Data Schemas:** How to organize raw CSV or database tables so they can easily be turned into a network graph.
- **Event Streaming:** The basics of Apache Kafka—how data flows continuously instead of just sitting in a static file.

## 🤝 How You Fit Into the Team
- **You provide data structure to Srajan** so he can build the Neo4j graph database.
- **You provide clean data to Vinayak and Priyanshi** so they can train their AI models.

## 📝 What You Have to Do RIGHT NOW (Documentation Phase)
- Define the exact columns our data will have (Customer, Account, Device, Transaction).
- Write down how a specific fraud pattern (like money laundering) will look in our data.
- Read up on the IBM AMLSim simulator and summarize how we can use it.
- **Do not write any code yet!** Just document the plan.

## 🚀 What You Will Build LATER (Implementation Phase)
- Write Python scripts to generate or clean the synthetic dataset.
- Build the data pipeline that feeds raw transactions into the rest of the system.
