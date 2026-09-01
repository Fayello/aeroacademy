# Module 7: ML Ethics

## Models Make Decisions About People. That Requires Responsibility.

A machine learning model does not just predictit decides. A fraud model decides whether a transaction is legitimate. A hiring model decides whether a candidate gets an interview. A lending model decides whether someone gets a loan. These decisions have real consequences for real people, and when those decisions are biased, the consequences fall disproportionately on already marginalized groups.

This module is not about abstract philosophical principles. It is about the concrete, measurable ways that bias enters ML systems, the statistical tools you use to detect it, and the practical techniques you apply to mitigate it. You will compute fairness metrics, identify sources of bias in data and features, and implement debiasing strategies that do not destroy model performance.

## How Bias Enters ML Systems

Bias enters through three channels: historical bias, representation bias, and measurement bias. Historical bias means the data reflects past discrimination. If you train a hiring model on historical hiring data, and the company historically favored men for engineering roles, the model learns that pattern and perpetuates it. Representation bias means certain groups are underrepresented in the data. If your training data has 10x more examples from urban areas than rural areas, the model performs worse for rural populations. Measurement bias means the features used to measure the outcome are systematically different across groups. If you use zip code as a feature, and zip code correlates with race due to residential segregation, the model uses race as a proxy even if you exclude race explicitly.

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score

# Simulated hiring data
np.random.seed(42)
n_candidates = 10000

data = pd.DataFrame({
    'experience_years': np.random.exponential(5, n_candidates),
    'education_score': np.random.normal(70, 15, n_candidates),
    'interview_score': np.random.normal(65, 20, n_candidates),
    'gender': np.random.choice(['M', 'F', 'NB'], n_candidates, p=[0.6, 0.35, 0.05]),
    'ethnicity': np.random.choice(
        ['White', 'Black', 'Hispanic', 'Asian', 'Other'],
        n_candidates, p=[0.6, 0.15, 0.12, 0.08, 0.05]
    ),
})

# Historical bias: women and minorities were hired at lower rates
# even with same qualifications
bias_factor = np.where(
    data['gender'] == 'M', 1.0,
    np.where(data['gender'] == 'F', 0.7, 0.5)
)

ethnicity_bias = np.where(
    data['ethnicity'] == 'White', 1.0,
    np.where(data['ethnicity'] == 'Asian', 0.95, 0.7)
)

data['hired'] = (
    (data['experience_years'] * 0.3 + 
     data['education_score'] * 0.01 + 
     data['interview_score'] * 0.02 +
     np.random.normal(0, 0.5, n_candidates)) *
    bias_factor * ethnicity_bias > 2.5
).astype(int)

print(f"Hired rate by gender:")
print(data.groupby('gender')['hired'].mean())
print(f"\nHired rate by ethnicity:")
print(data.groupby('ethnicity')['hired'].mean())

# Train model on biased data
features = ['experience_years', 'education_score', 'interview_score']
X = data[features]
y = data['hired']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
gender_test = data.loc[X_test.index, 'gender']
ethnicity_test = data.loc[X_test.index, 'ethnicity']

model = GradientBoostingClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"\nOverall accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

The model learns the biased patterns in the data. It becomes a machine for perpetuating historical discrimination. The overall accuracy looks fine, but the accuracy varies significantly across groups.

## Measuring Fairness: The Metrics

Fairness is not a single metric. Different metrics capture different aspects of fairness, and they are often mathematically incompatible. You cannot satisfy all of them simultaneously. The choice of which metric to optimize is a business decision that depends on the context.

Demographic parity requires that the positive prediction rate is equal across groups. If the model recommends 30% of men for interviews, it should also recommend 30% of women. This ignores qualification differences.

Equalized odds requires that the true positive rate and false positive rate are equal across groups. If the model correctly identifies 80% of qualified men, it should also correctly identify 80% of qualified women. This is harder to satisfy because it requires equal performance, not just equal selection rates.

Predictive parity requires that the positive predictive value is equal across groups. If the model's predictions are correct 90% of the time when it recommends a man, it should also be correct 90% of the time when it recommends a woman.

```python
from sklearn.metrics import confusion_matrix

class FairnessMetrics:
    def __init__(self, y_true, y_pred, sensitive_features):
        self.y_true = np.array(y_true)
        self.y_pred = np.array(y_pred)
        self.sensitive_features = np.array(sensitive_features)
        self.groups = np.unique(sensitive_features)
    
    def demographic_parity(self):
        rates = {}
        for group in self.groups:
            mask = self.sensitive_features == group
            rates[group] = self.y_pred[mask].mean()
        
        max_rate = max(rates.values())
        min_rate = min(rates.values())
        disparity = max_rate - min_rate
        
        return {
            'group_rates': rates,
            'disparity': disparity,
            'ratio': min_rate / max_rate if max_rate > 0 else 0,
        }
    
    def equalized_odds(self):
        tpr = {}
        fpr = {}
        
        for group in self.groups:
            mask = self.sensitive_features == group
            group_true = self.y_true[mask]
            group_pred = self.y_pred[mask]
            
            tn, fp, fn, tp = confusion_matrix(
                group_true, group_pred, labels=[0, 1]
            ).ravel()
            
            tpr[group] = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr[group] = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        tpr_disparity = max(tpr.values()) - min(tpr.values())
        fpr_disparity = max(fpr.values()) - min(fpr.values())
        
        return {
            'tpr': tpr,
            'fpr': fpr,
            'tpr_disparity': tpr_disparity,
            'fpr_disparity': fpr_disparity,
        }
    
    def predictive_parity(self):
        ppv = {}
        
        for group in self.groups:
            mask = self.sensitive_features == group
            group_true = self.y_true[mask]
            group_pred = self.y_pred[mask]
            
            tp = ((group_pred == 1) & (group_true == 1)).sum()
            fp = ((group_pred == 1) & (group_true == 0)).sum()
            
            ppv[group] = tp / (tp + fp) if (tp + fp) > 0 else 0
        
        max_ppv = max(ppv.values())
        min_ppv = min(ppv.values())
        
        return {
            'ppv': ppv,
            'disparity': max_ppv - min_ppv,
            'ratio': min_ppv / max_ppv if max_ppv > 0 else 0,
        }
    
    def calibration(self, n_bins=10):
        calibration = {}
        
        for group in self.groups:
            mask = self.sensitive_features == group
            group_true = self.y_true[mask]
            group_scores = self.y_pred[mask].astype(float)
            
            bins = np.linspace(0, 1, n_bins + 1)
            bin_true_rates = []
            bin_predicted_rates = []
            
            for i in range(n_bins):
                bin_mask = (group_scores >= bins[i]) & (group_scores < bins[i+1])
                if bin_mask.sum() > 0:
                    bin_true_rates.append(group_true[bin_mask].mean())
                    bin_predicted_rates.append(
                        (bins[i] + bins[i+1]) / 2
                    )
            
            calibration[group] = {
                'true_rates': bin_true_rates,
                'predicted_rates': bin_predicted_rates,
            }
        
        return calibration
    
    def compute_all(self):
        return {
            'demographic_parity': self.demographic_parity(),
            'equalized_odds': self.equalized_odds(),
            'predictive_parity': self.predictive_parity(),
        }

metrics = FairnessMetrics(y_test, y_pred, gender_test)
fairness = metrics.compute_all()

print("Gender Fairness Metrics:")
print(f"Demographic parity disparity: {fairness['demographic_parity']['disparity']:.4f}")
print(f"Equalized odds TPR disparity: {fairness['equalized_odds']['tpr_disparity']:.4f}")
print(f"Equalized odds FPR disparity: {fairness['equalized_odds']['fpr_disparity']:.4f}")
print(f"Predictive parity disparity: {fairness['predictive_parity']['disparity']:.4f}")

metrics_ethnicity = FairnessMetrics(y_test, y_pred, ethnicity_test)
fairness_ethnicity = metrics_ethnicity.compute_all()
print("\nEthnicity Fairness Metrics:")
print(f"Demographic parity disparity: {fairness_ethnicity['demographic_parity']['disparity']:.4f}")
```

The impossibility theorem states that you cannot satisfy demographic parity, equalized odds, and predictive parity simultaneously unless the base rates are equal across groups or the model is perfect. In practice, you must choose which fairness criterion matters most for your use case.

## Sources of Bias in Features

Even if you exclude sensitive features (gender, race) from the model, other features can serve as proxies. Zip code correlates with race. Job title correlates with gender. University attended correlates with socioeconomic status. Removing sensitive features does not remove biasit just hides it.

```python
def compute_proxy_correlation(df, sensitive_col, feature_cols):
    correlations = {}
    
    for feature in feature_cols:
        if df[feature].dtype in ['float64', 'int64']:
            # Compute correlation with sensitive feature
            # For categorical sensitive features, use point-biserial
            if df[sensitive_col].nunique() == 2:
                from scipy.stats import pointbiserialr
                binary_sensitive = (df[sensitive_col] == df[sensitive_col].unique()[0]).astype(int)
                corr, p_value = pointbiserialr(df[feature], binary_sensitive)
                correlations[feature] = {'correlation': corr, 'p_value': p_value}
            else:
                # ANOVA F-statistic for multi-class
                from scipy.stats import f_oneway
                groups = [df[df[sensitive_col] == g][feature].dropna() for g in df[sensitive_col].unique()]
                f_stat, p_value = f_oneway(*groups)
                correlations[feature] = {'f_statistic': f_stat, 'p_value': p_value}
    
    return correlations

proxy_scores = compute_proxy_correlation(
    data, 'gender', features
)

print("Feature proxy scores for gender:")
for feature, scores in proxy_scores.items():
    print(f"  {feature}: {scores}")

# Identify high-proxy features
high_proxy = {
    f: s for f, s in proxy_scores.items() 
    if s.get('p_value', 1) < 0.05
}
print(f"\nHigh-proxy features: {list(high_proxy.keys())}")
```

If a feature is highly correlated with a sensitive attribute, it acts as a proxy. You have three options: remove the feature (loses information), transform the feature to remove the correlation (loses some information), or use the feature but apply fairness constraints during training.

## Pre-Processing Debiasing

Pre-processing debiasing transforms the data before training. The goal is to remove the correlation between features and sensitive attributes while preserving the information needed for prediction.

```python
from sklearn.preprocessing import StandardScaler

class ReweightingDebiaser:
    def __init__(self, sensitive_col):
        self.sensitive_col = sensitive_col
    
    def compute_weights(self, df, target_col):
        groups = df[self.sensitive_col].unique()
        
        # Compute expected and observed proportions
        n = len(df)
        weights = np.ones(n)
        
        for group in groups:
            group_mask = df[self.sensitive_col] == group
            n_group = group_mask.sum()
            
            for target_val in df[target_col].unique():
                target_mask = df[target_col] == target_val
                
                # Observed probability
                p_observed = (group_mask & target_mask).sum() / n
                
                # Expected probability (independence)
                p_group = n_group / n
                p_target = target_mask.sum() / n
                p_expected = p_group * p_target
                
                # Weight
                mask = group_mask & target_mask
                weights[mask] = p_expected / p_observed if p_observed > 0 else 1
        
        return weights

class DisparateImpactRemover:
    def __init__(self, repair_level=1.0):
        self.repair_level = repair_level
    
    def repair(self, df, sensitive_col, feature_cols):
        df_repaired = df.copy()
        
        for feature in feature_cols:
            if df[feature].dtype in ['float64', 'int64']:
                groups = df[sensitive_col].unique()
                
                # Compute group-specific quantiles
                for group in groups:
                    group_mask = df[sensitive_col] == group
                    group_values = df.loc[group_mask, feature]
                    
                    # Transform to uniform distribution
                    ranks = group_values.rank(pct=True)
                    df_repaired.loc[group_mask, feature] = ranks
                
                # Interpolate between original and repaired
                df_repaired[feature] = (
                    self.repair_level * df_repaired[feature] +
                    (1 - self.repair_level) * df[feature]
                )
        
        return df_repaired

# Apply reweighting
reweighter = ReweightingDebiaser('gender')
weights = reweighter.compute_weights(data, 'hired')

# Train with reweighted data
model_reweighted = GradientBoostingClassifier(n_estimators=100, random_state=42)
model_reweighted.fit(X_train, y_train, sample_weight=weights[X_train.index])

# Apply disparate impact remover
remover = DisparateImpactRemover(repair_level=0.8)
data_repaired = remover.repair(data, 'gender', features)

X_repaired = data_repaired[features]
y_repaired = data_repaired['hired']
X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
    X_repaired, y_repaired, test_size=0.2, random_state=42
)

model_repaired = GradientBoostingClassifier(n_estimators=100, random_state=42)
model_repaired.fit(X_train_r, y_train_r)
```

Reweighting adjusts sample weights so that the training distribution matches the fair distribution. The disparate impact remover transforms features to remove correlation with sensitive attributes. Both reduce bias but may reduce accuracy.

## In-Processing Debiasing

In-processing debiasing adds fairness constraints to the training process. The model optimizes for both accuracy and fairness simultaneously.

```python
import torch
import torch.nn as nn
import torch.optim as optim

class FairClassifier(nn.Module):
    def __init__(self, input_dim, sensitive_dim, lambda_fair=1.0):
        super().__init__()
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
        )
        self.classifier = nn.Linear(64, 1)
        self.adversary = nn.Linear(64, sensitive_dim)
        self.lambda_fair = lambda_fair
    
    def forward(self, x):
        features = self.feature_extractor(x)
        prediction = torch.sigmoid(self.classifier(features))
        sensitive_pred = self.adversary(features)
        return prediction, sensitive_pred

def train_fair_classifier(
    model, X_train, y_train, sensitive_train,
    X_val, y_val, sensitive_val,
    epochs=50, lr=0.001
):
    optimizer = optim.Adam(model.parameters(), lr=lr)
    bce_loss = nn.BCELoss()
    ce_loss = nn.CrossEntropyLoss()
    
    for epoch in range(epochs):
        model.train()
        
        # Forward pass
        predictions, sensitive_predictions = model(X_train)
        
        # Classification loss
        cls_loss = bce_loss(predictions.squeeze(), y_train.float())
        
        # Adversarial loss (maximize adversary error = minimize fairness)
        adv_loss = ce_loss(sensitive_predictions, sensitive_train)
        
        # Total loss: classification - lambda * adversarial
        # We subtract adversarial loss to encourage the feature extractor
        # to hide sensitive information
        total_loss = cls_loss - model.lambda_fair * adv_loss
        
        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 10 == 0:
            model.eval()
            with torch.no_grad():
                val_pred, val_sensitive = model(X_val)
                val_cls_loss = bce_loss(val_pred.squeeze(), y_val.float())
                val_adv_loss = ce_loss(val_sensitive, sensitive_val)
                
                # Compute fairness
                val_pred_binary = (val_pred.squeeze() > 0.5).float()
                dp_disparity = compute_dp_disparity(
                    val_pred_binary, sensitive_val
                )
                
                print(f"Epoch {epoch + 1}")
                print(f"  CLS Loss: {cls_loss.item():.4f}")
                print(f"  ADV Loss: {adv_loss.item():.4f}")
                print(f"  Val CLS Loss: {val_cls_loss.item():.4f}")
                print(f"  DP Disparity: {dp_disparity:.4f}")

def compute_dp_disparity(predictions, sensitive):
    groups = sensitive.unique()
    rates = {}
    
    for group in groups:
        mask = sensitive == group
        rates[group.item()] = predictions[mask].mean().item()
    
    return max(rates.values()) - min(rates.values())

# Prepare data
X_train_tensor = torch.tensor(X_train.values, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train.values, dtype=torch.float32)
sensitive_train_tensor = torch.tensor(
    (gender_train == 'F').astype(int).values, dtype=torch.long
)

X_val_tensor = torch.tensor(X_test.values, dtype=torch.float32)
y_val_tensor = torch.tensor(y_test.values, dtype=torch.float32)
sensitive_val_tensor = torch.tensor(
    (gender_test == 'F').astype(int).values, dtype=torch.long
)

fair_model = FairClassifier(input_dim=3, sensitive_dim=2, lambda_fair=1.0)
train_fair_classifier(
    fair_model, X_train_tensor, y_train_tensor, sensitive_train_tensor,
    X_val_tensor, y_val_tensor, sensitive_val_tensor
)
```

The adversarial component trains the feature extractor to produce representations from which the sensitive attribute cannot be predicted. This forces the model to learn features that are predictive of the outcome but not of the sensitive attribute. The lambda parameter controls the tradeoff between accuracy and fairness.

## Post-Processing Debiasing

Post-processing adjusts predictions after the model is trained. The model is a black box, and you modify its outputs to satisfy fairness constraints.

```python
class ThresholdOptimizer:
    def __init__(self, y_true, y_pred_proba, sensitive_features):
        self.y_true = np.array(y_true)
        self.y_pred_proba = np.array(y_pred_proba)
        self.sensitive = np.array(sensitive_features)
        self.groups = np.unique(sensitive_features)
    
    def optimize_thresholds(self, constraint='equalized_odds'):
        if constraint == 'equalized_odds':
            return self._optimize_equalized_odds()
        elif constraint == 'demographic_parity':
            return self._optimize_demographic_parity()
    
    def _optimize_equalized_odds(self):
        thresholds = {}
        
        for group in self.groups:
            mask = self.sensitive == group
            group_true = self.y_true[mask]
            group_proba = self.y_pred_proba[mask]
            
            # Find threshold that equalizes TPR
            best_threshold = 0.5
            best_tpr_diff = float('inf')
            
            # Get reference TPR (from majority group)
            ref_mask = self.sensitive == self.groups[0]
            ref_true = self.y_true[ref_mask]
            ref_proba = self.y_pred_proba[ref_mask]
            
            for threshold in np.arange(0.1, 0.9, 0.01):
                ref_pred = (ref_proba >= threshold).astype(int)
                group_pred = (group_proba >= threshold).astype(int)
                
                ref_tp = ((ref_pred == 1) & (ref_true == 1)).sum()
                ref_fn = ((ref_pred == 0) & (ref_true == 1)).sum()
                ref_tpr = ref_tp / (ref_tp + ref_fn) if (ref_tp + ref_fn) > 0 else 0
                
                group_tp = ((group_pred == 1) & (group_true == 1)).sum()
                group_fn = ((group_pred == 0) & (group_true == 1)).sum()
                group_tpr = group_tp / (group_tp + group_fn) if (group_tp + group_fn) > 0 else 0
                
                tpr_diff = abs(ref_tpr - group_tpr)
                if tpr_diff < best_tpr_diff:
                    best_tpr_diff = tpr_diff
                    best_threshold = threshold
            
            thresholds[group] = best_threshold
        
        return thresholds
    
    def _optimize_demographic_parity(self):
        # Find single threshold that equalizes positive rate
        target_rate = self.y_pred_proba.mean()
        
        best_threshold = 0.5
        best_disparity = float('inf')
        
        for threshold in np.arange(0.1, 0.9, 0.01):
            preds = (self.y_pred_proba >= threshold).astype(int)
            
            rates = {}
            for group in self.groups:
                mask = self.sensitive == group
                rates[group] = preds[mask].mean()
            
            disparity = max(rates.values()) - min(rates.values())
            if disparity < best_disparity:
                best_disparity = disparity
                best_threshold = threshold
        
        return best_threshold
    
    def apply_thresholds(self, thresholds):
        adjusted_predictions = np.zeros(len(self.y_pred_proba))
        
        for group in self.groups:
            mask = self.sensitive == group
            threshold = thresholds[group]
            adjusted_predictions[mask] = (
                self.y_pred_proba[mask] >= threshold
            ).astype(int)
        
        return adjusted_predictions

optimizer = ThresholdOptimizer(y_test, model.predict_proba(X_test)[:, 1], gender_test)

# Equalized odds thresholds
eo_thresholds = optimizer.optimize_thresholds('equalized_odds')
print(f"Equalized odds thresholds: {eo_thresholds}")

adjusted_preds = optimizer.apply_thresholds(eo_thresholds)

# Compare fairness
original_fairness = FairnessMetrics(y_test, y_pred, gender_test)
adjusted_fairness = FairnessMetrics(y_test, adjusted_preds, gender_test)

print("\nOriginal fairness:")
print(f"  DP disparity: {original_fairness.demographic_parity()['disparity']:.4f}")
print(f"  EO TPR disparity: {original_fairness.equalized_odds()['tpr_disparity']:.4f}")

print("\nAdjusted fairness:")
print(f"  DP disparity: {adjusted_fairness.demographic_parity()['disparity']:.4f}")
print(f"  EO TPR disparity: {adjusted_fairness.equalized_odds()['tpr_disparity']:.4f}")
```

Post-processing is model-agnosticyou can apply it to any model without retraining. The downside is that group-specific thresholds require knowing the sensitive attribute at inference time, which may not always be available or legal to collect.

## Fairness-Accuracy Tradeoff

Fairness and accuracy often conflict. Making a model fairer typically reduces its overall accuracy because you are constraining the model from using information that is predictive but correlated with sensitive attributes. The question is: how much accuracy are you willing to sacrifice for how much fairness improvement?

```python
def fairness_accuracy_curve(
    X_train, y_train, sensitive_train,
    X_test, y_test, sensitive_test,
    lambda_values=None
):
    if lambda_values is None:
        lambda_values = [0, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
    
    results = []
    
    for lam in lambda_values:
        model = FairClassifier(input_dim=3, sensitive_dim=2, lambda_fair=lam)
        
        # Convert to tensors
        X_train_t = torch.tensor(X_train.values, dtype=torch.float32)
        y_train_t = torch.tensor(y_train.values, dtype=torch.float32)
        s_train_t = torch.tensor(
            (gender_train == 'F').astype(int).values, dtype=torch.long
        )
        X_test_t = torch.tensor(X_test.values, dtype=torch.float32)
        y_test_t = torch.tensor(y_test.values, dtype=torch.float32)
        s_test_t = torch.tensor(
            (gender_test == 'F').astype(int).values, dtype=torch.long
        )
        
        # Train
        train_fair_classifier(
            model, X_train_t, y_train_t, s_train_t,
            X_test_t, y_test_t, s_test_t, epochs=30
        )
        
        # Evaluate
        model.eval()
        with torch.no_grad():
            pred, _ = model(X_test_t)
            pred_binary = (pred.squeeze() > 0.5).float()
            
            accuracy = (pred_binary == y_test_t).float().mean().item()
            dp = compute_dp_disparity(pred_binary, s_test_t)
        
        results.append({
            'lambda': lam,
            'accuracy': accuracy,
            'dp_disparity': dp,
        })
        
        print(f"Lambda {lam}: Accuracy={accuracy:.4f}, DP={dp:.4f}")
    
    return pd.DataFrame(results)

curve_results = fairness_accuracy_curve(
    X_train, y_train, gender_train,
    X_test, y_test, gender_test
)

# Plot the curve
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.plot(curve_results['dp_disparity'], curve_results['accuracy'], 'bo-')
plt.xlabel('Demographic Parity Disparity')
plt.ylabel('Accuracy')
plt.title('Fairness-Accuracy Tradeoff')
plt.grid(True)
plt.savefig('fairness_accuracy_curve.png', dpi=150)
```

## Fairness in Practice: Case Studies

Understanding fairness metrics in theory is different from applying them in practice. Real-world fairness problems are messy, context-dependent, and often involve tradeoffs that have no clear right answer. This section examines three case studies that illustrate common fairness challenges.

The first case is credit scoring. A bank deploys a model that predicts loan defaults. The model uses income, credit history, employment status, and zip code. The zip code feature correlates with race due to residential segregation. The model does not use race explicitly, but it uses zip code as a proxy. The result: Black applicants are denied loans at higher rates than white applicants with similar financial profiles.

The fix is not simple. Removing zip code loses information about neighborhood risk factors that are genuinely relevant to credit scoring. Reweighting adjusts the training data to balance acceptance rates across racial groups, but it reduces the model's overall accuracy. The bank must decide whether to accept lower accuracy for higher fairness, or to accept some unfairness for better predictions.

The second case is hiring. A tech company uses a model to screen resumes. The model was trained on historical hiring data, which reflects the company's past preference for male candidates. The model learns to penalize resumes with indicators of female candidates (women's college, women's organizations, gaps for maternity leave).

The fix requires both data and model changes. The company must remove gender-correlated features from the model. But some features that correlate with gender (e.g., career gaps) are genuinely informative about candidates' availability. The company must decide whether to remove these features and potentially miss qualified candidates, or to keep them and perpetuate historical bias.

The third case is criminal justice. A risk assessment model predicts whether a defendant will reoffend. The model uses prior arrests, charges, and demographic information. Prior arrests correlate with race because of differential policing patterns. Black defendants have higher arrest rates not because they commit more crimes but because they are policed more heavily.

The model assigns higher risk scores to Black defendants, leading to longer sentences and higher bail amounts. The feedback loop is vicious: higher risk scores lead to harsher treatment, which leads to more arrests, which leads to higher risk scores in the future.

```python
class FairnessCaseStudy:
    def __init__(self, case_name: str):
        self.case_name = case_name
        self.findings = []
        self.recommendations = []
    
    def analyze_credit_scoring(self, data, model):
        # Analyze feature importance for sensitive groups
        feature_importance = model.feature_importances_
        
        # Check for proxy variables
        correlations = {}
        for col in data.columns:
            if col in ['race', 'gender']:
                continue
            for sensitive in ['race', 'gender']:
                if sensitive in data.columns:
                    corr = data[col].corr(data[sensitive])
                    if abs(corr) > 0.3:
                        correlations[col] = corr
        
        self.findings.append({
            'proxy_variables': correlations,
            'recommendation': 'Consider removing or transforming proxy variables',
        })
        
        return correlations
    
    def analyze_hiring(self, data, model):
        # Analyze gender gap in predictions
        male_pred = model.predict(data[data['gender'] == 'M'].drop('gender', axis=1))
        female_pred = model.predict(data[data['gender'] == 'F'].drop('gender', axis=1))
        
        gap = male_pred.mean() - female_pred.mean()
        
        self.findings.append({
            'gender_gap': gap,
            'recommendation': 'Apply threshold optimization to equalize selection rates',
        })
        
        return gap
    
    def generate_recommendations(self) -> str:
        report = [f"Fairness Analysis: {self.case_name}", "=" * 50]
        
        for i, finding in enumerate(self.findings, 1):
            report.append(f"\nFinding {i}:")
            for key, value in finding.items():
                report.append(f"  {key}: {value}")
        
        return "\n".join(report)

# Apply to each case study
credit_study = FairnessCaseStudy("Credit Scoring")
credit_study.analyze_credit_scoring(data, model)

hiring_study = FairnessCaseStudy("Resume Screening")
hiring_study.analyze_hiring(data, model)

print(credit_study.generate_recommendations())
print(hiring_study.generate_recommendations())
```

## Regulatory Requirements for Fairness

Several regulations require fairness in automated decision-making. The Equal Credit Opportunity Act (ECOA) prohibits credit discrimination based on race, color, religion, national origin, sex, marital status, or age. The Fair Housing Act prohibits discrimination in housing decisions. The EU AI Act classifies certain AI systems as high-risk and requires fairness assessments.

These regulations do not specify which fairness metric to use. They require that the system does not discriminate. The ambiguity means you must choose a fairness metric, justify your choice, and document your reasoning. This is a business decision that requires input from legal, compliance, and product teams.

```python
class RegulatoryCompliance:
    def __init__(self, regulation: str):
        self.regulation = regulation
        self.requirements = self._load_requirements()
    
    def _load_requirements(self):
        if self.regulation == 'ECOA':
            return {
                'prohibited_bases': ['race', 'color', 'religion', 'national_origin', 'sex', 'marital_status', 'age'],
                'required_metrics': ['disparate_impact', 'statistical_parity'],
                'documentation': ['model_card', 'adverse_action_notices'],
            }
        elif self.regulation == 'EU_AI_ACT':
            return {
                'risk_level': 'high',
                'required_metrics': ['fairness_metrics', 'robustness', 'transparency'],
                'documentation': ['impact_assessment', 'monitoring_plan', 'human_oversight'],
            }
        return {}
    
    def check_compliance(self, model_info: dict) -> dict:
        requirements = self.requirements
        compliance = {}
        
        for metric in requirements.get('required_metrics', []):
            if metric in model_info.get('computed_metrics', {}):
                compliance[metric] = True
            else:
                compliance[metric] = False
        
        for doc in requirements.get('documentation', []):
            if doc in model_info.get('documents', []):
                compliance[doc] = True
            else:
                compliance[doc] = False
        
        return {
            'regulation': self.regulation,
            'compliant': all(compliance.values()),
            'checks': compliance,
        }

# Check compliance
ecoa = RegulatoryCompliance('ECOA')
compliance = ecoa.check_compliance({
    'computed_metrics': ['disparate_impact', 'statistical_parity'],
    'documents': ['model_card', 'adverse_action_notices'],
})
print(f"ECOA compliant: {compliance['compliant']}")
```

## Assessment

### Lab Task 1: Measure Fairness (Time: 75 minutes)

Compute fairness metrics for a trained model.

**Steps:**
1. Load a dataset with sensitive attributes (gender, ethnicity).
2. Train a baseline model without fairness constraints.
3. Compute demographic parity, equalized odds, and predictive parity.
4. Compute calibration curves for each group.
5. Identify which fairness criterion is violated most.
6. Determine whether the violations are statistically significant.

**Grading Criteria:**
- Demographic parity computed correctly with group-level rates (15 points)
- Equalized odds computed with TPR and FPR for each group (15 points)
- Predictive parity computed with PPV for each group (15 points)
- Calibration curves plotted for each group (15 points)
- Statistical significance tests performed (15 points)
- Results interpreted in context of the use case (15 points)
- Code is reusable for different datasets and sensitive attributes (10 points)

### Lab Task 2: Implement Debiasing (Time: 90 minutes)

Implement three debiasing strategies and compare their effectiveness.

**Steps:**
1. Implement reweighting debiasing that adjusts sample weights.
2. Implement adversarial debiasing with a fairness-constrained neural network.
3. Implement threshold optimization for equalized odds.
4. Compare all three approaches on fairness metrics and accuracy.
5. Analyze the fairness-accuracy tradeoff for each method.

**Grading Criteria:**
- Reweighting correctly adjusts sample proportions (15 points)
- Adversarial debiasing reduces sensitive attribute predictability (15 points)
- Threshold optimization equalizes TPR across groups (15 points)
- Comparison includes fairness metrics for all approaches (15 points)
- Accuracy comparison shows tradeoff clearly (15 points)
- Analysis discusses when each approach is appropriate (15 points)
- Code handles edge cases (missing sensitive attributes, small groups) (10 points)

### Lab Task 3: Fairness Audit Report (Time: 45 minutes)

Write a fairness audit report for a deployed model.

**Steps:**
1. Select a model and dataset with documented bias concerns.
2. Run all fairness metrics computed in Lab Task 1.
3. Identify the most severe fairness violations.
4. Recommend specific mitigation strategies based on the violations.
5. Estimate the accuracy cost of each mitigation.
6. Write a report suitable for non-technical stakeholders.

**Grading Criteria:**
- Report clearly states the fairness metrics and their values (15 points)
- Most severe violations are correctly identified (15 points)
- Recommendations are specific and actionable (15 points)
- Accuracy cost estimates are reasonable (15 points)
- Report is written in plain language (15 points)
- Report includes visualizations (charts, tables) (15 points)
- Ethical implications are discussed honestly (10 points)

## Evidence

- `fairness_metrics.py`: Complete fairness metrics implementation with demographic parity, equalized odds, and predictive parity
- `debiasing_methods.py`: Implementation of reweighting, adversarial debiasing, and threshold optimization
- `fairness_audit.py`: Script that generates a complete fairness audit for any model-dataset pair
- `proxy_detection.py`: Feature analysis for identifying proxy variables
- `fairness_accuracy_tradeoff.csv`: Results of fairness-accuracy experiments across lambda values
- `fairness_report_template.md`: Template for fairness audit reports
- `fairness_audit_report.pdf`: Completed audit report for the hiring model
