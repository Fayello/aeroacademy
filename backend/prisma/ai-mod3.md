# Module 3: Model Training

## Training Is Not Just `model.fit()`

Fitting a model to data is the simplest part of the ML workflow. The hard part is choosing the right model configuration, scaling training to handle datasets that do not fit in memory, and making the entire process reproducible. This module covers hyperparameter tuning strategies that go beyond brute-force grid search, distributed training architectures for large-scale problems, and the practical decisions that determine whether your model trains in minutes or days.

You will work with datasets that force you to think about memory, compute, and parallelism. You will learn when to use random search versus Bayesian optimization, how to split training across multiple GPUs, and how to checkpoint long-running training jobs so you do not lose hours of progress when a machine reboots. The goal is to build training infrastructure that scales from a single experiment to hundreds of concurrent training jobs without losing reproducibility or wasting compute.

## Hyperparameter Tuning: Beyond Grid Search

Grid search is the naive approach to hyperparameter tuning. You define a grid of parameter values, train a model for every combination, and pick the best one. It works, but it scales terribly. If you have 5 parameters with 10 values each, that is 100,000 combinations. Even with parallelism, this takes too long for real problems. Grid search also wastes time exploring parameter combinations where the unimportant parameters vary while the important ones stay fixed.

Random search is surprisingly better. It samples parameter combinations randomly from the same space. The reason it works is that most hyperparameters matter more than others. A study by Bergstra and Bengio showed that random search finds better models than grid search in the same number of iterations because it explores more values of the important parameters. Grid search wastes iterations on unimportant parameters.

The intuition is straightforward. If learning rate matters much more than min_samples_leaf, grid search tries 10 values of min_samples_leaf at each learning rate value. Random search tries 10 different learning rate values, each with a random min_samples_leaf. Since learning rate is what matters, random search finds a better value.

```python
import numpy as np
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from scipy.stats import randint, uniform

param_distributions = {
    'n_estimators': randint(50, 500),
    'max_depth': randint(3, 15),
    'learning_rate': uniform(0.01, 0.3),
    'min_samples_leaf': randint(1, 50),
    'min_samples_split': randint(2, 50),
    'subsample': uniform(0.6, 0.4),
    'max_features': uniform(0.3, 0.7),
}

random_search = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=42),
    param_distributions,
    n_iter=100,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
    scoring='f1',
    n_jobs=-1,
    random_state=42,
    verbose=1
)

random_search.fit(X_train, y_train)
print(f"Best F1: {random_search.best_score_:.4f}")
print(f"Best params: {random_search.best_params_}")
```

Bayesian optimization goes further. It builds a probabilistic model of the objective function and uses it to choose the next parameter combination to evaluate. Each iteration, it balances exploring parameter regions with high uncertainty (exploration) and exploiting regions known to perform well (exploitation). This converges to the optimal parameters in fewer iterations than random search.

The surrogate model (usually a Gaussian process or tree-structured Parzen estimator) learns the relationship between parameters and performance. It predicts which parameter combination will yield the best performance and evaluates that combination. After each evaluation, it updates its model and predicts again. This feedback loop makes each iteration more informed than the last.

```python
from skopt import BayesSearchCV
from skopt.space import Real, Integer, Categorical

bayes_space = {
    'n_estimators': Integer(50, 500),
    'max_depth': Integer(3, 15),
    'learning_rate': Real(0.01, 0.3, prior='log-uniform'),
    'min_samples_leaf': Integer(1, 50),
    'min_samples_split': Integer(2, 50),
    'subsample': Real(0.6, 1.0),
}

bayes_search = BayesSearchCV(
    GradientBoostingClassifier(random_state=42),
    bayes_space,
    n_iter=50,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
    scoring='f1',
    n_jobs=-1,
    random_state=42,
    n_points=10,
    verbose=1
)

bayes_search.fit(X_train, y_train)
```

The `n_points=10` parameter evaluates 10 parameter combinations in parallel at each iteration. Bayesian optimization still benefits from parallelism because you can evaluate multiple points simultaneously while the surrogate model updates after each batch. This is faster than sequential evaluation but slower than pure random search in terms of wall-clock time per iteration.

The `log-uniform` prior for learning rate is important. Learning rate varies over orders of magnitude (0.001 to 0.1), so a uniform prior would waste most evaluations on the high end. A log-uniform prior distributes evaluations evenly across orders of magnitude.

## Asynchronous Hyperparameter Search with Optuna

Optuna takes a different approach. Instead of wrapping a search algorithm around a scikit-learn estimator, you write a training function that returns a metric, and Optuna optimizes it. This decouples the search from the model, making it easier to tune models that do not fit scikit-learn's API.

Optuna's key innovation is the pruner. During cross-validation, if a trial is performing poorly at an intermediate epoch, the pruner stops it early and allocates resources to more promising trials. This is particularly valuable for deep learning, where training a single model to completion might take hours.

```python
import optuna
from sklearn.model_selection import cross_val_score

def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 50),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'max_features': trial.suggest_float('max_features', 0.3, 1.0),
    }
    
    model = GradientBoostingClassifier(**params, random_state=42)
    
    scores = cross_val_score(
        model, X_train, y_train,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        scoring='f1',
        n_jobs=-1
    )
    
    return scores.mean()

study = optuna.create_study(
    direction='maximize',
    sampler=optuna.samplers.TPESampler(seed=42),
    pruner=optuna.pruners.MedianPruner(n_warmup_steps=10)
)

study.optimize(
    objective, 
    n_trials=100, 
    timeout=3600,  # 1 hour timeout
    n_jobs=4,
    show_progress_bar=True
)

print(f"Best F1: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")

# Visualize the optimization history
optuna.visualization.plot_optimization_history(study)
optuna.visualization.plot_param_importances(study)
optuna.visualization.plot_slice(study)
```

The `MedianPruner` is critical for efficiency. It monitors intermediate cross-validation scores and stops trials that are performing worse than the median at the same iteration. This saves compute by killing unpromising configurations early. The `timeout` parameter ensures the search completes within a fixed time budget, which is essential when you are paying for GPU or cluster time.

The visualization tools help you understand the optimization process. The optimization history plot shows how the best score improves over trials. The parameter importance plot shows which parameters matter most. The slice plot shows the relationship between each parameter and the objective. These visualizations guide your intuition about the model and help you design better parameter spaces for future searches.

## Learning Rate Schedules

The learning rate controls how much each tree contributes to the final prediction. A high learning rate means each tree has a large impact, which can lead to overfitting. A low learning rate means each tree has a small impact, which requires more trees but produces a smoother, more generalizable model.

But a fixed learning rate is suboptimal. You want a high learning rate early when the model has much to learn, and a low learning rate later when the model is fine-tuning. Learning rate schedules achieve this. The schedule determines how the learning rate changes over training iterations.

Step decay reduces the learning rate by a factor (usually 0.1) every N epochs. This is simple but effective. Cosine annealing smoothly reduces the learning rate following a cosine curve. This avoids the abrupt changes of step decay and often produces better results.

```python
from sklearn.ensemble import GradientBoostingClassifier
import numpy as np

class WarmStartingClassifier:
    def __init__(self, max_rounds=500, learning_rate=0.1, patience=20):
        self.max_rounds = max_rounds
        self.learning_rate = learning_rate
        self.patience = patience
        self.best_model = None
        self.best_score = -np.inf
        self.rounds_without_improvement = 0
    
    def fit(self, X, y):
        self.classes_ = np.unique(y)
        self.estimators_ = []
        
        # Initial prediction (mean of targets)
        y_pred = np.full(len(y), y.mean())
        
        for i in range(self.max_rounds):
            # Compute pseudo-residuals
            residuals = y - y_pred
            
            # Fit a small tree to the residuals
            from sklearn.tree import DecisionTreeRegressor
            tree = DecisionTreeRegressor(max_depth=3)
            tree.fit(X, residuals)
            
            # Update predictions
            y_pred += self.learning_rate * tree.predict(X)
            
            self.estimators_.append(tree)
            
            # Early stopping
            if i % 10 == 0:
                from sklearn.metrics import f1_score
                y_class = (y_pred > 0.5).astype(int)
                score = f1_score(y, y_class)
                
                if score > self.best_score:
                    self.best_score = score
                    self.best_model = len(self.estimators_)
                    self.rounds_without_improvement = 0
                else:
                    self.rounds_without_improvement += 10
                
                if self.rounds_without_improvement >= self.patience:
                    print(f"Early stopping at round {i}")
                    break
        
        # Trim to best model
        self.estimators_ = self.estimators_[:self.best_model]
        return self
    
    def predict_proba(self, X):
        y_pred = np.full(X.shape[0], 0.5)
        for tree in self.estimators_:
            y_pred += self.learning_rate * tree.predict(X)
        
        proba_1 = 1 / (1 + np.exp(-y_pred))
        return np.column_stack([1 - proba_1, proba_1])
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return (proba[:, 1] > 0.5).astype(int)

model = WarmStartingClassifier(max_rounds=500, learning_rate=0.1, patience=20)
model.fit(X_train, y_train)
```

Early stopping prevents overfitting by monitoring validation performance and stopping when performance degrades. The patience parameter allows some degradation before stopping, which avoids stopping on noise. This is the single most important regularization technique for boosting algorithms.

## Learning Rate Warm-Up

For very deep networks or complex models, starting with the full learning rate can cause training instability. Warm-up gradually increases the learning rate from near-zero to the target value over the first few hundred or thousand steps. This allows the model to find a stable region of the loss landscape before committing to aggressive updates.

```python
import torch
import torch.nn as nn
from torch.optim.lr_scheduler import LambdaLR

def get_linear_warmup_scheduler(optimizer, warmup_steps, total_steps):
    def lr_lambda(current_step):
        if current_step < warmup_steps:
            return float(current_step) / float(max(1, warmup_steps))
        return max(0.0, float(total_steps - current_step) / float(
            max(1, total_steps - warmup_steps)
        ))
    return LambdaLR(optimizer, lr_lambda)

model = nn.Sequential(
    nn.Linear(128, 64),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(32, 2)
)

optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
scheduler = get_linear_warmup_scheduler(
    optimizer, warmup_steps=500, total_steps=10000
)

# Training loop
for step in range(10000):
    # ... forward pass, loss, backward pass ...
    optimizer.step()
    scheduler.step()
    
    if step % 1000 == 0:
        print(f"Step {step}, LR: {scheduler.get_last_lr()[0]:.6f}")
```

Warm-up is particularly important when using batch normalization or large batch sizes. Without it, the initial gradients can be so large that they push the model into a poor region of the loss landscape, from which it cannot recover. The warm-up period lets the batch normalization statistics stabilize before the model starts learning aggressively.

## Distributed Training with Data Parallelism

When your dataset is too large for a single GPU, you split it across multiple GPUs. Each GPU holds a complete copy of the model and processes a different batch of data. The gradients from each GPU are averaged, and the model is updated synchronously. This is data parallelism, and it is the most common distributed training strategy.

The key challenge with distributed training is communication overhead. Each GPU must share its gradients with all other GPUs after every batch. This communication happens over the interconnect (NVLink on the same node, InfiniBand across nodes) and can become a bottleneck if the model is large or the interconnect is slow.

```python
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def setup_distributed(rank, world_size):
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        world_size=world_size,
        rank=rank
    )
    torch.cuda.set_device(rank)

def cleanup():
    dist.destroy_process_group()

def train_epoch(model, dataloader, optimizer, criterion, rank):
    model.train()
    total_loss = 0
    
    for batch_idx, (data, target) in enumerate(dataloader):
        data, target = data.to(rank), target.to(rank)
        
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        
        # Gradient averaging across GPUs
        for param in model.parameters():
            if param.grad is not None:
                dist.all_reduce(param.grad.data, op=dist.ReduceOp.SUM)
                param.grad.data /= dist.get_world_size()
        
        optimizer.step()
        total_loss += loss.item()
    
    return total_loss / len(dataloader)

def train_worker(rank, world_size, dataset):
    setup_distributed(rank, world_size)
    
    model = nn.Sequential(
        nn.Linear(128, 64),
        nn.ReLU(),
        nn.Linear(64, 32),
        nn.ReLU(),
        nn.Linear(32, 2)
    ).to(rank)
    
    model = DDP(model, device_ids=[rank])
    
    sampler = DistributedSampler(
        dataset, num_replicas=world_size, rank=rank
    )
    dataloader = DataLoader(
        dataset, batch_size=64, sampler=sampler, num_workers=4
    )
    
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()
    
    for epoch in range(10):
        sampler.set_epoch(epoch)
        loss = train_epoch(model, dataloader, optimizer, criterion, rank)
        print(f"Rank {rank}, Epoch {epoch}, Loss: {loss:.4f}")
    
    # Save model from rank 0 only
    if rank == 0:
        torch.save(model.module.state_dict(), 'model_ddp.pt')
    
    cleanup()

# Launch with: torchrun --nproc_per_node=4 train.py
```

The `DistributedSampler` ensures each GPU sees a different subset of the data. The `set_epoch(epoch)` call is necessary because the sampler shuffles data differently each epochwithout it, every epoch would use the same ordering, which degrades training.

The gradient averaging step (`all_reduce`) synchronizes gradients across all GPUs. Each GPU computes gradients on its local batch, then the gradients are summed and divided by the world size. This means the effective batch size is `local_batch_size * world_size`. If you have 4 GPUs with batch size 64, your effective batch size is 256.

## Gradient Accumulation for Large Effective Batch Sizes

Sometimes you need a large effective batch size but do not have enough GPUs. Gradient accumulation simulates a large batch by accumulating gradients over multiple small batches before updating the model. This is useful when GPU memory limits your batch size but the model needs large batches to train stably.

```python
def train_with_accumulation(
    model, dataloader, optimizer, criterion,
    accumulation_steps=4, max_grad_norm=1.0
):
    model.train()
    optimizer.zero_grad()
    
    total_loss = 0
    for batch_idx, (data, target) in enumerate(dataloader):
        data, target = data.cuda(), target.cuda()
        
        output = model(data)
        loss = criterion(output, target) / accumulation_steps
        loss.backward()
        
        total_loss += loss.item() * accumulation_steps
        
        if (batch_idx + 1) % accumulation_steps == 0:
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(
                model.parameters(), max_grad_norm
            )
            
            optimizer.step()
            optimizer.zero_grad()
    
    return total_loss / len(dataloader)

# Effective batch size = 64 * 4 = 256
train_with_accumulation(model, dataloader, optimizer, criterion, accumulation_steps=4)
```

Gradient clipping (`clip_grad_norm_`) prevents exploding gradients. Without it, a single batch with unusual data can produce gradients so large that they destabilize training. The maximum gradient norm of 1.0 is a common default, but you should monitor gradient norms during training and adjust if necessary.

The division of loss by `accumulation_steps` is critical. Without it, the gradients would be accumulated over multiple batches without scaling, effectively increasing the learning rate by a factor of `accumulation_steps`. Dividing by the accumulation steps normalizes the gradients so the effective learning rate remains the same regardless of the accumulation count.

## Mixed Precision Training

Mixed precision training uses 16-bit floating point for forward and backward passes and 32-bit for weight updates. This reduces memory usage by roughly 40% and speeds up training on GPUs with tensor cores (NVIDIA V100, A100, etc.). The accuracy loss is negligible for most tasks.

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for epoch in range(num_epochs):
    for batch_idx, (data, target) in enumerate(dataloader):
        data, target = data.cuda(), target.cuda()
        
        optimizer.zero_grad()
        
        # Forward pass in mixed precision
        with autocast():
            output = model(data)
            loss = criterion(output, target)
        
        # Backward pass with gradient scaling
        scaler.scale(loss).backward()
        
        # Unscale gradients before clipping
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        
        # Update weights
        scaler.step(optimizer)
        scaler.update()
        
        if batch_idx % 100 == 0:
            print(f"Epoch {epoch}, Batch {batch_idx}, Loss: {loss.item():.4f}")
```

The `GradScaler` prevents underflow in 16-bit gradients. Without it, small gradients would become zero in 16-bit representation, and the model would stop learning. The scaler multiplies the loss by a large factor before the backward pass, then unscales the gradients before the optimizer step. If gradients overflow (become inf or nan), the scaler skips that update and reduces the scale factor.

## Checkpointing for Fault Tolerance

Training large models takes hours or days. If the process crashes at hour 18 of a 24-hour training run, you lose everything. Checkpointing saves the model state periodically so you can resume from the last checkpoint. This is not optional for production trainingit is a requirement.

```python
import os
import json
from pathlib import Path

class CheckpointManager:
    def __init__(self, checkpoint_dir: str, max_checkpoints: int = 3):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.max_checkpoints = max_checkpoints
    
    def save(self, model, optimizer, scheduler, epoch, metrics):
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
            'metrics': metrics,
        }
        
        path = self.checkpoint_dir / f'checkpoint_epoch_{epoch}.pt'
        torch.save(checkpoint, path)
        
        # Save metrics separately for easy monitoring
        metrics_path = self.checkpoint_dir / 'latest_metrics.json'
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        self._cleanup_old_checkpoints()
        print(f"Saved checkpoint: {path}")
    
    def load(self, path=None):
        if path is None:
            path = self._find_latest_checkpoint()
        
        if path is None:
            return None, None, None, 0, {}
        
        checkpoint = torch.load(path, map_location='cuda')
        return (
            checkpoint['model_state_dict'],
            checkpoint['optimizer_state_dict'],
            checkpoint['scheduler_state_dict'],
            checkpoint['epoch'],
            checkpoint['metrics']
        )
    
    def _find_latest_checkpoint(self):
        checkpoints = list(self.checkpoint_dir.glob('checkpoint_epoch_*.pt'))
        if not checkpoints:
            return None
        
        # Sort by epoch number
        checkpoints.sort(
            key=lambda p: int(p.stem.split('_')[-1])
        )
        return checkpoints[-1]
    
    def _cleanup_old_checkpoints(self):
        checkpoints = list(self.checkpoint_dir.glob('checkpoint_epoch_*.pt'))
        checkpoints.sort(key=lambda p: int(p.stem.split('_')[-1]))
        
        while len(checkpoints) > self.max_checkpoints:
            old = checkpoints.pop(0)
            old.unlink()
            print(f"Removed old checkpoint: {old}")

# Usage
ckpt_manager = CheckpointManager('checkpoints', max_checkpoints=3)

# Resume training
model_w, opt_w, sched_w, start_epoch, metrics = ckpt_manager.load()
if model_w:
    model.load_state_dict(model_w)
    optimizer.load_state_dict(opt_w)
    scheduler.load_state_dict(sched_w)
    print(f"Resumed from epoch {start_epoch}")

for epoch in range(start_epoch, num_epochs):
    train_loss = train_epoch(model, train_loader, optimizer, criterion)
    val_loss = evaluate(model, val_loader, criterion)
    
    ckpt_manager.save(
        model, optimizer, scheduler, epoch,
        {'train_loss': train_loss, 'val_loss': val_loss}
    )
```

The `max_checkpoints` parameter limits disk usage. Training a large model generates checkpoints that are gigabytes each. Keeping three checkpoints uses roughly the same disk space as one, but provides fallback options if the latest checkpoint is corrupted. The cleanup process removes the oldest checkpoint when the limit is exceeded.

## Training Stability and Debugging

Training large models is inherently unstable. Gradients can explode or vanish, learning rates can be too high or too low, and batch normalization statistics can drift. Debugging training instability requires understanding what is happening inside the model during training.

The first debugging step is to monitor loss curves. A healthy training loss decreases smoothly. A loss that oscillates wildly suggests the learning rate is too high. A loss that plateaus early suggests the learning rate is too low or the model is too simple. A loss that decreases then suddenly spikes suggests numerical instability (often caused by exploding gradients or NaN values).

```python
class TrainingDebugger:
    def __init__(self):
        self.loss_history = []
        self.gradient_norms = []
        self.learning_rates = []
        self.parameter_stats = {}
    
    def log_step(self, loss, gradients, learning_rate, step):
        self.loss_history.append({'step': step, 'loss': loss})
        self.learning_rates.append({'step': step, 'lr': learning_rate})
        
        # Compute gradient norms
        grad_norm = 0
        for grad in gradients:
            if grad is not None:
                grad_norm += grad.norm().item() ** 2
        grad_norm = grad_norm ** 0.5
        self.gradient_norms.append({'step': step, 'norm': grad_norm})
    
    def detect_instability(self) -> list:
        issues = []
        
        if len(self.loss_history) < 10:
            return issues
        
        losses = [h['loss'] for h in self.loss_history[-10:]]
        
        # Check for NaN loss
        if any(np.isnan(l) for l in losses):
            issues.append("NaN loss detected - check for numerical instability")
        
        # Check for exploding gradients
        recent_grads = [h['norm'] for h in self.gradient_norms[-10:]]
        if max(recent_grads) > 100:
            issues.append(f"Exploding gradients: max norm {max(recent_grads):.2f}")
        
        # Check for vanishing gradients
        if max(recent_grads) < 1e-7:
            issues.append(f"Vanishing gradients: max norm {max(recent_grads):.2e}")
        
        # Check for loss spike
        if len(losses) >= 2:
            loss_ratio = max(losses) / (min(losses) + 1e-8)
            if loss_ratio > 10:
                issues.append(f"Loss spike detected: ratio {loss_ratio:.2f}")
        
        return issues
    
    def suggest_fixes(self, issues: list) -> list:
        fixes = []
        for issue in issues:
            if "NaN" in issue:
                fixes.append("Reduce learning rate or add gradient clipping")
            elif "Exploding" in issue:
                fixes.append("Add gradient clipping with max_norm=1.0")
            elif "Vanishing" in issue:
                fixes.append("Check initialization, try different activation functions")
            elif "spike" in issue:
                fixes.append("Reduce learning rate, increase batch size")
        return fixes

debugger = TrainingDebugger()

# In training loop
for step in range(num_steps):
    output = model(data)
    loss = criterion(output, target)
    loss.backward()
    
    gradients = [p.grad for p in model.parameters()]
    debugger.log_step(loss.item(), gradients, optimizer.param_groups[0]['lr'], step)
    
    optimizer.step()
    optimizer.zero_grad()
    
    if step % 100 == 0:
        issues = debugger.detect_instability()
        if issues:
            fixes = debugger.suggest_fixes(issues)
            print(f"Step {step}: Issues detected")
            for issue, fix in zip(issues, fixes):
                print(f"  {issue}")
                print(f"  Suggested fix: {fix}")
```

Gradient monitoring is essential for deep networks. Exploding gradients cause the loss to spike and can corrupt the model weights. Vanishing gradients cause the model to stop learning because the weight updates are too small to make a difference. Both issues are detectable by monitoring gradient norms during training.

The gradient norm threshold of 100 is a heuristic. For most models, gradient norms should stay between 0.01 and 10. Norms above 100 indicate exploding gradients. Norms below 1e-7 indicate vanishing gradients. These thresholds vary by model architecture and should be calibrated on a healthy training run.

## Hyperparameter Sensitivity Analysis

After tuning hyperparameters, you need to understand how sensitive your model is to each parameter. A model that performs well only in a narrow parameter range is fragile. Small changes in hyperparameters (due to different hardware, library versions, or data splits) could cause it to fail.

```python
def sensitivity_analysis(model_class, param_name, param_values, X_train, y_train, X_test, y_test):
    results = []
    
    for value in param_values:
        params = {param_name: value}
        model = model_class(**params, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        f1 = f1_score(y_test, y_pred)
        
        results.append({
            'param_value': value,
            'f1': f1,
        })
    
    results_df = pd.DataFrame(results)
    
    # Compute sensitivity metrics
    f1_range = results_df['f1'].max() - results_df['f1'].min()
    f1_std = results_df['f1'].std()
    
    return {
        'results': results_df,
        'range': f1_range,
        'std': f1_std,
        'sensitive': f1_range > 0.05,
    }

# Test sensitivity to key parameters
learning_rate_sensitivity = sensitivity_analysis(
    GradientBoostingClassifier, 'learning_rate',
    [0.01, 0.05, 0.1, 0.2, 0.3],
    X_train, y_train, X_test, y_test
)

print(f"Learning rate sensitivity: range={learning_rate_sensitivity['range']:.4f}, std={learning_rate_sensitivity['std']:.4f}")
print(f"Sensitive: {learning_rate_sensitivity['sensitive']}")
```

A sensitive parameter means the model's performance changes significantly when that parameter changes. If learning rate is sensitive, you need to tune it carefully and ensure the tuned value works across different environments. If min_samples_leaf is not sensitive, you can leave it at the default without worrying about performance degradation.

## Assessment

### Lab Task 1: Hyperparameter Optimization (Time: 120 minutes)

Tune a Gradient Boosting classifier using three different strategies and compare their efficiency.

**Steps:**
1. Implement grid search with a coarse grid (3 values per parameter, 5 parameters).
2. Implement random search with 100 iterations over the same parameter space.
3. Implement Bayesian optimization with Optuna for 50 trials.
4. Record the time taken and best F1 score for each method.
5. Plot convergence curves showing best score found over time.

**Grading Criteria:**
- Grid search implemented correctly with full parameter grid (15 points)
- Random search samples from correct distributions (15 points)
- Optuna study uses TPE sampler with pruning (15 points)
- Convergence curves plotted and interpreted (15 points)
- Time comparison table with wall-clock and CPU time (15 points)
- Analysis of which method is most efficient for the budget (15 points)
- Code is clean and reproducible with fixed random seeds (10 points)

### Lab Task 2: Distributed Training (Time: 90 minutes)

Implement data-parallel training across multiple processes.

**Steps:**
1. Write a training script that uses `DistributedDataParallel`.
2. Implement `DistributedSampler` for data loading.
3. Add gradient accumulation with 4 accumulation steps.
4. Implement gradient clipping with max norm 1.0.
5. Add mixed precision training with `autocast` and `GradScaler`.
6. Save checkpoints every epoch with a `CheckpointManager`.

**Grading Criteria:**
- DDP setup with proper process group initialization (15 points)
- DistributedSampler ensures no data overlap across GPUs (15 points)
- Gradient accumulation produces correct effective batch size (15 points)
- Gradient clipping prevents exploding gradients (15 points)
- Mixed precision reduces memory usage without losing accuracy (15 points)
- Checkpointing saves and resumes correctly (15 points)
- Training runs without crashes for 10+ epochs (10 points)

### Lab Task 3: Learning Rate Schedule (Time: 60 minutes)

Implement and compare three learning rate schedules.

**Steps:**
1. Implement linear warmup for 500 steps followed by cosine decay.
2. Implement step decay (halve LR every 10 epochs).
3. Implement ReduceLROnPlateau (reduce when validation loss stalls).
4. Train a model with each schedule and compare final performance.
5. Plot learning rate curves for all three schedules.

**Grading Criteria:**
- Linear warmup correctly ramps LR from near-zero (20 points)
- Cosine decay produces smooth LR reduction (15 points)
- ReduceLROnPlateau responds to validation metrics (15 points)
- All three schedules produce valid training runs (15 points)
- LR curves plotted with clear labels and legend (15 points)
- Performance comparison table with train and validation scores (15 points)
- Analysis of which schedule works best for this problem (5 points)

## Evidence

- `hyperparameter_search.py`: Script implementing grid search, random search, and Bayesian optimization with timing comparisons
- `distributed_training.py`: DDP training script with gradient accumulation and mixed precision
- `checkpoint_manager.py`: Checkpointing module with save, load, and cleanup functionality
- `lr_schedules.py`: Learning rate schedule implementations with comparison plots
- `training_comparison.csv`: Results table comparing all training approaches
- `convergence_plots.png`: Visualization of optimization convergence for each method
