# Module 5 — Model Monitoring

## If You Are Not Monitoring, You Are Flying Blind

A model in production degrades silently. The data it encounters drifts from the training distribution. The world changes—new fraud patterns emerge, user behavior shifts, upstream data pipelines break—and the model's predictions become less accurate over time. Without monitoring, you discover this months later when someone checks the dashboard and notices the fraud rate spiked. By then, you have lost real money and real trust.

This module covers the three pillars of production ML monitoring: data drift detection, performance monitoring, and operational monitoring. You will build monitoring systems that alert you before performance degrades, not after. You will implement statistical tests that detect when incoming data differs from training data. You will set up dashboards that show you, at a glance, whether your model is healthy or dying.

## Data Drift: When the World Changes Under Your Model

Data drift occurs when the statistical distribution of incoming data differs from the training data. The model was trained on one distribution and is now serving predictions on a different one. This causes accuracy to degrade, often without any error or warning.

There are three types of drift. Covariate drift is when the input features change distribution but the relationship between inputs and outputs stays the same. Concept drift is when the relationship between inputs and outputs changes. Prior probability drift is when the class distribution changes.

Detecting drift requires comparing the distribution of incoming data against a reference distribution. The Population Stability Index (PSI) is the standard metric. PSI measures how much the distribution has shifted. A PSI below 0.1 means no significant drift. Between 0.1 and 0.25 means moderate drift. Above 0.25 means significant drift that requires investigation.

```python
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Tuple
import warnings

class DriftDetector:
    def __init__(self, reference_data: pd.DataFrame, n_bins: int = 10):
        self.reference_data = reference_data
        self.n_bins = n_bins
        self.reference_distributions = {}
        self._compute_reference_distributions()
    
    def _compute_reference_distributions(self):
        for col in self.reference_data.columns:
            if self.reference_data[col].dtype in ['float64', 'int64']:
                self.reference_distributions[col] = {
                    'histogram': np.histogram(
                        self.reference_data[col].dropna(), bins=self.n_bins
                    )[0],
                    'edges': np.histogram(
                        self.reference_data[col].dropna(), bins=self.n_bins
                    )[1],
                    'mean': self.reference_data[col].mean(),
                    'std': self.reference_data[col].std(),
                }
    
    def compute_psi(
        self, reference: np.ndarray, current: np.ndarray, n_bins: int = 10
    ) -> float:
        eps = 1e-4
        
        # Create bins from reference data
        _, bin_edges = np.histogram(reference, bins=n_bins)
        
        ref_counts = np.histogram(reference, bins=bin_edges)[0] / len(reference)
        cur_counts = np.histogram(current, bins=bin_edges)[0] / len(current)
        
        # Add epsilon to avoid division by zero
        ref_counts = np.maximum(ref_counts, eps)
        cur_counts = np.maximum(cur_counts, eps)
        
        psi = np.sum((cur_counts - ref_counts) * np.log(cur_counts / ref_counts))
        return psi
    
    def compute_ks_test(
        self, reference: np.ndarray, current: np.ndarray
    ) -> Tuple[float, float]:
        statistic, p_value = stats.ks_2samp(reference, current)
        return statistic, p_value
    
    def compute_wasserstein_distance(
        self, reference: np.ndarray, current: np.ndarray
    ) -> float:
        return stats.wasserstein_distance(reference, current)
    
    def detect_drift(
        self, current_data: pd.DataFrame, threshold: float = 0.1
    ) -> Dict[str, Dict]:
        drift_results = {}
        
        for col in self.reference_distributions:
            if col not in current_data.columns:
                continue
            
            ref_values = self.reference_data[col].dropna().values
            cur_values = current_data[col].dropna().values
            
            if len(cur_values) == 0:
                continue
            
            psi = self.compute_psi(ref_values, cur_values)
            ks_stat, ks_p = self.compute_ks_test(ref_values, cur_values)
            wasserstein = self.compute_wasserstein_distance(ref_values, cur_values)
            
            drift_results[col] = {
                'psi': psi,
                'ks_statistic': ks_stat,
                'ks_p_value': ks_p,
                'wasserstein_distance': wasserstein,
                'reference_mean': self.reference_distributions[col]['mean'],
                'current_mean': np.mean(cur_values),
                'drifted': psi > threshold,
            }
        
        return drift_results
    
    def generate_report(self, drift_results: Dict) -> str:
        report = ["Drift Detection Report", "=" * 50]
        
        drifted_features = [
            col for col, result in drift_results.items() 
            if result['drifted']
        ]
        
        report.append(f"\nTotal features analyzed: {len(drift_results)}")
        report.append(f"Features with drift: {len(drifted_features)}")
        
        if drifted_features:
            report.append(f"\nDrifted features:")
            for col in drifted_features:
                r = drift_results[col]
                report.append(f"  {col}:")
                report.append(f"    PSI: {r['psi']:.4f}")
                report.append(f"    KS p-value: {r['ks_p_value']:.4f}")
                report.append(f"    Mean shift: {r['reference_mean']:.4f} -> {r['current_mean']:.4f}")
        
        return "\n".join(report)

# Usage
reference_data = X_train.copy()
detector = DriftDetector(reference_data)

# Check drift on new batch
current_data = pd.read_csv('data/transactions_week_52.csv')
drift_results = detector.detect_drift(current_data, threshold=0.1)
print(detector.generate_report(drift_results))
```

The PSI test is most sensitive to distribution shifts in the tails. The KS test is most sensitive to shifts in the median. The Wasserstein distance measures the total distance between distributions. Using all three gives you a complete picture of how the data has changed.

## Multivariate Drift Detection

Univariate drift detection examines each feature independently. But features are correlated, and drift can occur in the relationships between features even when individual features appear stable. Multivariate drift detection catches these cases.

```python
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class MultivariateDriftDetector:
    def __init__(self, reference_data: pd.DataFrame):
        self.reference_data = reference_data
        self.scaler = StandardScaler()
        self.reference_scaled = self.scaler.fit_transform(reference_data)
        
        # Fit isolation forest on reference data
        self.isolation_forest = IsolationForest(
            contamination=0.1, random_state=42
        )
        self.isolation_forest.fit(self.reference_scaled)
    
    def detect_drift(
        self, current_data: pd.DataFrame, threshold: float = 0.1
    ) -> Dict:
        current_scaled = self.scaler.transform(current_data)
        
        # Anomaly scores for current data
        scores = self.isolation_forest.score_samples(current_scaled)
        
        # Fraction of points that look like outliers
        outlier_fraction = (scores < -0.5).mean()
        
        # Reference outlier fraction
        ref_scores = self.isolation_forest.score_samples(self.reference_scaled)
        ref_outlier_fraction = (ref_scores < -0.5).mean()
        
        return {
            'outlier_fraction': outlier_fraction,
            'reference_outlier_fraction': ref_outlier_fraction,
            'drift_detected': outlier_fraction > threshold,
            'mean_anomaly_score': scores.mean(),
            'reference_mean_anomaly_score': ref_scores.mean(),
        }

multivariate_detector = MultivariateDriftDetector(X_train)
drift_result = multivariate_detector.detect_drift(current_data)
```

The isolation forest works by building random trees. Data points that are easy to isolate (require fewer splits) are more likely to be outliers. If a large fraction of current data points are flagged as outliers relative to the training data, the distribution has shifted.

## Performance Monitoring with Ground Truth Delay

The hardest part of monitoring model performance is that ground truth labels arrive late. A fraud prediction is confirmed as correct or incorrect days or weeks later when the investigation completes. This means you cannot compute accuracy in real-time—you need to track predictions and labels separately and join them later.

```python
from datetime import datetime, timedelta
import json
from collections import defaultdict

class PerformanceTracker:
    def __init__(self, performance_window_days: int = 30):
        self.performance_window = timedelta(days=performance_window_days)
        self.predictions = []
        self.labeled_results = []
    
    def log_prediction(
        self, prediction_id: str, features: dict, 
        prediction: int, probability: float,
        timestamp: datetime = None
    ):
        self.predictions.append({
            'prediction_id': prediction_id,
            'features': features,
            'prediction': prediction,
            'probability': probability,
            'timestamp': timestamp or datetime.utcnow(),
            'label_received': False,
        })
    
    def log_label(self, prediction_id: str, true_label: int):
        for pred in self.predictions:
            if pred['prediction_id'] == prediction_id:
                pred['true_label'] = true_label
                pred['label_received'] = True
                pred['label_timestamp'] = datetime.utcnow()
                break
    
    def compute_metrics(
        self, window_days: int = 7
    ) -> Dict[str, float]:
        cutoff = datetime.utcnow() - timedelta(days=window_days)
        
        labeled = [
            p for p in self.predictions
            if p['label_received'] and p['timestamp'] >= cutoff
        ]
        
        if len(labeled) == 0:
            return {'error': 'No labeled data available'}
        
        predictions = np.array([p['prediction'] for p in labeled])
        labels = np.array([p['true_label'] for p in labeled])
        
        tp = ((predictions == 1) & (labels == 1)).sum()
        fp = ((predictions == 1) & (labels == 0)).sum()
        tn = ((predictions == 0) & (labels == 0)).sum()
        fn = ((predictions == 0) & (labels == 1)).sum()
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        accuracy = (tp + tn) / len(labeled)
        
        return {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'accuracy': accuracy,
            'total_predictions': len(labeled),
            'positive_predictions': int(predictions.sum()),
            'positive_labels': int(labels.sum()),
        }
    
    def compute_daily_metrics(self, days: int = 30) -> pd.DataFrame:
        daily_metrics = []
        
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0)
            day_end = day_start + timedelta(days=1)
            
            day_labeled = [
                p for p in self.predictions
                if p['label_received']
                and day_start <= p['timestamp'] < day_end
            ]
            
            if len(day_labeled) > 0:
                predictions = np.array([p['prediction'] for p in day_labeled])
                labels = np.array([p['true_label'] for p in day_labeled])
                
                daily_metrics.append({
                    'date': day_start.date(),
                    'count': len(day_labeled),
                    'fraud_rate': labels.mean(),
                    'prediction_rate': predictions.mean(),
                    'accuracy': (predictions == labels).mean(),
                })
        
        return pd.DataFrame(daily_metrics)

tracker = PerformanceTracker()
# ... log predictions and labels ...
metrics = tracker.compute_metrics(window_days=7)
daily = tracker.compute_daily_metrics(days=30)
```

The `compute_daily_metrics` method lets you see trends over time. A gradual decline in accuracy over weeks indicates drift. A sudden drop indicates a pipeline break or data quality issue. Both require different responses, and the daily granularity helps distinguish between them.

## Alert Configuration: When to Wake Someone Up

Not every metric fluctuation requires a page. You need alert rules that distinguish between noise and genuine problems. The key is to set thresholds based on business impact, not statistical significance.

```python
from enum import Enum
from dataclasses import dataclass
from typing import Callable, List

class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class AlertRule:
    name: str
    metric_fn: Callable
    threshold: float
    severity: Severity
    comparison: str = "lt"  # lt, gt, eq
    window_minutes: int = 60
    min_samples: int = 100
    
    def check(self, data: pd.DataFrame) -> bool:
        metric_value = self.metric_fn(data)
        
        if metric_value is None:
            return False
        
        if self.comparison == "lt":
            return metric_value < self.threshold
        elif self.comparison == "gt":
            return metric_value > self.threshold
        elif self.comparison == "eq":
            return metric_value == self.threshold
        
        return False

class AlertManager:
    def __init__(self):
        self.rules = []
        self.alert_history = []
    
    def add_rule(self, rule: AlertRule):
        self.rules.append(rule)
    
    def check_all_rules(self, data: pd.DataFrame) -> List[Dict]:
        triggered = []
        
        for rule in self.rules:
            if rule.check(data):
                alert = {
                    'rule': rule.name,
                    'severity': rule.severity.value,
                    'timestamp': datetime.utcnow(),
                    'metric_value': rule.metric_fn(data),
                    'threshold': rule.threshold,
                }
                triggered.append(alert)
                self.alert_history.append(alert)
        
        return triggered
    
    def send_alert(self, alert: Dict):
        if alert['severity'] == Severity.CRITICAL.value:
            self._page_oncall(alert)
        elif alert['severity'] == Severity.WARNING.value:
            self._send_slack(alert)
        else:
            self._log_only(alert)
    
    def _page_oncall(self, alert: Dict):
        print(f"PAGE: {alert['rule']} - {alert['metric_value']}")
        # Integration with PagerDuty, OpsGenie, etc.
    
    def _send_slack(self, alert: Dict):
        print(f"SLACK: {alert['rule']} - {alert['metric_value']}")
        # Integration with Slack API
    
    def _log_only(self, alert: Dict):
        print(f"INFO: {alert['rule']} - {alert['metric_value']}")

alert_manager = AlertManager()

alert_manager.add_rule(AlertRule(
    name="low_f1_score",
    metric_fn=lambda data: compute_f1(data),
    threshold=0.70,
    severity=Severity.CRITICAL,
    comparison="lt",
    min_samples=200
))

alert_manager.add_rule(AlertRule(
    name="high_drift_psi",
    metric_fn=lambda data: compute_max_psi(data),
    threshold=0.25,
    severity=Severity.WARNING,
    comparison="gt"
))

alert_manager.add_rule(AlertRule(
    name="prediction_rate_drop",
    metric_fn=lambda data: compute_prediction_rate(data),
    threshold=0.01,
    severity=Severity.WARNING,
    comparison="lt"
))
```

The `min_samples` parameter prevents false alerts from small samples. If you have only 10 predictions in an hour and 2 are correct, your accuracy is 20%—but that is not statistically meaningful. Requiring 200 samples before alerting avoids this noise.

## Operational Monitoring: Latency, Errors, and Throughput

Beyond model quality, you need to monitor the serving infrastructure. Latency tells you how long predictions take. Error rate tells you how often requests fail. Throughput tells you how many requests per second the system handles. Together, these tell you whether the service is healthy.

```python
import time
from contextlib import contextmanager
from collections import deque
import threading

class OperationalMonitor:
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.latencies = deque(maxlen=window_size)
        self.errors = deque(maxlen=window_size)
        self.request_count = 0
        self.error_count = 0
        self.start_time = time.time()
        self._lock = threading.Lock()
    
    @contextmanager
    def track_latency(self):
        start = time.time()
        try:
            yield
        finally:
            latency = (time.time() - start) * 1000  # ms
            with self._lock:
                self.latencies.append(latency)
                self.request_count += 1
    
    def record_error(self, error_type: str):
        with self._lock:
            self.errors.append({
                'type': error_type,
                'timestamp': time.time()
            })
            self.error_count += 1
    
    def get_metrics(self) -> Dict:
        with self._lock:
            latencies = list(self.latencies)
            
            if not latencies:
                return {'error': 'No data'}
            
            latencies_arr = np.array(latencies)
            
            uptime = time.time() - self.start_time
            
            return {
                'p50_latency_ms': np.percentile(latencies_arr, 50),
                'p95_latency_ms': np.percentile(latencies_arr, 95),
                'p99_latency_ms': np.percentile(latencies_arr, 99),
                'max_latency_ms': np.max(latencies_arr),
                'avg_latency_ms': np.mean(latencies_arr),
                'throughput_rps': self.request_count / uptime if uptime > 0 else 0,
                'error_rate': self.error_count / self.request_count if self.request_count > 0 else 0,
                'total_requests': self.request_count,
                'total_errors': self.error_count,
            }
    
    def check_sla(self, sla_config: Dict) -> Dict:
        metrics = self.get_metrics()
        violations = []
        
        if metrics.get('p99_latency_ms', 0) > sla_config.get('max_p99_latency_ms', 500):
            violations.append('p99_latency')
        
        if metrics.get('error_rate', 0) > sla_config.get('max_error_rate', 0.01):
            violations.append('error_rate')
        
        if metrics.get('p95_latency_ms', 0) > sla_config.get('max_p95_latency_ms', 200):
            violations.append('p95_latency')
        
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'metrics': metrics
        }

monitor = OperationalMonitor(window_size=10000)

# In your prediction endpoint
@app.post("/predict")
async def predict(request: PredictionRequest):
    with monitor.track_latency():
        try:
            result = model.predict(request.features)
            return result
        except Exception as e:
            monitor.record_error(type(e).__name__)
            raise

# Check SLA compliance
sla_config = {
    'max_p99_latency_ms': 500,
    'max_p95_latency_ms': 200,
    'max_error_rate': 0.01,
}

sla_status = monitor.check_sla(sla_config)
if not sla_status['compliant']:
    print(f"SLA violations: {sla_status['violations']}")
```

## Building the Monitoring Dashboard

All these metrics need to be visualized. A monitoring dashboard gives you a single view of model health. The key metrics are: prediction distribution over time, feature distributions, performance metrics (with ground truth), and operational metrics.

```python
import json
from pathlib import Path
from datetime import datetime

class MonitoringDashboard:
    def __init__(self, output_dir: str = 'monitoring'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_snapshot(
        self, 
        operational_metrics: Dict,
        drift_results: Dict,
        performance_metrics: Dict,
        alert_history: List[Dict]
    ) -> str:
        snapshot = {
            'timestamp': datetime.utcnow().isoformat(),
            'operational': operational_metrics,
            'drift': {
                'features_with_drift': sum(
                    1 for r in drift_results.values() 
                    if r.get('drifted', False)
                ),
                'total_features': len(drift_results),
                'max_psi': max(
                    (r.get('psi', 0) for r in drift_results.values()),
                    default=0
                ),
            },
            'performance': performance_metrics,
            'alerts': {
                'total': len(alert_history),
                'critical': sum(
                    1 for a in alert_history 
                    if a['severity'] == 'critical'
                ),
                'recent': alert_history[-5:] if alert_history else [],
            },
            'health_score': self._compute_health_score(
                operational_metrics, drift_results, performance_metrics
            )
        }
        
        # Save snapshot
        filename = f"snapshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(snapshot, f, indent=2, default=str)
        
        return str(filepath)
    
    def _compute_health_score(
        self, operational: Dict, drift: Dict, performance: Dict
    ) -> float:
        score = 100.0
        
        # Deductions for operational issues
        p99 = operational.get('p99_latency_ms', 0)
        if p99 > 500:
            score -= 20
        elif p99 > 200:
            score -= 10
        
        error_rate = operational.get('error_rate', 0)
        if error_rate > 0.05:
            score -= 30
        elif error_rate > 0.01:
            score -= 15
        
        # Deductions for drift
        drift_fraction = (
            drift.get('features_with_drift', 0) / 
            max(drift.get('total_features', 1), 1)
        )
        score -= drift_fraction * 20
        
        # Deductions for performance
        f1 = performance.get('f1', 1.0)
        if f1 < 0.6:
            score -= 30
        elif f1 < 0.7:
            score -= 15
        
        return max(0.0, min(100.0, score))
    
    def generate_html_report(self, snapshot: Dict) -> str:
        html = f"""
        <html>
        <head><title>ML Monitoring Report</title></head>
        <body>
        <h1>ML Model Health Report</h1>
        <p>Generated: {snapshot['timestamp']}</p>
        <p>Health Score: {snapshot['health_score']:.1f}/100</p>
        
        <h2>Operational Metrics</h2>
        <ul>
            <li>P50 Latency: {snapshot['operational'].get('p50_latency_ms', 'N/A'):.1f} ms</li>
            <li>P95 Latency: {snapshot['operational'].get('p95_latency_ms', 'N/A'):.1f} ms</li>
            <li>P99 Latency: {snapshot['operational'].get('p99_latency_ms', 'N/A'):.1f} ms</li>
            <li>Error Rate: {snapshot['operational'].get('error_rate', 0):.2%}</li>
            <li>Throughput: {snapshot['operational'].get('throughput_rps', 0):.1f} req/s</li>
        </ul>
        
        <h2>Data Drift</h2>
        <ul>
            <li>Features with drift: {snapshot['drift']['features_with_drift']}/{snapshot['drift']['total_features']}</li>
            <li>Max PSI: {snapshot['drift']['max_psi']:.4f}</li>
        </ul>
        
        <h2>Performance</h2>
        <ul>
            <li>F1 Score: {snapshot['performance'].get('f1', 'N/A')}</li>
            <li>Precision: {snapshot['performance'].get('precision', 'N/A')}</li>
            <li>Recall: {snapshot['performance'].get('recall', 'N/A')}</li>
        </ul>
        
        <h2>Alerts</h2>
        <p>Total alerts: {snapshot['alerts']['total']}</p>
        <p>Critical alerts: {snapshot['alerts']['critical']}</p>
        </body>
        </html>
        """
        
        report_path = self.output_dir / 'latest_report.html'
        with open(report_path, 'w') as f:
            f.write(html)
        
        return str(report_path)

dashboard = MonitoringDashboard('monitoring')
```

## Automated Retraining Triggers

Monitoring alone is not enough. You need automated responses to detected issues. When drift exceeds a threshold, the system should trigger retraining. When performance drops below a threshold, the system should alert and potentially roll back. When data quality degrades, the system should pause the pipeline.

The retraining trigger is the most important automated response. When the monitoring system detects significant drift, it should automatically start a retraining pipeline with the latest data. The retrained model goes through the standard evaluation and deployment process. This creates a closed loop where the system self-corrects without human intervention.

```python
class RetrainingTrigger:
    def __init__(self, pipeline_factory, alert_manager):
        self.pipeline_factory = pipeline_factory
        self.alert_manager = alert_manager
        self.last_retraining = None
        self.cooldown_hours = 24
    
    def check_and_trigger(self, monitoring_results: dict):
        should_retrain = False
        reasons = []
        
        # Check drift
        if monitoring_results.get('drift', {}).get('max_psi', 0) > 0.25:
            should_retrain = True
            reasons.append(f"High drift: PSI={monitoring_results['drift']['max_psi']:.4f}")
        
        # Check performance
        perf = monitoring_results.get('performance', {})
        if perf.get('f1', 1.0) < 0.70:
            should_retrain = True
            reasons.append(f"Low F1: {perf['f1']:.4f}")
        
        # Check prediction rate
        pred_rate = monitoring_results.get('operational', {}).get('prediction_rate', 1.0)
        if pred_rate < 0.01:
            should_retrain = True
            reasons.append(f"Low prediction rate: {pred_rate:.4f}")
        
        # Cooldown check
        if should_retrain and self.last_retraining:
            hours_since = (datetime.utcnow() - self.last_retraining).total_seconds() / 3600
            if hours_since < self.cooldown_hours:
                print(f"Retraining skipped: cooldown ({hours_since:.1f}h < {self.cooldown_hours}h)")
                return False
        
        if should_retrain:
            self.alert_manager.send_alert({
                'rule': 'retraining_triggered',
                'severity': 'warning',
                'reasons': reasons,
            })
            
            pipeline = self.pipeline_factory()
            pipeline.run()
            self.last_retraining = datetime.utcnow()
            return True
        
        return False

class ModelRollbackTrigger:
    def __init__(self, rollback_fn, performance_threshold=0.65):
        self.rollback_fn = rollback_fn
        self.performance_threshold = performance_threshold
        self.consecutive_failures = 0
        self.failure_threshold = 3
    
    def check_performance(self, metrics: dict):
        f1 = metrics.get('f1', 1.0)
        
        if f1 < self.performance_threshold:
            self.consecutive_failures += 1
            print(f"Performance below threshold: {f1:.4f} "
                  f"(failure {self.consecutive_failures}/{self.failure_threshold})")
            
            if self.consecutive_failures >= self.failure_threshold:
                self.rollback_fn()
                self.consecutive_failures = 0
                return True
        else:
            self.consecutive_failures = 0
        
        return False
```

The cooldown period prevents retraining storms. Without it, a persistent drift detection would trigger retraining every hour, consuming resources without benefit. The cooldown ensures the system gives the new model time to stabilize before considering another retraining.

The consecutive failure threshold for rollback prevents false positives. A single bad evaluation might be noise. Three consecutive bad evaluations indicate a genuine problem. This reduces unnecessary rollbacks while still catching real performance degradation.

## Monitoring Best Practices

Production ML monitoring requires discipline. Here are the practices that separate reliable ML systems from fragile ones.

First, monitor at multiple levels. Monitor the infrastructure (CPU, GPU, memory, disk). Monitor the serving layer (latency, throughput, error rate). Monitor the model (prediction distribution, feature distributions, performance metrics). Each level reveals different problems.

Second, set alert thresholds based on business impact, not statistical significance. A 1% drop in F1 might be statistically significant but not worth investigating. A 10% drop in F1 is worth immediate attention. Calibrate thresholds to the business cost of the problem.

Third, maintain a monitoring dashboard that you check daily. The dashboard should show trends over time, not just current values. A model that has been slowly degrading for weeks is a different problem than a model that suddenly broke. Trends indicate drift. Sudden changes indicate pipeline failures.

Fourth, log everything. You cannot debug a problem you cannot see. Log predictions, features, latencies, errors, and model versions. When a user reports a bad prediction, you need to trace it back to the exact model version, the exact features, and the exact data that produced it.

Fifth, test your monitoring system. Send synthetic data with known drift and verify that your drift detection catches it. Send data with known labels and verify that your performance monitoring computes the correct metrics. A monitoring system that does not work is worse than no monitoring system because it gives you false confidence.

Sixth, establish on-call rotations. Someone must be responsible for monitoring alerts 24/7. In production, ML issues do not wait for business hours. A model that starts making wrong predictions at 2 AM loses money until someone fixes it. The on-call engineer should have runbooks for common issues: how to roll back a model, how to adjust alert thresholds, how to restart a serving instance.

The monitoring system should integrate with your incident management platform (PagerDuty, OpsGenie, etc.) so that alerts automatically create incidents and notify the on-call engineer. Without this integration, alerts go to email or Slack and are ignored until someone notices them hours later.

The on-call engineer needs three things: access to dashboards showing current model health, access to runbooks describing common issues and their fixes, and access to the deployment system to execute rollbacks. Without all three, the on-call engineer cannot respond effectively to incidents. Invest in on-call tooling before you need it—setting up dashboards during an incident is too late.

## Assessment

### Lab Task 1: Build a Drift Detection System (Time: 90 minutes)

Implement univariate and multivariate drift detection.

**Steps:**
1. Implement PSI computation for numerical features.
2. Implement the KS test for distribution comparison.
3. Implement Wasserstein distance computation.
4. Build a `DriftDetector` class that analyzes all features and generates a report.
5. Implement multivariate drift detection using Isolation Forest.
6. Test with synthetic data that has controlled drift injected into specific features.
7. Generate a drift report identifying which features drifted and by how much.

**Grading Criteria:**
- PSI computed correctly with appropriate binning (15 points)
- KS test correctly identifies distribution shifts (10 points)
- Wasserstein distance correctly measures total distribution shift (10 points)
- Report correctly identifies drifted features (15 points)
- Multivariate detector catches correlation changes (15 points)
- Synthetic drift test demonstrates detection (15 points)
- Report is readable and actionable (10 points)
- Code handles edge cases (empty data, single feature) (10 points)

### Lab Task 2: Performance Monitoring with Delayed Labels (Time: 75 minutes)

Build a performance tracking system that handles delayed ground truth.

**Steps:**
1. Implement a `PerformanceTracker` class that logs predictions and labels separately.
2. Compute precision, recall, F1, and accuracy from matched prediction-label pairs.
3. Compute daily metrics over a 30-day window.
4. Handle the case where labels have not arrived yet.
5. Generate a trend report showing metric changes over time.

**Grading Criteria:**
- Predictions and labels are stored and joined correctly (20 points)
- Metrics are computed accurately from matched pairs (20 points)
- Daily granularity captures temporal trends (15 points)
- Missing labels are handled gracefully (15 points)
- Trend report identifies performance degradation (15 points)
- Code is thread-safe for concurrent prediction logging (15 points)

### Lab Task 3: Alert System and Dashboard (Time: 60 minutes)

Build an alert system and monitoring dashboard.

**Steps:**
1. Implement `AlertRule` and `AlertManager` classes.
2. Create rules for F1 score, drift PSI, prediction rate, and latency.
3. Implement different severity levels (info, warning, critical).
4. Build a `MonitoringDashboard` that generates JSON snapshots and HTML reports.
5. Compute a health score that combines operational, drift, and performance metrics.

**Grading Criteria:**
- Alert rules fire at correct thresholds (20 points)
- Severity levels trigger appropriate responses (15 points)
- Dashboard generates accurate JSON snapshots (15 points)
- HTML report is readable and complete (15 points)
- Health score correctly weights different factors (15 points)
- Dashboard handles missing metrics gracefully (10 points)
- Code is modular and testable (10 points)

## Evidence

- `drift_detector.py` — Drift detection module with PSI, KS, and Wasserstein tests
- `multivariate_drift.py` — Multivariate drift detection using Isolation Forest
- `performance_tracker.py` — Performance tracking with delayed label handling
- `alert_manager.py` — Alert system with configurable rules and severity levels
- `monitoring_dashboard.py` — Dashboard generating JSON snapshots and HTML reports
- `monitoring_config.json` — Alert thresholds and SLA configuration
- `drift_report_sample.json` — Sample drift detection report from synthetic test
