# Module 10 — Production ML: A/B Testing, Canary, Rollback

## What You'll Actually Do

You'll implement safe deployment strategies for ML models. You'll run A/B tests, do canary releases, and build rollback mechanisms. Deploying without safeguards is reckless.

## Content

### A/B Testing Framework

```python
import numpy as np
from scipy import stats
import hashlib

class ABTestManager:
    def __init__(self):
        self.experiments = {}

    def create_experiment(self, name, model_a, model_b, traffic_split=0.5):
        self.experiments[name] = {
            "model_a": model_a,
            "model_b": model_b,
            "split": traffic_split,
            "results_a": [],
            "results_b": []
        }

    def route_request(self, experiment_name, request_id):
        exp = self.experiments[experiment_name]
        hash_val = int(hashlib.md5(request_id.encode()).hexdigest(), 16)
        if (hash_val % 100) / 100 < exp["split"]:
            return "a"
        return "b"

    def log_result(self, experiment_name, variant, prediction, latency):
        key = f"results_{variant}"
        self.experiments[experiment_name][key].append({
            "prediction": prediction,
            "latency": latency
        })

    def analyze(self, experiment_name):
        exp = self.experiments[experiment_name]
        results_a = exp["results_a"]
        results_b = exp["results_b"]

        latencies_a = [r["latency"] for r in results_a]
        latencies_b = [r["latency"] for r in results_b]

        t_stat, p_value = stats.ttest_ind(latencies_a, latencies_b)

        return {
            "model_a_mean_latency": np.mean(latencies_a),
            "model_b_mean_latency": np.mean(latencies_b),
            "p_value": p_value,
            "significant": p_value < 0.05,
            "recommendation": "B is faster" if np.mean(latencies_b) < np.mean(latencies_a) else "A is faster"
        }
```

### Canary Deployment

```python
import random
from datetime import datetime

class CanaryDeployer:
    def __init__(self, stable_model, canary_model):
        self.stable = stable_model
        self.canary = canary_model
        self.canary_traffic = 0.05  # Start with 5%
        self.max_canary_traffic = 1.0
        self.step_size = 0.05
        self.metrics_log = []

    def predict(self, features):
        if random.random() < self.canary_traffic:
            prediction = self.canary.predict(features)
            variant = "canary"
        else:
            prediction = self.stable.predict(features)
            variant = "stable"

        self.metrics_log.append({
            "timestamp": datetime.now().isoformat(),
            "variant": variant,
            "prediction": prediction.tolist()
        })
        return prediction

    def check_health(self, window=100):
        recent = self.metrics_log[-window:]
        canary_count = sum(1 for r in recent if r["variant"] == "canary")
        canary_ratio = canary_count / len(recent)

        # Simple health check: is canary performing similarly?
        return abs(canary_ratio - self.canary_traffic) < 0.1

    def promote_canary(self):
        self.canary_traffic = min(
            self.canary_traffic + self.step_size,
            self.max_canary_traffic
        )
        print(f"Canary traffic increased to {self.canary_traffic:.0%}")

    def rollback(self):
        self.canary_traffic = 0
        print("Canary rolled back to 0%")
```

### Automatic Rollback

```python
class AutoRollback:
    def __init__(self, deployer, metric_threshold, check_interval=100):
        self.deployer = deployer
        self.threshold = metric_threshold
        self.check_interval = check_interval
        self.baseline_metric = None

    def set_baseline(self, metric_value):
        self.baseline_metric = metric_value

    def check_and_act(self):
        if len(self.deployer.metrics_log) % self.check_interval != 0:
            return

        recent = self.deployer.metrics_log[-self.check_interval:]
        canary_metrics = [
            r for r in recent if r["variant"] == "canary"
        ]

        if not canary_metrics:
            return

        # Check error rate or latency spike
        error_rate = self._compute_error_rate(canary_metrics)

        if error_rate > self.threshold:
            self.deployer.rollback()
            self._alert(f"Auto-rollback triggered. Error rate: {error_rate:.3f}")

    def _compute_error_rate(self, metrics):
        # Simplified: count anomalous predictions
        errors = sum(1 for m in metrics if self._is_anomaly(m["prediction"]))
        return errors / len(metrics)

    def _is_anomaly(self, prediction):
        return prediction is None or (isinstance(prediction, float) and np.isnan(prediction))

    def _alert(self, message):
        print(f"ALERT: {message}")
```

### Production Traffic Simulator

```python
def simulate_production(deployer, n_requests=1000):
    results = []

    for i in range(n_requests):
        features = generate_random_features()
        start = time.time()
        prediction = deployer.predict(features)
        latency = time.time() - start

        results.append({
            "request_id": i,
            "latency": latency,
            "prediction": prediction.tolist()
        })

    latencies = [r["latency"] for r in results]
    print(f"Total requests: {n_requests}")
    print(f"Mean latency: {np.mean(latencies)*1000:.2f}ms")
    print(f"P99 latency: {np.percentile(latencies, 99)*1000:.2f}ms")

    return results
```

## Assessment

**Lab: Safe Deployment Pipeline**

Build an A/B testing framework that splits traffic between two models and computes statistical significance. Implement a canary deployer that starts at 5% traffic and ramps up. Add automatic rollback that triggers when error rate exceeds 10%. Simulate 500 requests and show the deployment progression.

- Time: 70 minutes
- Grading: A/B testing implementation (25%), canary deployment (25%), rollback logic (25%), simulation and analysis (25%)

## Evidence

Upload your deployment code, a log showing canary traffic progression, rollback trigger (if any), and analysis of A/B test results with statistical significance.
