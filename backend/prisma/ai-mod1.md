# Module 1: ML Fundamentals

## Why Most Models Fail Before They Leave the Notebook

The gap between a working Jupyter notebook and a model that actually serves predictions is enormous. Most ML practitioners learn the mechanics of training a modelfit, predict, scorewithout ever understanding why their model fails when it encounters data it has never seen. This module strips away the abstractions and forces you to confront the fundamental mechanics of how models learn, how they fail, and how you diagnose those failures before they become production incidents.

You will build a classifier from scratch on a real dataset, not a clean benchmark. You will encounter missing values, class imbalance, and features that correlate in ways that produce misleading accuracy scores. By the end, you will be able to look at a model's training curve and immediately identify whether it is underfitting, overfitting, or sitting in the narrow band where generalization actually happens.

## The Mechanics of Learning from Data

A machine learning model is a function that maps inputs to outputs. During training, you adjust the parameters of that function to minimize some loss on training data. The specific algorithmgradient descent, tree splitting, kernel trickis an implementation detail. What matters is understanding that every training process is an optimization problem, and every optimization problem has failure modes.

Consider a simple binary classification task: given features about a bank transaction, predict whether it is fraudulent. You have 50,000 transactions, 2,000 of which are fraudulent. This is your first real problemclass imbalance. If you train a model and it predicts "not fraudulent" for every single transaction, it achieves 96% accuracy. That number is meaningless. The model has learned nothing about fraud.

This is where the bias-variance tradeoff enters. A high-bias model makes strong assumptions about the data structure. It underfits. A high-variance model memorizes the training data without learning generalizable patterns. It overfits. The sweet spot is a model that captures the true signal while ignoring noise.

To understand this mechanically, think about what happens during training. A model starts with random parameters. It makes predictions, computes loss, and updates parameters to reduce that loss. On training data, loss always decreases. The question is whether loss also decreases on data the model has never seen. If it does, the model is generalizing. If it does not, the model is memorizing.

The training loss curve tells you almost everything. A training loss that decreases steadily and then plateaus suggests the model has learned what it can from the data. A training loss that continues to decrease while validation loss increases is the signature of overfitting. A training loss that stays high means the model is too simple to capture the patterns in the data.

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, 
    precision_recall_curve, roc_auc_score
)
from sklearn.preprocessing import StandardScaler

df = pd.read_csv('transactions.csv')
print(f"Dataset shape: {df.shape}")
print(f"Fraud rate: {df['is_fraud'].mean():.4f}")

# This split preserves class distribution
X = df.drop('is_fraud', axis=1)
y = df['is_fraud']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

print(f"Train fraud rate: {y_train.mean():.4f}")
print(f"Test fraud rate: {y_test.mean():.4f}")
```

Notice the `stratify=y` parameter. Without it, your random split might put most fraud cases in the test set, giving you a misleadingly bad test scoreor worse, a misleadingly good one. Stratified splitting ensures both sets have the same class distribution. This is a detail that separates practitioners from people who just call `train_test_split` and hope for the best.

The `random_state=42` parameter makes the split reproducible. Every time you run this code, you get the same split. This is essential for debugging. If your model performance changes between runs, you need to know whether it is because of the data split, the model initialization, or a code change. Fixed random seeds eliminate one source of variance.

## Why Accuracy Lies

Accuracy is the default metric for classification, and it is almost always the wrong one. When you have imbalanced classes, accuracy rewards models that simply predict the majority class. What you actually need are metrics that tell you how well the model handles the minority classthe class you care about.

Precision answers: of all the transactions the model flagged as fraud, how many were actually fraud? High precision means few false positives. In a fraud detection system, false positives mean legitimate transactions get blocked and angry customers call support.

Recall answers: of all the actual fraud cases, how many did the model catch? High recall means few false negatives. In fraud detection, false negatives mean money walks out the door.

The tension between precision and recall is the central challenge of classification. You cannot maximize both simultaneously. The threshold you choose determines where you sit on the precision-recall curve, and that choice is a business decision, not a technical one.

F1 score is the harmonic mean of precision and recall. It penalizes extremes. A model with precision 1.0 and recall 0.1 has an F1 of 0.18. A model with precision 0.7 and recall 0.7 has an F1 of 0.7. The F1 score pushes you toward balanced performance, which is usually what you want.

ROC-AUC measures the model's ability to distinguish between classes across all thresholds. It is threshold-independent, which makes it useful for comparing models. But ROC-AUC can be misleading with imbalanced classes because it uses both false positives and true negatives in its calculation. With 96% negative examples, a model that gets all negatives right gets a high ROC-AUC even if it catches no fraud.

```python
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_leaf=10,
    class_weight='balanced',
    random_state=42
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

# Precision-recall curve
precision, recall, thresholds = precision_recall_curve(y_test, y_proba)
f1_scores = 2 * (precision * recall) / (precision + recall + 1e-8)
best_threshold = thresholds[np.argmax(f1_scores)]
print(f"Best threshold for F1: {best_threshold:.4f}")
```

The `class_weight='balanced'` parameter adjusts the loss function to penalize misclassifying the minority class more heavily. Without it, the model optimizes for overall accuracy and largely ignores fraud. The weight is computed as `n_samples / (n_classes * n_samples_per_class)`, so the minority class gets a proportionally higher weight.

The threshold tuning at the end is criticalby default, most models use 0.5 as the classification threshold, but that threshold was chosen for convenience, not performance. The optimal threshold depends on the relative cost of false positives versus false negatives. In fraud detection, a false negative (missed fraud) costs more than a false positive (blocked transaction), so you want a lower threshold that catches more fraud even if it means more false alarms.

## Overfitting: When Your Model Hallucinates Patterns

Overfitting happens when a model learns the noise in training data as if it were signal. The model performs well on training data but poorly on any new data. The classic symptom is a large gap between training score and validation score.

To understand overfitting mechanically, think about what a decision tree does. It splits features at thresholds that best separate classes in the training data. With enough depth, a decision tree can create a unique path for every single training example. At that point, the tree has memorized the training set. It has zero generalization.

Random forests combat this by averaging many deep trees. Each tree overfits differently, so the average smooths out the individual overfitting. But even random forests can overfit if you give them enough trees or enough depth. The key insight is that ensembles reduce variance without increasing bias, but only if the individual models are diverse.

The learning curve is your diagnostic tool. It plots training score and validation score as a function of training set size. Three patterns tell you what is happening. If both scores are low and converging, you have high biasthe model is too simple. If training score is high but validation is low and the gap is large, you have high variancethe model is overfitting. If both scores are high and converging, your model is well-calibrated and you might benefit from more data.

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt

train_sizes, train_scores, val_scores = learning_curve(
    RandomForestClassifier(n_estimators=100, random_state=42),
    X_train, y_train,
    train_sizes=np.linspace(0.1, 1.0, 10),
    cv=5,
    scoring='f1',
    n_jobs=-1
)

plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_scores.mean(axis=1), label='Training F1')
plt.plot(train_sizes, val_scores.mean(axis=1), label='Validation F1')
plt.fill_between(train_sizes, 
                  train_scores.mean(axis=1) - train_scores.std(axis=1),
                  train_scores.mean(axis=1) + train_scores.std(axis=1), alpha=0.1)
plt.fill_between(train_sizes,
                  val_scores.mean(axis=1) - val_scores.std(axis=1),
                  val_scores.mean(axis=1) + val_scores.std(axis=1), alpha=0.1)
plt.xlabel('Training Set Size')
plt.ylabel('F1 Score')
plt.title('Learning Curve')
plt.legend()
plt.savefig('learning_curve.png', dpi=150)
```

The shaded regions show the standard deviation across cross-validation folds. Wide shaded regions mean the model's performance is unstableit performs differently on different subsets of data. Narrow regions mean consistent performance. If the validation curve has wide bands, you need more data or a simpler model.

The gap between training and validation curves tells you the magnitude of overfitting. A gap of 0.05 is usually acceptable. A gap of 0.20 means the model is substantially overfitting and you need to add regularization, reduce model complexity, or get more training data.

## Cross-Validation Done Right

K-fold cross-validation is not just "run the model k times and average." Done incorrectly, it introduces data leakage that makes your validation scores unreliable.

The most common mistake is applying preprocessing before splitting. If you scale your features using the entire dataset, information from the test fold leaks into the training fold. The scaler has seen all the data, including data that should be held out. This makes your cross-validation scores overly optimistic. The second most common mistake is using random splits instead of stratified splits when you have imbalanced classes. One fold might end up with very few positive examples, producing a validation score that is meaningless.

The correct approach is to use a pipeline that includes preprocessing. The pipeline ensures that preprocessing is fit on the training fold only, then applied to the validation fold. This prevents data leakage at every step of the cross-validation process.

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_validate

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    ))
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

results = cross_validate(
    pipeline, X_train, y_train,
    cv=cv,
    scoring=['accuracy', 'f1', 'precision', 'recall'],
    return_train_score=True
)

for metric in ['accuracy', 'f1', 'precision', 'recall']:
    train_key = f'train_{metric}'
    test_key = f'test_{metric}'
    print(f"{metric}:")
    print(f"  Train: {results[train_key].mean():.4f} ± {results[train_key].std():.4f}")
    print(f"  Test:  {results[test_key].mean():.4f} ± {results[test_key].std():.4f}")
```

The pipeline ensures that preprocessing is applied separately within each fold. The scaler computes mean and standard deviation from the training fold only, then applies those values to both the training and validation fold. This is how you avoid data leakage.

Stratified K-fold ensures each fold has the same class distribution as the full dataset. Without stratification, one fold might end up with very few fraud cases, producing a validation score that is meaningless for the class you care about.

The `return_train_score=True` parameter lets you compare training and validation scores across folds. If training scores are consistently high but validation scores vary widely, the model is sensitive to the specific data in each fold. This suggests overfitting or insufficient data.

The standard deviation of cross-validation scores is as important as the mean. A model with mean F1 of 0.80 and standard deviation of 0.05 is more reliable than a model with mean F1 of 0.82 and standard deviation of 0.12. The second model might perform great on some data and terribly on other data. Production systems need consistency, not occasional brilliance.

## Feature Engineering That Actually Matters

Feature engineering is where domain knowledge meets statistical intuition. Raw data rarely arrives in a form that models can exploit. The features you create determine what patterns your model can learn.

For transaction data, raw amounts are less informative than relative amounts. A $500 transaction at a grocery store is unusual; a $500 transaction at a luxury retailer is normal. Creating features like "amount relative to merchant category average" or "transaction amount versus user's historical average" gives the model signal that raw amounts cannot provide.

Time-based features are particularly powerful for fraud detection. Transactions at 3 AM are more suspicious than transactions at 2 PM. Transactions on weekends differ from weekday transactions. The hour of day, day of week, and whether the transaction occurs during the user's typical active hours all provide signal.

User behavioral features capture patterns over time. A user who normally spends $50 per transaction and suddenly makes a $5,000 transaction is suspicious. A user who normally transacts in New York and suddenly transacts in London is suspicious. These patterns require historical aggregationcomputing rolling averages, standard deviations, and counts over multiple time windows.

```python
def engineer_features(df):
    df = df.copy()
    
    # Time-based features
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_night'] = df['hour'].apply(lambda h: 1 if h < 6 or h > 22 else 0)
    
    # User history features
    user_stats = df.groupby('user_id').agg(
        avg_amount=('amount', 'mean'),
        std_amount=('amount', 'std'),
        avg_amount_30d=('amount', lambda x: x.tail(30).mean()),
        transaction_count_30d=('amount', 'count')
    ).reset_index()
    
    df = df.merge(user_stats, on='user_id', how='left')
    
    # Relative features
    df['amount_zscore'] = (df['amount'] - df['avg_amount']) / (df['std_amount'] + 1e-8)
    df['amount_ratio'] = df['amount'] / (df['avg_amount_30d'] + 1e-8)
    
    # Merchant features
    merchant_stats = df.groupby('merchant_id').agg(
        merchant_avg=('amount', 'mean'),
        merchant_fraud_rate=('is_fraud', 'mean')
    ).reset_index()
    
    df = df.merge(merchant_stats, on='merchant_id', how='left')
    
    # Interaction features
    df['high_amount_new_merchant'] = (
        (df['amount_zscore'] > 2) & (df['merchant_fraud_rate'] > 0.1)
    ).astype(int)
    
    return df

X_train = engineer_features(X_train)
X_test = engineer_features(X_test)
```

Feature engineering is iterative. You create features, train a model, examine which features matter, and create better features based on what you learn. Feature importance from tree-based models is your guide hereit tells you which features the model actually uses and which are noise.

The `amount_zscore` feature is powerful because it normalizes the amount relative to the user's history. A z-score of 3 means the transaction is 3 standard deviations above the user's average. This is far more informative than the raw amount because it adapts to each user's spending pattern.

The interaction feature `high_amount_new_merchant` combines two signals: an unusually large transaction and a merchant the user has never transacted with before. Either signal alone is weak. Combined, they are strong. This is the essence of feature engineeringcreating features that capture relationships between variables that the model might not discover on its own.

## Handling Missing Data Without Destroying Signal

Missing data is not a bugit is information. The fact that a field is missing often correlates with the outcome. A transaction missing a zip code might be more likely to be fraudulent. Simply filling missing values with zeros or means destroys this signal.

There are three strategies for handling missing data, and you should use all three. First, add missing indicatorsbinary columns that tell the model whether a value was missing. Second, impute the missing values using a method that preserves relationships between features. Third, let the model handle missing values natively if it supports them (XGBoost and LightGBM do).

KNN imputation finds the k most similar rows based on other features and uses their values to estimate the missing value. This preserves relationships between features that simple mean imputation destroys. The missing indicators tell the model which values were imputed, preserving the information that the data was missing in the first place.

```python
from sklearn.impute import SimpleImputer, KNNImputer

# Strategy 1: Add missing indicators
def add_missing_indicators(df, columns):
    for col in columns:
        df[f'{col}_missing'] = df[col].isnull().astype(int)
    return df

missing_cols = ['amount', 'merchant_fraud_rate', 'user_age']
X_train = add_missing_indicators(X_train, missing_cols)
X_test = add_missing_indicators(X_test, missing_cols)

# Strategy 2: KNN imputation (uses similar rows to fill gaps)
imputer = KNNImputer(n_neighbors=5)
numeric_cols = X_train.select_dtypes(include=[np.number]).columns
X_train[numeric_cols] = imputer.fit_transform(X_train[numeric_cols])
X_test[numeric_cols] = imputer.transform(X_test[numeric_cols])
```

The `fit_transform` on training data and `transform` on test data is critical. The imputer learns the imputation values from training data only. If you fit on the entire dataset, information from the test set leaks into the training set, producing overly optimistic cross-validation scores.

## Building the Full Classifier

Now you assemble everything into a complete training pipeline. The pipeline includes preprocessing, feature engineering, model training, and evaluation. Every step is reproducible because you set random seeds and use the same pipeline object for training and inference.

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import GridSearchCV

numeric_features = ['amount', 'hour', 'amount_zscore', 'amount_ratio']
categorical_features = ['merchant_category', 'country']

preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imputer', KNNImputer(n_neighbors=5)),
        ('scaler', StandardScaler())
    ]), numeric_features),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
])

full_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', GradientBoostingClassifier(random_state=42))
])

param_grid = {
    'model__n_estimators': [100, 200, 300],
    'model__max_depth': [3, 5, 7],
    'model__learning_rate': [0.01, 0.1, 0.2],
    'model__min_samples_leaf': [5, 10, 20]
}

grid_search = GridSearchCV(
    full_pipeline, param_grid,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
    scoring='f1',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)
print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV F1: {grid_search.best_score_:.4f}")

# Final evaluation
y_pred = grid_search.predict(X_test)
print(classification_report(y_test, y_pred))
```

GridSearchCV exhaustively tests every combination of parameters and reports the best one. The key here is that you evaluate on the full test set only once, at the very end, after you have selected your hyperparameters using cross-validation on the training set. If you use the test set to tune hyperparameters, you are overfitting to the test set, and your reported performance will be misleading.

The `handle_unknown='ignore'` parameter in OneHotEncoder is essential for production. During training, you see a specific set of merchant categories. During serving, a new merchant category might appear. Without this parameter, the model crashes. With it, the new category gets a vector of all zeros, which the model can handle gracefully.

## Evaluation Beyond Single Numbers

A single F1 score hides more than it reveals. You need to understand where your model fails and why. Confusion matrices, threshold analysis, and error analysis are how you get there.

A confusion matrix shows you the raw counts of true positives, false positives, true negatives, and false negatives. From these four numbers, you can derive every other metric. The confusion matrix also reveals patterns. If your false positives are concentrated in a specific feature range, you know where to focus your feature engineering efforts.

Error analysis is the most valuable step in the entire ML workflow. You examine the cases where the model fails and look for patterns. If the model consistently fails on transactions from a specific merchant category, you need features specific to that category. If the model fails on high-value transactions, you need better features for that range.

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(cm)

# Error analysis
test_results = X_test.copy()
test_results['true'] = y_test.values
test_results['predicted'] = y_pred
test_results['probability'] = grid_search.predict_proba(X_test)[:, 1]

false_positives = test_results[
    (test_results['true'] == 0) & (test_results['predicted'] == 1)
]
false_negatives = test_results[
    (test_results['true'] == 1) & (test_results['predicted'] == 0)
]

print(f"\nFalse Positives: {len(false_positives)}")
print(f"Average probability: {false_positives['probability'].mean():.4f}")
print(f"Top features in FP:\n{false_positives[numeric_features].mean()}")

print(f"\nFalse Negatives: {len(false_negatives)}")
print(f"Average probability: {false_negatives['probability'].mean():.4f}")
print(f"Top features in FN:\n{false_negatives[numeric_features].mean()}")
```

Error analysis reveals patterns. If your false negatives have low probability scores, your model is uncertain about themyou might need more features for those cases. If your false positives share common characteristics, you might need to add features that distinguish those cases from true positives. This is an iterative process, and it is where real model improvement happens.

The probability analysis is particularly important. False negatives with high probability (close to 0.5) indicate the model is genuinely uncertain. These are cases where additional features or a more complex model might help. False negatives with low probability indicate the model is confidently wrongthese are harder to fix and might indicate a fundamental limitation of the feature set.

## When to Stop Tuning

There is a point of diminishing returns in hyperparameter tuning. After the first round of grid search, you typically capture 80-90% of the available improvement. Subsequent rounds might improve your F1 by 0.005 while consuming hours of compute time.

The learning curve tells you when to stop. If your validation scores have plateaued and the gap between training and validation is stable, further tuning will not help. At that point, you need either more data, better features, or a different model architecturenot better hyperparameters.

Save your model with the exact parameters and pipeline that produced it. Version your data, your features, and your model artifacts. When someone asks "why did the model predict fraud on this transaction three months ago?", you need to be able to reproduce that prediction exactly. This is not optional in productionit is the difference between a system you can debug and a black box that makes mysterious decisions.

Reproducibility means fixing every random seed, recording every library version, and storing every configuration. A model trained on Monday with numpy 1.24 might behave differently than the same model trained on Tuesday with numpy 1.25. These subtle differences compound and produce results that are impossible to reproduce without exact version pinning.

## Assessment

### Lab Task 1: Build a Classifier (Time: 90 minutes)

Download the credit card fraud dataset. Your task is to build a classifier that detects fraudulent transactions.

**Steps:**
1. Load and explore the dataset. Report class distribution and feature types.
2. Split data using stratified 80/20 split.
3. Engineer at least three new features from the raw data.
4. Build a preprocessing pipeline with imputation and scaling.
5. Train a Random Forest classifier with `class_weight='balanced'`.
6. Evaluate using precision, recall, and F1. Do not use accuracy.
7. Plot the precision-recall curve and identify the optimal threshold.
8. Perform error analysis: characterize false positives and false negatives.

**Grading Criteria:**
- Correct stratified split (10 points)
- At least three engineered features with justification (15 points)
- Pipeline with no data leakage (20 points)
- Model achieves F1 > 0.70 on test set (15 points)
- Precision-recall curve with threshold selection (15 points)
- Error analysis identifying patterns in misclassifications (15 points)
- Code is clean, commented where necessary, and reproducible (10 points)

### Lab Task 2: Diagnose Overfitting (Time: 60 minutes)

Using the same dataset, train models with varying complexity and diagnose overfitting.

**Steps:**
1. Train decision trees with max_depth from 2 to 20.
2. Plot training and validation scores for each depth.
3. Identify the depth where overfitting begins.
4. Train a random forest and compare its learning curve to the single tree.
5. Apply cross-validation and explain why the CV score differs from the holdout score.

**Grading Criteria:**
- Learning curves plotted correctly with error bands (20 points)
- Correct identification of overfitting onset (20 points)
- Comparison of single tree vs. random forest (20 points)
- Explanation of CV vs. holdout score differences (20 points)
- Code quality and documentation (20 points)

## Evidence

- `fraud_classifier.py`: Complete training pipeline with all preprocessing steps
- `learning_curve_analysis.py`: Script that generates learning curves for model diagnosis
- `error_analysis_report.md`: Written analysis of model errors with recommendations for improvement
- `hyperparameter_search_results.json`: Grid search results with all parameter combinations and scores
- `feature_importance.csv`: Feature importance rankings from the trained model
- `precision_recall_threshold.py`: Threshold optimization script with visualization
