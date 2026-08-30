# Module 5 — Model Monitoring: Drift Detection, Performance Degradation

## What You'll Actually Do

You'll build a monitoring system that detects when your model's performance degrades or when incoming data drifts from training data.

## Content

### Data Drift Detection with Evidently

```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset

column_mapping = ColumnMapping(
    target="target",
    numerical_features=["feature1", "feature2", "feature3"]
)

drift_report = Report(metrics=[DataDriftPreset()])
drift_report.run(
    reference_data=train_data,
    current_data=new_data,
    column_mapping=column_mapping
)
drift_report.save_html("drift_report.html")
```

### Custom Drift Detection

```python
from scipy import stats
import numpy as np

class DriftDetector:
    def __init__(self, reference_data, threshold=0.05):
        self.reference = reference_data
        self.threshold = threshold

    def check_drift(self, current_data):
        results = {}
        for col in self.reference.columns:
            stat, p_value = stats.ks_2samp(
                self.reference[col].dropna(),
                current_data[col].dropna()
            )
            results[col] = {
                "ks_statistic": stat,
                "p_value": p_value,
                "drifted": p_value < self.threshold
            }
        return results
```

### Performance Monitoring

```python
import time
from datetime import datetime
from collections import deque

class PerformanceMonitor:
    def __init__(self, window_size=1000):
        self.predictions = deque(maxlen=window_size)
        self.ground_truth = deque(maxlen=window_size)
        self.latencies = deque(maxlen=window_size)

    def log_prediction(self, pred, truth, latency):
        self.predictions.append(pred)
        self.ground_truth.append(truth)
        self.latencies.append(latency)

    def get_metrics(self):
        if len(self.predictions) == 0:
            return {}

        preds = np.array(self.predictions)
        truths = np.array(self.ground_truth)

        return {
            "accuracy": (preds == truths).mean(),
            "avg_latency_ms": np.mean(self.latencies) * 1000,
            "p99_latency_ms": np.percentile(self.latencies, 99) * 1000,
            "sample_count": len(self.predictions),
            "timestamp": datetime.now().isoformat()
        }
```

### Alerting Pipeline

```python
import smtplib
from email.mime.text import MIMEText

class AlertManager:
    def __init__(self, smtp_config):
        self.smtp = smtp_config
        self.alerts_sent = set()

    def check_and_alert(self, metrics, run_id):
        if metrics["accuracy"] < 0.85:
            self._send_alert(
                subject=f"Low accuracy: {metrics['accuracy']:.3f}",
                body=f"Model accuracy dropped below threshold.\nRun: {run_id}"
            )

        if metrics["p99_latency_ms"] > 200:
            self._send_alert(
                subject=f"High latency: {metrics['p99_latency_ms']:.1f}ms",
                body=f"P99 latency exceeded 200ms.\nRun: {run_id}"
            )

    def _send_alert(self, subject, body):
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = self.smtp["sender"]
        msg["To"] = self.smtp["recipient"]

        with smtplib.SMTP_SSL(self.smtp["host"], self.smtp["port"]) as server:
            server.login(self.smtp["user"], self.smtp["password"])
            server.send_message(msg)
```

## Assessment

**Lab: Build a Monitoring Dashboard**

Using the Iris dataset, train a model and simulate production traffic with gradually shifting data. Build a drift detection system using Evidently and a custom detector. Create a monitoring script that logs metrics to a JSON file every 100 predictions and triggers an alert when accuracy drops below 80%.

- Time: 60 minutes
- Grading: Drift detection implementation (30%), monitoring script (25%), alerting logic (25%), simulation of degradation (20%)

## Evidence

Upload your monitoring code, the generated drift report HTML, and your alert log showing at least 2 triggered alerts.
