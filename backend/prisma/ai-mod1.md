# Module 1 — ML Fundamentals: Training, Evaluation, Overfitting

## What You'll Actually Do

You'll build a classification model from scratch, evaluate it properly, and diagnose why it's failing. No toy datasets—real preprocessing, real metrics, real problems.

## Content

### The Training Loop

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
```

### Overfitting in Practice

Overfitting means your model memorized the training data instead of learning patterns.

```python
from sklearn.model_selection import learning_curve

train_sizes, train_scores, val_scores = learning_curve(
    model, X_train, y_train, cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10),
    scoring='accuracy'
)

# If train_scores >> val_scores, you're overfitting
```

### Cross-Validation

Never trust a single train/test split.

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5, scoring='f1')
print(f"F1: {scores.mean():.3f} ± {scores.std():.3f}")
```

### Regularization

```python
from sklearn.linear_model import LogisticRegression

# L1 regularization (feature selection)
model_l1 = LogisticRegression(penalty='l1', C=0.1, solver='liblinear')

# L2 regularization (weight shrinkage)
model_l2 = LogisticRegression(penalty='l2', C=0.1)
```

### Metrics That Matter

```python
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Accuracy is misleading with imbalanced classes
print(f"Accuracy:  {accuracy_score(y_test, y_pred):.3f}")
print(f"Precision: {precision_score(y_test, y_pred):.3f}")
print(f"Recall:    {recall_score(y_test, y_pred):.3f}")
print(f"F1:        {f1_score(y_test, y_pred):.3f}")
print(f"ROC AUC:   {roc_auc_score(y_test, y_prob):.3f}")
```

## Assessment

**Lab: Build and Evaluate a Classifier**

Use the breast cancer dataset from `sklearn.datasets`. Train a Decision Tree, a Random Forest, and a Logistic Regression. Compare their performance across 5-fold cross-validation using accuracy, precision, recall, and F1. Identify which model overfits and explain why.

- Time: 45 minutes
- Grading: Correct implementation (40%), proper cross-validation (30%), overfitting diagnosis with justification (30%)

## Evidence

Upload your notebook with all three models, the cross-validation results table, and a written analysis of which model overfits and what you'd do to fix it.
