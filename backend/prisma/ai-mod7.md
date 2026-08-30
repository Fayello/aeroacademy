# Module 7 — ML Ethics: Bias, Fairness, Transparency

## What You'll Actually Do

You'll audit a trained model for bias across demographic groups, implement fairness constraints, and build explainability tools. Ethics isn't a checkbox—it's engineering.

## Content

### Bias Detection

```python
import pandas as pd
from sklearn.metrics import accuracy_score, demographic_parity_difference

def compute_fairness_metrics(y_true, y_pred, sensitive_attr):
    groups = pd.DataFrame({
        'y_true': y_true,
        'y_pred': y_pred,
        'group': sensitive_attr
    })

    results = {}
    for group in groups['group'].unique():
        mask = groups['group'] == group
        results[group] = {
            'accuracy': accuracy_score(
                groups.loc[mask, 'y_true'],
                groups.loc[mask, 'y_pred']
            ),
            'positive_rate': groups.loc[mask, 'y_pred'].mean(),
            'count': mask.sum()
        }

    return pd.DataFrame(results).T

# Demographic parity: positive rates should be similar across groups
dp_diff = demographic_parity_difference(
    y_true, y_pred, sensitive_attr=gender
)
print(f"Demographic parity difference: {dp_diff:.3f}")
```

### Fairness Constraints

```python
from aif360.algorithms.preprocessing import Reweighing
from aif360.datasets import BinaryLabelDataset

def reweigh_data(X, y, sensitive_attr):
    dataset = BinaryLabelDataset(
        df=pd.DataFrame({
            'label': y,
            'sensitive': sensitive_attr,
            **{f'f{i}': X[:, i] for i in range(X.shape[1])}
        }),
        label_names=['label'],
        protected_attribute_names=['sensitive']
    )

    rw = Reweighing(
        privileged_groups=[{'sensitive': 1}],
        unprivileged_groups=[{'sensitive': 0}]
    )
    transformed = rw.fit_transform(dataset)
    return transformed

# Retrain with reweighted data
X_rw, y_rw, sample_weights = reweigh_data(X_train, y_train, gender_train)
model.fit(X_rw, y_rw, sample_weight=sample_weights)
```

### Model Explainability with SHAP

```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Summary plot: which features matter most
shap.summary_plot(shap_values, X_test, feature_names=feature_names)

# Individual prediction explanation
shap.force_plot(
    explainer.expected_value,
    shap_values[0],
    X_test[0],
    feature_names=feature_names
)
```

### Feature Importance Analysis

```python
def bias_audit(model, X, y, sensitive_features, feature_names):
    report = {}

    # Check feature importances
    importances = model.feature_importances_
    for name, imp in zip(feature_names, importances):
        report[name] = {'importance': imp}

    # Check correlation with sensitive features
    for feat_name, feat_idx in zip(feature_names, range(len(feature_names))):
        for sens_name, sens_idx in zip(
            sensitive_features.keys(), sensitive_features.values()
        ):
            corr = np.corrcoef(X[:, feat_idx], X[:, sens_idx])[0, 1]
            if abs(corr) > 0.3:
                report[feat_name][f'corr_with_{sens_name}'] = corr

    return report
```

### Transparency Documentation

```python
MODEL_CARD = {
    "model_name": "Credit Scoring Model v2",
    "intended_use": "Credit risk assessment for loan applications",
    "limitations": [
        "Trained on data from 2020-2024, may not reflect current trends",
        "Underperforms for applicants under 25",
        "Not validated for amounts above $500k"
    ],
    "fairness_metrics": {
        "demographic_parity_diff": 0.03,
        "equalized_odds_diff": 0.05,
        "acceptable_threshold": 0.1
    },
    "ethical_considerations": [
        "May perpetuate historical lending biases",
        "Requires human review for edge cases",
        "Regular bias audits required quarterly"
    ]
}
```

## Assessment

**Lab: Fairness Audit**

Train a classifier on the German Credit dataset. Identify at least 2 sensitive attributes. Compute fairness metrics (demographic parity, equal opportunity) across groups. Apply reweighing to reduce bias and re-measure. Write a model card documenting your findings.

- Time: 70 minutes
- Grading: Bias detection (25%), fairness metrics computation (25%), reweighing implementation (25%), model card quality (25%)

## Evidence

Upload your fairness metrics comparison (before/after reweighing), SHAP plots, and completed model card.
