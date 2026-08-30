# Module 3 — Model Training: Hyperparameters, Distributed Training

## What You'll Actually Do

You'll tune hyperparameters systematically—not by guessing—and understand how to scale training across multiple cores or GPUs.

## Content

### Grid Search vs Random Search

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 20, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# Grid search — exhaustive but slow
grid = GridSearchCV(
    RandomForestClassifier(), param_grid,
    cv=5, scoring='f1', n_jobs=-1
)
grid.fit(X_train, y_train)

# Random search — faster, often just as good
random = RandomizedSearchCV(
    RandomForestClassifier(), param_grid,
    n_iter=50, cv=5, scoring='f1', n_jobs=-1,
    random_state=42
)
random.fit(X_train, y_train)
```

### Bayesian Optimization with Optuna

```python
import optuna

def objective(trial):
    n_estimators = trial.suggest_int('n_estimators', 50, 300)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 20)

    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split
    )

    scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
    return scores.mean()

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
print(study.best_params)
```

### Distributed Training with PyTorch DDP

```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def setup(rank, world_size):
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

def train(rank, world_size):
    setup(rank, world_size)
    model = MyModel().to(rank)
    ddp_model = DDP(model, device_ids=[rank])

    optimizer = torch.optim.Adam(ddp_model.parameters(), lr=1e-3)

    for epoch in range(epochs):
        for batch in dataloader:
            optimizer.zero_grad()
            output = ddp_model(batch)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

    dist.destroy_process_group()
```

### Early Stopping

```python
from sklearn.utils._runtime选拸 import _validate_params

class EarlyStopping:
    def __init__(self, patience=5, min_delta=0.001):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None

    def __call__(self, val_loss):
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                return True
        else:
            self.best_loss = val_loss
            self.counter = 0
        return False
```

## Assessment

**Lab: Hyperparameter Optimization**

Train a GradientBoostingClassifier on the Ames housing dataset (regression). Use Optuna with at least 50 trials to optimize hyperparameters. Compare results against a baseline with default parameters. Report the best parameters and the improvement in R² score.

- Time: 50 minutes
- Grading: Optuna implementation (30%), baseline comparison (25%), parameter analysis (25%), code quality (20%)

## Evidence

Upload your notebook showing Optuna optimization history, parameter importance plot, and comparison table of baseline vs tuned model.
