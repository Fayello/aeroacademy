# Module 10: Production ML

## Production Is Where Models Go to Die

Training a model is the easy part. Keeping it alive in production is where most ML teams fail. The model degrades. The data changes. The feature pipeline breaks. A downstream service times out. A business stakeholder asks why the model is making weird predictions on a specific customer segment. Production ML is not about building the best modelit is about building a system that monitors itself, heals itself, and improves itself over time.

This module covers the practices that separate ML experiments from ML products: A/B testing that tells you whether a new model is actually better, canary deployments that reduce risk when rolling out changes, shadow deployment that lets you compare models in real traffic, and the operational practices that keep ML systems running when everything else is failing.

## A/B Testing for ML Models

A/B testing is the gold standard for evaluating model changes. You split traffic between the current model (control) and the new model (treatment), measure the outcomes, and use statistical tests to determine whether the difference is real or noise.

The key insight is that offline metrics (accuracy, F1) do not always correlate with business metrics (revenue, customer satisfaction). A model with higher accuracy might block more legitimate transactions, which annoys customers and costs more in support tickets than it saves in fraud prevention. A/B testing measures the business impact directly.

```python
import numpy as np
from scipy import stats
from datetime import datetime, timedelta
from typing import Dict, List
import hashlib

class ABTest:
    def __init__(self, test_name: str, control_model, treatment_model):
        self.test_name = test_name
        self.control_model = control_model
        self.treatment_model = treatment_model
        self.traffic_split = 0.5  # 50/50 split
        self.results = {
            'control': [],
            'treatment': []
        }
        self.start_time = None
        self.end_time = None
    
    def assign_variant(self, user_id: str) -> str:
        # Deterministic assignment based on user_id
        hash_value = int(hashlib.md5(
            f"{self.test_name}_{user_id}".encode()
        ).hexdigest(), 16)
        
        if (hash_value % 100) < (self.traffic_split * 100):
            return 'treatment'
        else:
            return 'control'
    
    def predict(self, user_id: str, features: np.ndarray) -> Dict:
        variant = self.assign_variant(user_id)
        
        if variant == 'control':
            prediction = self.control_model.predict(features)
            model = 'control'
        else:
            prediction = self.treatment_model.predict(features)
            model = 'treatment'
        
        return {
            'prediction': prediction,
            'variant': variant,
            'model': model,
            'user_id': user_id,
            'timestamp': datetime.utcnow(),
        }
    
    def log_outcome(
        self, user_id: str, outcome: float, variant: str
    ):
        self.results[variant].append({
            'user_id': user_id,
            'outcome': outcome,
            'timestamp': datetime.utcnow(),
        })
    
    def analyze_results(self, significance_level: float = 0.05) -> Dict:
        control_outcomes = [r['outcome'] for r in self.results['control']]
        treatment_outcomes = [r['outcome'] for r in self.results['treatment']]
        
        if not control_outcomes or not treatment_outcomes:
            return {'error': 'Insufficient data'}
        
        # Two-sample t-test
        t_stat, p_value = stats.ttest_ind(
            control_outcomes, treatment_outcomes
        )
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(
            (np.var(control_outcomes) + np.var(treatment_outcomes)) / 2
        )
        cohens_d = (
            (np.mean(treatment_outcomes) - np.mean(control_outcomes)) / 
            pooled_std if pooled_std > 0 else 0
        )
        
        # Confidence interval for the difference
        control_mean = np.mean(control_outcomes)
        treatment_mean = np.mean(treatment_outcomes)
        diff = treatment_mean - control_mean
        
        se = np.sqrt(
            np.var(control_outcomes) / len(control_outcomes) +
            np.var(treatment_outcomes) / len(treatment_outcomes)
        )
        
        ci_lower = diff - 1.96 * se
        ci_upper = diff + 1.96 * se
        
        # Statistical power
        power = 1 - stats.t.cdf(
            1.96 - abs(diff) / se, 
            df=len(control_outcomes) + len(treatment_outcomes) - 2
        )
        
        return {
            'control_mean': control_mean,
            'treatment_mean': treatment_mean,
            'difference': diff,
            'relative_improvement': diff / control_mean if control_mean != 0 else 0,
            'p_value': p_value,
            'significant': p_value < significance_level,
            'cohens_d': cohens_d,
            'confidence_interval': (ci_lower, ci_upper),
            'power': power,
            'control_n': len(control_outcomes),
            'treatment_n': len(treatment_outcomes),
            'recommendation': self._make_recommendation(
                p_value, significance_level, diff, power
            ),
        }
    
    def _make_recommendation(
        self, p_value, significance_level, diff, power
    ):
        if p_value >= significance_level:
            return "Insufficient evidence to declare a winner. Continue the test."
        
        if power < 0.8:
            return "Result may not be reliable due to low statistical power. Consider running longer."
        
        if diff > 0:
            return "Treatment model performs significantly better. Recommend deploying."
        else:
            return "Control model performs significantly better. Do not deploy treatment."

# Run an A/B test
ab_test = ABTest(
    test_name='fraud_model_v2_test',
    control_model=model_v1,
    treatment_model=model_v2
)

ab_test.start_time = datetime.utcnow()

# Simulate traffic
np.random.seed(42)
for i in range(10000):
    user_id = f"user_{i}"
    features = np.random.randn(1, 128).astype(np.float32)
    
    result = ab_test.predict(user_id, features)
    
    # Simulate outcomes (in reality, this comes from actual transactions)
    # Treatment model is slightly better at catching fraud
    if result['variant'] == 'control':
        outcome = 1 if np.random.random() < 0.02 else 0  # 2% fraud catch rate
    else:
        outcome = 1 if np.random.random() < 0.025 else 0  # 2.5% fraud catch rate
    
    ab_test.log_outcome(user_id, outcome, result['variant'])

ab_test.end_time = datetime.utcnow()

# Analyze
results = ab_test.analyze_results()
print(f"Control mean: {results['control_mean']:.4f}")
print(f"Treatment mean: {results['treatment_mean']:.4f}")
print(f"Relative improvement: {results['relative_improvement']:.2%}")
print(f"P-value: {results['p_value']:.4f}")
print(f"Significant: {results['significant']}")
print(f"Recommendation: {results['recommendation']}")
```

The sample size matters. A test with 100 users per group has much less statistical power than a test with 1000 users per group. Before running an A/B test, calculate the minimum sample size needed to detect a meaningful effect. The `power` analysis in the results tells you whether you have enough data.

## Minimum Sample Size Calculation

Running an A/B test for too short wastes engineering effort on a test that cannot detect a real difference. Running it too long delays shipping improvements. Calculate the minimum sample size before starting.

```python
def calculate_sample_size(
    baseline_rate: float, 
    minimum_detectable_effect: float,
    significance_level: float = 0.05,
    power: float = 0.8
) -> int:
    from scipy.stats import norm
    
    # For binary outcomes (fraud caught / not caught)
    p1 = baseline_rate
    p2 = baseline_rate * (1 + minimum_detectable_effect)
    
    pooled_p = (p1 + p2) / 2
    
    z_alpha = norm.ppf(1 - significance_level / 2)
    z_beta = norm.ppf(power)
    
    n = (
        (z_alpha * np.sqrt(2 * pooled_p * (1 - pooled_p)) +
         z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2 /
        (p2 - p1) ** 2
    )
    
    return int(np.ceil(n))

# Calculate sample size for our A/B test
sample_size = calculate_sample_size(
    baseline_rate=0.02,
    minimum_detectable_effect=0.25,  # 25% relative improvement
    significance_level=0.05,
    power=0.8
)

print(f"Minimum sample size per group: {sample_size}")
print(f"Total sample size needed: {sample_size * 2}")
print(f"At 1000 requests/day, test needs {(sample_size * 2 / 1000):.0f} days")
```

## Canary Deployments

A canary deployment sends a small percentage of traffic to the new model while the majority continues using the old one. If the new model performs well, you gradually increase traffic until it handles 100%. If it performs poorly, you roll back with minimal impact.

```python
import time
from enum import Enum

class CanaryStatus(Enum):
    INITIALIZING = "initializing"
    ROLLING_OUT = "rolling_out"
    FULLY_DEPLOYED = "fully_deployed"
    ROLLED_BACK = "rolled_back"

class CanaryDeployment:
    def __init__(
        self, model_name: str, new_version: str,
        initial_traffic_pct: float = 0.05,
        increment_pct: float = 0.10,
        evaluation_interval_minutes: int = 30,
        min_evaluation_samples: int = 100,
        rollback_threshold: float = 0.01
    ):
        self.model_name = model_name
        self.new_version = new_version
        self.traffic_pct = initial_traffic_pct
        self.increment_pct = increment_pct
        self.evaluation_interval = evaluation_interval_minutes * 60
        self.min_samples = min_evaluation_samples
        self.rollback_threshold = rollback_threshold
        
        self.status = CanaryStatus.INITIALIZING
        self.metrics_history = []
        self.start_time = None
    
    def start(self):
        self.status = CanaryStatus.ROLLING_OUT
        self.start_time = datetime.utcnow()
        print(f"Canary deployment started: {self.traffic_pct:.0%} traffic")
    
    def route_request(self, request_id: str) -> str:
        hash_value = int(hashlib.md5(
            f"{self.model_name}_{request_id}".encode()
        ).hexdigest(), 16)
        
        if (hash_value % 100) < (self.traffic_pct * 100):
            return self.new_version
        else:
            return 'current'
    
    def evaluate(self, metrics: Dict) -> Dict:
        self.metrics_history.append({
            'timestamp': datetime.utcnow(),
            'traffic_pct': self.traffic_pct,
            'metrics': metrics,
        })
        
        # Check for regression
        if len(self.metrics_history) >= 2:
            prev_metrics = self.metrics_history[-2]['metrics']
            
            for metric_name in ['latency_p99', 'error_rate']:
                if metric_name in metrics and metric_name in prev_metrics:
                    current = metrics[metric_name]
                    previous = prev_metrics[metric_name]
                    
                    if metric_name == 'latency_p99':
                        # Latency should not increase by more than 10%
                        if current > previous * 1.10:
                            return {
                                'action': 'rollback',
                                'reason': f'{metric_name} increased by {(current/previous - 1) * 100:.1f}%'
                            }
                    elif metric_name == 'error_rate':
                        # Error rate should not increase
                        if current > previous + self.rollback_threshold:
                            return {
                                'action': 'rollback',
                                'reason': f'{metric_name} increased to {current:.4f}'
                            }
        
        return {'action': 'continue'}
    
    def promote(self):
        self.traffic_pct = min(1.0, self.traffic_pct + self.increment_pct)
        
        if self.traffic_pct >= 1.0:
            self.status = CanaryStatus.FULLY_DEPLOYED
            print(f"Canary deployment complete: {self.model_name} fully deployed")
        else:
            print(f"Canary promoted: {self.traffic_pct:.0%} traffic")
    
    def rollback(self, reason: str):
        self.status = CanaryStatus.ROLLED_BACK
        self.traffic_pct = 0
        print(f"Canary rolled back: {reason}")
    
    def get_status(self) -> Dict:
        return {
            'model_name': self.model_name,
            'new_version': self.new_version,
            'status': self.status.value,
            'traffic_pct': self.traffic_pct,
            'duration_minutes': (
                (datetime.utcnow() - self.start_time).total_seconds() / 60
                if self.start_time else 0
            ),
            'evaluations': len(self.metrics_history),
        }

# Deploy a canary
canary = CanaryDeployment(
    model_name='fraud_detector',
    new_version='v2.0.0',
    initial_traffic_pct=0.05,
    increment_pct=0.10,
    evaluation_interval_minutes=30,
)

canary.start()

# Simulate evaluations
for i in range(10):
    metrics = {
        'latency_p99': 50 + np.random.normal(0, 5),
        'error_rate': 0.001 + np.random.normal(0, 0.0005),
        'f1': 0.85 + np.random.normal(0, 0.01),
    }
    
    result = canary.evaluate(metrics)
    
    if result['action'] == 'rollback':
        canary.rollback(result['reason'])
        break
    else:
        canary.promote()

print(canary.get_status())
```

The evaluation interval controls how long you wait between promotions. Thirty minutes gives you enough data to detect regressions while not delaying the rollout too much. The `min_samples` parameter ensures you have enough data to make a reliable decision.

## Shadow Deployment

Shadow deployment runs the new model alongside the current one, processing the same traffic, but only the current model's predictions are served to users. The new model's predictions are logged for comparison. This lets you evaluate the new model on real traffic without affecting users.

```python
class ShadowDeployment:
    def __init__(self, current_model, shadow_model):
        self.current_model = current_model
        self.shadow_model = shadow_model
        self.comparison_log = []
    
    def predict(self, features: np.ndarray) -> Dict:
        start_time = time.time()
        current_prediction = self.current_model.predict(features)
        current_latency = (time.time() - start_time) * 1000
        
        start_time = time.time()
        shadow_prediction = self.shadow_model.predict(features)
        shadow_latency = (time.time() - start_time) * 1000
        
        self.comparison_log.append({
            'timestamp': datetime.utcnow(),
            'features_hash': hashlib.md5(features.tobytes()).hexdigest(),
            'current_prediction': current_prediction,
            'shadow_prediction': shadow_prediction,
            'current_latency_ms': current_latency,
            'shadow_latency_ms': shadow_latency,
            'prediction_match': current_prediction == shadow_prediction,
        })
        
        # Return only the current model's prediction
        return {
            'prediction': current_prediction,
            'variant': 'current',
        }
    
    def analyze(self) -> Dict:
        if not self.comparison_log:
            return {'error': 'No comparison data'}
        
        predictions_match = sum(
            1 for r in self.comparison_log if r['prediction_match']
        )
        total = len(self.comparison_log)
        
        current_latencies = [r['current_latency_ms'] for r in self.comparison_log]
        shadow_latencies = [r['shadow_latency_ms'] for r in self.comparison_log]
        
        # Find cases where models disagree
        disagreements = [
            r for r in self.comparison_log if not r['prediction_match']
        ]
        
        return {
            'total_predictions': total,
            'agreement_rate': predictions_match / total,
            'current_avg_latency': np.mean(current_latencies),
            'shadow_avg_latency': np.mean(shadow_latencies),
            'disagreement_count': len(disagreements),
            'disagreement_rate': len(disagreements) / total,
        }

shadow = ShadowDeployment(model_v1, model_v2)

# Simulate shadow predictions
for i in range(5000):
    features = np.random.randn(1, 128).astype(np.float32)
    result = shadow.predict(features)

analysis = shadow.analyze()
print(f"Agreement rate: {analysis['agreement_rate']:.2%}")
print(f"Current avg latency: {analysis['current_avg_latency']:.2f}ms")
print(f"Shadow avg latency: {analysis['shadow_avg_latency']:.2f}ms")
print(f"Disagreement rate: {analysis['disagreement_rate']:.2%}")
```

Shadow deployment is particularly useful for latency testing. The shadow model processes the same traffic, so you get accurate latency measurements without risking user experience. If the shadow model is significantly slower, you know there is a performance issue before deploying it.

## Feature Store for Production Serving

In production, features must be computed the same way during training and serving. A feature store provides this consistency. It stores precomputed features and serves them at low latency.

```python
import redis
import json
from datetime import timedelta

class FeatureStore:
    def __init__(self, redis_host='localhost', redis_port=6379):
        self.redis = redis.Redis(
            host=redis_host, port=redis_port, decode_responses=True
        )
        self.ttl = timedelta(hours=24)
    
    def set_features(
        self, entity_id: str, features: Dict, 
        feature_group: str = 'default'
    ):
        key = f"features:{feature_group}:{entity_id}"
        self.redis.setex(
            key, 
            self.ttl, 
            json.dumps(features, default=str)
        )
    
    def get_features(
        self, entity_id: str, feature_group: str = 'default'
    ) -> Dict:
        key = f"features:{feature_group}:{entity_id}"
        data = self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    def batch_set_features(
        self, entity_ids: List[str], 
        features_list: List[Dict],
        feature_group: str = 'default'
    ):
        pipe = self.redis.pipeline()
        
        for entity_id, features in zip(entity_ids, features_list):
            key = f"features:{feature_group}:{entity_id}"
            pipe.setex(key, self.ttl, json.dumps(features, default=str))
        
        pipe.execute()
    
    def batch_get_features(
        self, entity_ids: List[str], feature_group: str = 'default'
    ) -> List[Dict]:
        pipe = self.redis.pipeline()
        
        for entity_id in entity_ids:
            key = f"features:{feature_group}:{entity_id}"
            pipe.get(key)
        
        results = pipe.execute()
        
        return [
            json.loads(r) if r else None for r in results
        ]
    
    def update_features(
        self, entity_id: str, updates: Dict, 
        feature_group: str = 'default'
    ):
        existing = self.get_features(entity_id, feature_group) or {}
        existing.update(updates)
        self.set_features(entity_id, existing, feature_group)

feature_store = FeatureStore()

# Store precomputed features
feature_store.set_features(
    'user_12345',
    {
        'txn_count_7d': 15,
        'avg_amount_7d': 250.0,
        'max_amount_30d': 1500.0,
        'merchant_diversity_30d': 8,
    },
    feature_group='fraud_features'
)

# Retrieve at serving time
features = feature_store.get_features('user_12345', 'fraud_features')
print(features)
```

Feature stores solve the training-serving skew problem. During training, features are computed from historical data. During serving, features are computed from real-time data. If the feature computation logic differs between training and serving, the model's predictions are unreliable. The feature store ensures both use the same computation.

## Model Rollback

When a deployed model starts performing poorly, you need to roll back to the previous version immediately. This requires that the previous version's artifacts are readily available and that the rollback can happen without downtime.

```python
class ModelRollback:
    def __init__(self, registry: ModelRegistry, serving_config: Dict):
        self.registry = registry
        self.serving_config = serving_config
        self.deployment_history = []
    
    def deploy(
        self, model_name: str, version_id: str, 
        deployed_by: str, notes: str = ""
    ):
        version = self.registry.get_model_version(model_name, version_id)
        
        if not version:
            raise ValueError(f"Model {model_name}/{version_id} not found")
        
        # Record current deployment
        current = self.get_current_deployment(model_name)
        
        self.deployment_history.append({
            'model_name': model_name,
            'version_id': version_id,
            'deployed_by': deployed_by,
            'deployed_at': datetime.utcnow().isoformat(),
            'previous_version': current['version_id'] if current else None,
            'notes': notes,
        })
        
        # Update serving configuration
        self.serving_config[model_name] = {
            'version': version_id,
            'artifacts': version['artifacts'],
            'deployed_at': datetime.utcnow().isoformat(),
        }
        
        print(f"Deployed {model_name}/{version_id}")
    
    def rollback(self, model_name: str, reason: str) -> str:
        # Find previous version
        history = [
            h for h in self.deployment_history 
            if h['model_name'] == model_name
        ]
        
        if not history:
            raise ValueError(f"No deployment history for {model_name}")
        
        current = history[-1]
        previous_version = current.get('previous_version')
        
        if not previous_version:
            raise ValueError(f"No previous version to rollback to")
        
        # Deploy previous version
        self.deploy(
            model_name, previous_version,
            deployed_by='rollback_system',
            notes=f"Rollback: {reason}"
        )
        
        print(f"Rolled back {model_name} to {previous_version}: {reason}")
        return previous_version
    
    def get_current_deployment(self, model_name: str) -> Dict:
        return self.serving_config.get(model_name)
    
    def get_deployment_history(self, model_name: str) -> List[Dict]:
        return [
            h for h in self.deployment_history 
            if h['model_name'] == model_name
        ]

rollback_manager = ModelRollback(registry, {})

# Deploy a model
rollback_manager.deploy(
    'fraud_detector', 'v2.0.0', 'ml-engineer-1',
    'New model with improved recall'
)

# Rollback if issues arise
rollback_manager.rollback(
    'fraud_detector', 
    'F1 score dropped below 0.70 threshold'
)
```

## End-to-End Production Pipeline

The complete production ML system ties everything together: training, evaluation, A/B testing, canary deployment, monitoring, and rollback.

```python
class ProductionMLSystem:
    def __init__(self):
        self.registry = ModelRegistry('model_registry')
        self.audit = AuditLogger('audit_logs')
        self.feature_store = FeatureStore()
        self.alert_manager = AlertManager()
    
    def full_deployment_cycle(
        self, model_name: str, version_id: str,
        deployed_by: str
    ):
        # Step 1: Register model
        print("Step 1: Registering model")
        self.audit.log_model_registration(
            model_name, version_id, deployed_by, {}
        )
        
        # Step 2: Run quality gates
        print("Step 2: Running quality gates")
        compliance = self._check_compliance(model_name, version_id)
        if not compliance['compliant']:
            print(f"Compliance check failed: {compliance['results']}")
            return False
        
        # Step 3: Shadow deployment (24 hours)
        print("Step 3: Starting shadow deployment")
        shadow_result = self._run_shadow_deployment(
            model_name, version_id, duration_hours=24
        )
        
        if shadow_result['disagreement_rate'] > 0.3:
            print(f"Shadow deployment failed: too many disagreements")
            return False
        
        # Step 4: Canary deployment (gradual rollout)
        print("Step 4: Starting canary deployment")
        canary = CanaryDeployment(
            model_name, version_id,
            initial_traffic_pct=0.05,
            increment_pct=0.10,
        )
        
        canary.start()
        
        # Simulate canary evaluations
        for i in range(10):
            metrics = self._collect_metrics(model_name)
            result = canary.evaluate(metrics)
            
            if result['action'] == 'rollback':
                self.audit.log_event(
                    'canary_rollback', f"{model_name}/{version_id}",
                    'system', {'reason': result['reason']}
                )
                return False
            
            canary.promote()
        
        # Step 5: Full deployment
        print("Step 5: Full deployment complete")
        self.registry.transition_stage(
            model_name, version_id, ModelStage.PRODUCTION,
            deployed_by, 'Canary deployment successful'
        )
        
        self.audit.log_model_deployment(
            model_name, version_id, deployed_by, 'production'
        )
        
        return True
    
    def _check_compliance(self, model_name, version_id):
        # Placeholder for compliance checks
        return {'compliant': True, 'results': []}
    
    def _run_shadow_deployment(self, model_name, version_id, duration_hours):
        # Placeholder for shadow deployment
        return {'disagreement_rate': 0.05}
    
    def _collect_metrics(self, model_name):
        return {
            'latency_p99': 50 + np.random.normal(0, 5),
            'error_rate': 0.001 + np.random.normal(0, 0.0005),
        }

system = ProductionMLSystem()
```

## Incident Response for ML Systems

When an ML model causes an incidenta wrong prediction that loses money, a biased decision that harms users, or a serving failure that blocks transactionsyou need a structured response. The incident response process for ML is different from traditional software incidents because the root cause is often statistical, not deterministic.

The ML incident response has six steps. First, detect: the monitoring system alerts on anomalous behavior. Second, diagnose: determine whether the issue is with the data, the model, or the infrastructure. Third, mitigate: roll back the model, adjust thresholds, or disable the affected feature. Fourth, remediate: fix the root cause. Fifth, verify: confirm the fix works. Sixth, learn: document what happened and prevent it from recurring.

```python
class MLIncidentResponse:
    def __init__(self, rollback_fn, alert_manager):
        self.rollback_fn = rollback_fn
        self.alert_manager = alert_manager
        self.incidents = []
    
    def detect_incident(self, monitoring_data: dict) -> dict:
        incidents = []
        
        # Check performance metrics
        f1 = monitoring_data.get('performance', {}).get('f1', 1.0)
        if f1 < 0.60:
            incidents.append({
                'type': 'performance_degradation',
                'severity': 'critical',
                'metric': 'f1',
                'value': f1,
                'threshold': 0.60,
            })
        
        # Check error rate
        error_rate = monitoring_data.get('operational', {}).get('error_rate', 0)
        if error_rate > 0.05:
            incidents.append({
                'type': 'high_error_rate',
                'severity': 'critical',
                'metric': 'error_rate',
                'value': error_rate,
                'threshold': 0.05,
            })
        
        # Check prediction distribution
        pred_rate = monitoring_data.get('operational', {}).get('prediction_rate', 1.0)
        if pred_rate < 0.01 or pred_rate > 0.5:
            incidents.append({
                'type': 'prediction_distribution_anomaly',
                'severity': 'warning',
                'metric': 'prediction_rate',
                'value': pred_rate,
            })
        
        return incidents
    
    def diagnose_root_cause(self, incident: dict) -> str:
        if incident['type'] == 'performance_degradation':
            return 'Check for data drift, concept drift, or model staleness'
        elif incident['type'] == 'high_error_rate':
            return 'Check serving infrastructure, model loading, and input validation'
        elif incident['type'] == 'prediction_distribution_anomaly':
            return 'Check feature pipeline, data source changes, and upstream systems'
        return 'Unknown root cause'
    
    def mitigate(self, incident: dict) -> dict:
        if incident['severity'] == 'critical':
            # Roll back to previous model
            self.rollback_fn()
            return {'action': 'rollback', 'status': 'completed'}
        
        return {'action': 'monitor', 'status': 'continued_monitoring'}
    
    def log_incident(self, incident: dict, diagnosis: str, mitigation: dict):
        incident_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'incident': incident,
            'diagnosis': diagnosis,
            'mitigation': mitigation,
        }
        self.incidents.append(incident_log)
        
        # Alert the team
        self.alert_manager.send_alert({
            'rule': 'ml_incident',
            'severity': incident['severity'],
            'details': incident_log,
        })
    
    def generate_postmortem(self, incident: dict) -> str:
        return f"""ML Incident Postmortem
=====================
Type: {incident['type']}
Severity: {incident['severity']}
Metric: {incident['metric']} = {incident['value']}

Timeline:
- Detected at: {datetime.utcnow().isoformat()}
- Root cause: TBD
- Mitigation: Rollback to previous model
- Resolution: TBD

Action Items:
1. Investigate root cause
2. Implement fix
3. Add monitoring for this failure mode
4. Update runbook
"""

responder = MLIncidentResponse(
    rollback_fn=lambda: print("Rolling back model"),
    alert_manager=alert_manager
)

# Detect incidents
incidents = responder.detect_incident(monitoring_data)
for incident in incidents:
    diagnosis = responder.diagnose_root_cause(incident)
    mitigation = responder.mitigate(incident)
    responder.log_incident(incident, diagnosis, mitigation)
    print(responder.generate_postmortem(incident))
```

The postmortem is the most important part of incident response. It documents what happened, why it happened, and what you will do to prevent it from happening again. Every ML incident should produce a postmortem, even if the incident was minor. The postmortem process builds institutional knowledge and prevents the same incident from recurring.

## ML System Reliability Engineering

Reliability engineering for ML systems borrows from Site Reliability Engineering (SRE) but adds ML-specific concepts. The key metrics are availability (what percentage of time the system is working), latency (how long predictions take), and correctness (how accurate predictions are).

Availability for ML systems is measured as the percentage of requests that return a valid prediction. A system that returns 99.9% valid predictions is available 99.9% of the time. The remaining 0.1% includes errors, timeouts, and fallback predictions.

Latency is measured at multiple percentiles. P50 (median) tells you the typical experience. P95 tells you the experience for most users. P99 tells you the worst-case experience for 1% of users. P99 matters because it represents the users who have the worst experience, and those users are often the most valuable.

Correctness is measured by comparing predictions to ground truth when it becomes available. This is unique to ML systemstraditional software does not have a correctness metric because the output is deterministic. ML correctness degrades over time as the data distribution changes, which is why monitoring is essential.

```python
class ReliabilityMetrics:
    def __init__(self):
        self.request_log = []
        self.prediction_log = []
    
    def log_request(self, request_id: str, status: str, 
                    latency_ms: float, timestamp: datetime):
        self.request_log.append({
            'request_id': request_id,
            'status': status,
            'latency_ms': latency_ms,
            'timestamp': timestamp,
        })
    
    def log_prediction(self, request_id: str, prediction: any,
                       ground_truth: any = None):
        self.prediction_log.append({
            'request_id': request_id,
            'prediction': prediction,
            'ground_truth': ground_truth,
        })
    
    def compute_availability(self, window_hours: int = 24) -> float:
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        recent = [r for r in self.request_log if r['timestamp'] >= cutoff]
        
        if not recent:
            return 1.0
        
        successful = sum(1 for r in recent if r['status'] == 'success')
        return successful / len(recent)
    
    def compute_latency_percentiles(self) -> dict:
        latencies = [r['latency_ms'] for r in self.request_log]
        
        if not latencies:
            return {}
        
        return {
            'p50': np.percentile(latencies, 50),
            'p95': np.percentile(latencies, 95),
            'p99': np.percentile(latencies, 99),
            'max': max(latencies),
            'avg': np.mean(latencies),
        }
    
    def compute_correctness(self) -> dict:
        labeled = [p for p in self.prediction_log if p['ground_truth'] is not None]
        
        if not labeled:
            return {'error': 'No labeled data available'}
        
        correct = sum(1 for p in labeled if p['prediction'] == p['ground_truth'])
        
        return {
            'accuracy': correct / len(labeled),
            'total_labeled': len(labeled),
        }
    
    def sli_slo_report(self) -> dict:
        return {
            'availability': {
                'sli': self.compute_availability(),
                'slo': 0.999,
                'met': self.compute_availability() >= 0.999,
            },
            'latency': {
                'sli': self.compute_latency_percentiles().get('p99', 0),
                'slo': 500,  # 500ms
                'met': self.compute_latency_percentiles().get('p99', 0) <= 500,
            },
            'correctness': {
                'sli': self.compute_correctness().get('accuracy', 0),
                'slo': 0.70,
                'met': self.compute_correctness().get('accuracy', 0) >= 0.70,
            },
        }

reliability = ReliabilityMetrics()

# Generate SLO report
slo_report = reliability.sli_slo_report()
for metric, values in slo_report.items():
    status = "MET" if values['met'] else "BREACHED"
    print(f"{metric}: SLI={values['sli']:.4f}, SLO={values['slo']}, Status={status}")
```

The SLI (Service Level Indicator) is what you measure. The SLO (Service Level Objective) is what you target. The error budget is the difference: `error_budget = 1 - SLO`. If your SLO is 99.9% availability, your error budget is 0.1%. You can spend that error budget on deployments, experiments, and maintenance. When the error budget is exhausted, you stop deploying and focus on reliability.

## Assessment

### Lab Task 1: A/B Testing Framework (Time: 90 minutes)

Build an A/B testing framework for comparing ML models.

**Steps:**
1. Implement the `ABTest` class with deterministic user assignment.
2. Implement `predict()` that routes to the correct model based on variant.
3. Implement `log_outcome()` for recording business metrics.
4. Implement `analyze_results()` with t-test, effect size, and confidence intervals.
5. Calculate minimum sample size needed for the test.
6. Run a simulated A/B test with 10,000 users and analyze results.

**Grading Criteria:**
- User assignment is deterministic and reproducible (15 points)
- Predictions route to correct model based on variant (10 points)
- Outcome logging captures all necessary data (10 points)
- Statistical analysis includes p-value, effect size, and CI (20 points)
- Sample size calculation is correct (15 points)
- Interpretation correctly identifies winner or lack of significance (15 points)
- Code handles edge cases (uneven splits, missing data) (15 points)

### Lab Task 2: Canary Deployment System (Time: 75 minutes)

Build a canary deployment system with automatic rollback.

**Steps:**
1. Implement `CanaryDeployment` with configurable traffic percentage.
2. Add automatic promotion based on evaluation interval.
3. Implement rollback triggered by metric regression.
4. Add logging for all deployment events.
5. Run a simulated canary deployment from 5% to 100% traffic.

**Grading Criteria:**
- Traffic routing is deterministic (15 points)
- Promotion increments traffic correctly (15 points)
- Rollback triggers on latency and error rate regression (20 points)
- All events are logged with timestamps (15 points)
- Deployment status is accurately tracked (15 points)
- Rollback happens within one evaluation interval (15 points)
- System handles concurrent deployments gracefully (5 points)

### Lab Task 3: Production Deployment Pipeline (Time: 60 minutes)

Build an end-to-end deployment pipeline.

**Steps:**
1. Implement `ProductionMLSystem` that orchestrates the full deployment cycle.
2. Add compliance checking before deployment.
3. Add shadow deployment phase.
4. Add canary deployment with automatic promotion.
5. Add rollback capability.
6. Run a complete deployment cycle from registration to production.

**Grading Criteria:**
- Pipeline executes all stages in correct order (15 points)
- Compliance check blocks non-compliant models (15 points)
- Shadow deployment runs before canary (15 points)
- Canary deployment promotes gradually (15 points)
- Rollback works when metrics degrade (15 points)
- Audit log captures all deployment events (15 points)
- Pipeline is idempotent (re-running produces same result) (10 points)

## Evidence

- `ab_testing.py`: A/B testing framework with statistical analysis
- `canary_deployment.py`: Canary deployment system with automatic rollback
- `shadow_deployment.py`: Shadow deployment with prediction comparison
- `feature_store.py`: Redis-backed feature store for production serving
- `model_rollback.py`: Rollback management with deployment history
- `production_ml_system.py`: End-to-end production deployment pipeline
- `sample_size_calculator.py`: Minimum sample size calculation for A/B tests
- `deployment_report.pdf`: Sample deployment report from a canary rollout
