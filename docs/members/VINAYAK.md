# VINAYAK: ML ENGINEERING

## 🎯 Your Main Goal
Your goal is to build our first line of defense: a Machine Learning model (like XGBoost) that looks at an account or transaction and scores its risk of being fraud.

## 🧠 What You Need to Learn
- **Classification:** How an AI learns to label something as "Fraud" (1) or "Legitimate" (0).
- **XGBoost:** A very powerful algorithm for tabular (spreadsheet) data. It's the industry standard for this type of work.
- **Class Imbalance:** In real life, 99.9% of transactions are legitimate. You need to learn how to train an AI when there is almost no fraud data to learn from.
- **Explainable AI (SHAP):** You can't just say "95% fraud." You need to learn how to use SHAP to tell the investigator *why* it's fraud (e.g., "Because the account is 1 day old and sent $10,000").
- **Metrics (PR-AUC):** Why standard "accuracy" is a bad way to measure a fraud model, and what metrics to actually use instead.

## 🤝 How You Fit Into the Team
- **You get flat data from Sayansh** and **network features from Srajan**.
- **You combine your model's score with Priyanshi's GNN score** to create the final Risk Engine.
- **You provide the explainable AI reasons to Deekshant** so he can send them to the frontend.

## 🛠️ Features & Domain Responsibility
- Baseline AI rules and tabular feature extraction
- XGBoost classification model for tabular/spreadsheet data
- Class imbalance handling strategies
- Explainable AI using SHAP values
- Model evaluation metrics (e.g., PR-AUC)

## 📋 Step-by-Step Tasks
1. **Step 1 (Documentation):** Write down a list of "Features" your model will use (e.g., Transaction Velocity, Account Age, Number of Connections).
2. **Step 2 (Documentation):** Document how you plan to evaluate if your model is actually working (Metrics like PR-AUC).
3. **Step 3 (Implementation):** Write the Python code to train the XGBoost model.
4. **Step 4 (Implementation):** Write the code that generates the SHAP explanations for the frontend.
