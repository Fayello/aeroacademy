# Module 9 — ML Governance: Model Registry, Versioning, Audit

## What You'll Actually Do

You'll build a model registry that tracks every model version, its lineage, metrics, and approval status. Governance isn't bureaucracy—it's accountability.

## Content

### Model Registry with MLflow

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register a model
model_uri = "runs:/<run_id>/model"
result = mlflow.register_model(model_uri, "credit-scoring-model")

# Add metadata
client.update_model_version(
    name="credit-scoring-model",
    version=result.version,
    description="v1.2 - Retrained with 2024 Q3 data"
)

# Transition to staging
client.transition_model_version_stage(
    name="credit-scoring-model",
    version=result.version,
    stage="Staging"
)

# Add tags for audit trail
client.set_model_version_tag(
    name="credit-scoring-model",
    version=result.version,
    key="approved_by",
    value="ml-lead@company.com"
)

client.set_model_version_tag(
    name="credit-scoring-model",
    version=result.version,
    key="fairness_audit",
    value="passed"
)
```

### Custom Model Registry

```python
import json
from datetime import datetime
from pathlib import Path

class ModelRegistry:
    def __init__(self, registry_path="./model_registry"):
        self.path = Path(registry_path)
        self.path.mkdir(exist_ok=True)

    def register(self, model_name, model_path, metadata):
        version_dir = self.path / model_name
        version_dir.mkdir(exist_ok=True)

        # Auto-increment version
        existing = list(version_dir.glob("v*"))
        version = len(existing) + 1

        model_dir = version_dir / f"v{version}"
        model_dir.mkdir(exist_ok=True)

        # Copy model
        import shutil
        shutil.copy(model_path, model_dir / "model.pkl")

        # Save metadata
        metadata["version"] = version
        metadata["registered_at"] = datetime.now().isoformat()
        metadata["status"] = "registered"

        with open(model_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        return version

    def get_version(self, model_name, version):
        metadata_path = (
            self.path / model_name / f"v{version}" / "metadata.json"
        )
        with open(metadata_path) as f:
            return json.load(f)

    def list_versions(self, model_name):
        versions = []
        model_dir = self.path / model_name
        for v_dir in sorted(model_dir.iterdir()):
            if v_dir.is_dir() and v_dir.name.startswith("v"):
                with open(v_dir / "metadata.json") as f:
                    versions.append(json.load(f))
        return versions

    def transition(self, model_name, version, stage, approved_by):
        metadata = self.get_version(model_name, version)
        metadata["status"] = stage
        metadata["transitioned_at"] = datetime.now().isoformat()
        metadata["approved_by"] = approved_by

        path = (
            self.path / model_name / f"v{version}" / "metadata.json"
        )
        with open(path, "w") as f:
            json.dump(metadata, f, indent=2)
```

### Audit Trail

```python
class AuditLogger:
    def __init__(self, log_path="audit_log.jsonl"):
        self.log_path = log_path

    def log_event(self, event_type, model_name, version, details):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "model_name": model_name,
            "version": version,
            "details": details
        }

        with open(self.log_path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def log_training(self, model_name, version, params, metrics):
        self.log_event(
            "model_trained", model_name, version,
            {"params": params, "metrics": metrics}
        )

    def log_deployment(self, model_name, version, environment):
        self.log_event(
            "model_deployed", model_name, version,
            {"environment": environment}
        )

    def log_prediction(self, model_name, version, input_hash, output):
        self.log_event(
            "prediction_made", model_name, version,
            {"input_hash": input_hash, "output": output}
        )
```

### Lineage Tracking

```python
def log_lineage(model_name, version, data_source, training_run, parent_version=None):
    lineage = {
        "model": model_name,
        "version": version,
        "data_source": data_source,
        "training_run": training_run,
        "parent_version": parent_version,
        "created_at": datetime.now().isoformat(),
        "dependencies": {
            "python": "3.11.0",
            "sklearn": "1.3.0",
            "training_data_hash": compute_hash(data_source)
        }
    }
    return lineage
```

## Assessment

**Lab: Build a Model Registry**

Create a custom model registry that supports registration, versioning, status transitions, and audit logging. Register at least 3 model versions with different metadata. Write a script that queries the registry to show version history and audit trail.

- Time: 55 minutes
- Grading: Registry implementation (30%), versioning logic (25%), audit logging (25%), query/reporting functionality (20%)

## Evidence

Upload your registry code, a sample audit log, and a screenshot or output showing version history for a model with at least 3 versions.
