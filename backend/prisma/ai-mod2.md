# Module 2 — MLOps Pipeline: Data Prep, Training, Deployment

## What You'll Actually Do

You'll build an end-to-end ML pipeline that takes raw data and outputs a deployed model. Manual steps are the enemy—automate everything.

## Content

### Pipeline with scikit-learn

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import GradientBoostingClassifier

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=10)),
    ('classifier', GradientBoostingClassifier())
])

pipeline.fit(X_train, y_train)
score = pipeline.score(X_test, y_test)
```

### Data Versioning with DVC

```bash
# Initialize DVC in your repo
dvc init
dvc add data/raw/dataset.csv

# Track data changes
git add data/raw/dataset.csv.dvc .gitignore
git commit -m "Add raw dataset"

# Pull data on another machine
dvc pull
```

### Experiment Tracking with MLflow

```python
import mlflow

with mlflow.start_run(run_name="baseline"):
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 5)

    model = GradientBoostingClassifier(n_estimators=100, max_depth=5)
    model.fit(X_train, y_train)

    mlflow.log_metric("accuracy", accuracy_score(y_test, y_pred))
    mlflow.sklearn.log_model(model, "model")
```

### Automated Training Script

```python
import yaml
from pathlib import Path

def load_config(config_path: str) -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)

def train(config: dict):
    data = load_data(config["data_path"])
    X_train, X_test, y_train, y_test = split(data)

    model = build_model(config["model"])
    model.fit(X_train, y_train)

    metrics = evaluate(model, X_test, y_test)
    log_experiment(config, metrics)
    save_model(model, config["output_path"])

if __name__ == "__main__":
    config = load_config("configs/train.yaml")
    train(config)
```

## Assessment

**Lab: Build a Repeatable Pipeline**

Create a complete ML pipeline with at least 4 steps: data loading, preprocessing, training, evaluation. Use `sklearn.pipeline.Pipeline` for the ML steps. Track experiments with MLflow. Save the final model and write a config file that controls all hyperparameters.

- Time: 60 minutes
- Grading: Pipeline correctness (30%), experiment tracking (25%), config-driven approach (25%), reproducibility (20%)

## Evidence

Upload your pipeline code, config file, MLflow run screenshot, and a brief note on how someone else could reproduce your results.
