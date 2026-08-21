# VINAYAK: ML ENGINEERING

## 1. Mission
Your mission is to build, evaluate, and optimize the traditional machine learning models (like XGBoost) that serve as the baseline risk engine. You will engineer features, handle data imbalance, and provide interpretable ML scores that fuse with the GNN outputs.

## 2. ML Fundamentals
You must deeply understand how statistical learning works, the bias-variance tradeoff, and how models optimize loss functions.

## 3. Classification
Your primary task is binary classification: predicting whether a transaction or account is Fraud (1) or Legitimate (0).

## 4. Features
You will consume the raw data (from Sayansh) and the graph metrics (from Srajan) to construct a powerful feature matrix (tabular data) for training.

## 5. Labels
You must understand the ground truth labels. If the data is synthetic, you must ensure the labels perfectly map to the simulated fraud scenarios.

## 6. Training
Understanding how to feed data into models like XGBoost, hyperparameter tuning, and cross-validation strategies.

## 7. Validation
Ensuring the model learns generalizable patterns rather than memorizing the training data.

## 8. Testing
Evaluating the final model on a strict, held-out test set to simulate real-world performance.

## 9. Data Leakage
A critical concept: ensuring the model does not accidentally have access to future information or the target label during training (e.g., using an account's total lifetime fraud volume to predict its first transaction).

## 10. Class Imbalance
Fraud data is highly skewed (e.g., 99.9% legitimate). You must research techniques like SMOTE, class weighting, and under-sampling to ensure the model doesn't just guess "0" every time.

## 11. Logistic Regression
The baseline model. Highly interpretable, fast, and good for establishing a minimum performance benchmark.

## 12. Random Forest
An ensemble of decision trees. Good for capturing non-linear relationships without heavy tuning.

## 13. XGBoost
Extreme Gradient Boosting. The industry standard for tabular data. You must master this algorithm.

## 14. LightGBM
A faster alternative to XGBoost that handles large datasets efficiently.

## 15. Feature Engineering
Creating derived variables, such as:
- Time since last transaction
- Ratio of outgoing to incoming funds
- Velocity of transactions in the last hour

## 16. Graph Features
Incorporating Srajan's work. Adding columns like "PageRank" and "Community ID" to your XGBoost feature matrix to give it network awareness.

## 17. Risk Scores
Converting raw model probabilities (0.0 to 1.0) into business-friendly risk scores (e.g., 0 to 100).

## 18. Thresholds
Determining the exact probability cutoff where an alert is generated. Balancing the cost of a false positive vs. a false negative.

## 19. Precision
If you predict 100 frauds, how many are actually fraud? High precision means investigators waste less time.

## 20. Recall
Out of 100 actual frauds, how many did you catch? High recall means less money lost.

## 21. F1
The harmonic mean of Precision and Recall. A balanced metric.

## 22. PR-AUC
Precision-Recall Area Under the Curve. **The most important metric** for highly imbalanced fraud datasets.

## 23. ROC-AUC
Receiver Operating Characteristic. Useful, but can be overly optimistic in imbalanced datasets.

## 24. Confusion Matrix
Visualizing True Positives, False Positives, True Negatives, and False Negatives.

## 25. Calibration
Ensuring a model's predicted probability of 0.8 actually means there is an 80% chance of fraud in reality.

## 26. Model Comparison
Documenting how you will statistically compare Logistic Regression, Random Forest, and XGBoost against Priyanshi's GNN.

## 27. Explainability
Researching SHAP (SHapley Additive exPlanations). You must provide the logic to explain *why* XGBoost made a specific prediction so the frontend can display it.

## 28. How ML Connects with Graph Engineering
You rely on Srajan to compute complex structural features (like centrality) that you cannot easily calculate in pandas.

## 29. How ML Connects with GNN
Your model will be fused with Priyanshi's model. XGBoost excels at tabular features; GNNs excel at topological features. Together, they create a robust Risk Engine.

## 30. Research Topics
- Handling extreme class imbalance in financial data.
- SHAP value generation for tree-based models.
- Techniques for temporal cross-validation (time-series split).

## 31. What You Should Document
- The full list of engineered features (Tabular + Graph).
- The evaluation strategy (Metrics and Cross-Validation setup).
- The model comparison framework.
- How SHAP will be used.

## 32. Dependencies
You depend heavily on **Sayansh** for data and **Srajan** for graph features. 
**Deekshant** depends on your models to build the API.

## 33. Learning Roadmap
1. XGBoost internals and hyperparameter tuning.
2. Imbalanced classification metrics (PR-AUC).
3. SHAP and Explainable AI.
4. Model calibration and threshold tuning.

## 34. Questions You Should Answer
- "Why shouldn't we use standard Accuracy to evaluate our fraud model?"
- "What is data leakage, and how do we prevent it in a time-series dataset?"
- "How does SHAP explain an XGBoost prediction?"

## 35. Documentation-Phase Definition of Done
- [ ] Feature Engineering strategy documented.
- [ ] Evaluation framework (Metrics, CV strategy) documented.
- [ ] SHAP implementation strategy documented.
- [ ] NO MODELS TRAINED OR IMPLEMENTED.

## 36. Future Implementation Responsibilities
In the next phase, you will write the Python code (using scikit-learn and xgboost) to train, evaluate, and save the models, and generate the SHAP explainer objects.
