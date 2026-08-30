# Module 6 — ML Security: Adversarial Attacks, Data Poisoning

## What You'll Actually Do

You'll attack your own models to understand vulnerabilities, then implement defenses. Security isn't optional in ML.

## Content

### Adversarial Example Generation

```python
import numpy as np

def fgsm_attack(model, x, y, epsilon=0.1):
    x_tensor = torch.tensor(x, dtype=torch.float32, requires_grad=True)
    y_tensor = torch.tensor([y])

    output = model(x_tensor)
    loss = torch.nn.functional.cross_entropy(output, y_tensor)
    loss.backward()

    perturbation = epsilon * x_tensor.grad.sign()
    adversarial = x_tensor + perturbation
    return adversarial.detach().numpy()

# Test: does the model misclassify?
original_pred = model.predict(x.reshape(1, -1))
adversarial_pred = model.predict(adversarial.reshape(1, -1))
print(f"Original: {original_pred}, Adversarial: {adversarial_pred}")
```

### Data Poisoning Simulation

```python
import numpy as np
from sklearn.ensemble import RandomForestClassifier

def poison_training_data(X, y, poison_ratio=0.1, target_class=0):
    n_poison = int(len(X) * poison_ratio)
    indices = np.random.choice(len(X), n_poison, replace=False)

    X_poisoned = X.copy()
    y_poisoned = y.copy()

    # Flip labels for targeted poisoning
    y_poisoned[indices] = target_class

    return X_poisoned, y_poisoned, indices

# Train on clean data
clean_model = RandomForestClassifier()
clean_model.fit(X_train, y_train)
clean_acc = clean_model.score(X_test, y_test)

# Train on poisoned data
X_p, y_p, poisoned_idx = poison_training_data(X_train, y_train, 0.15)
poisoned_model = RandomForestClassifier()
poisoned_model.fit(X_p, y_p)
poisoned_acc = poisoned_model.score(X_test, y_test)

print(f"Clean accuracy: {clean_acc:.3f}")
print(f"Poisoned accuracy: {poisoned_acc:.3f}")
```

### Input Validation and Sanitization

```python
import numpy as np

class InputValidator:
    def __init__(self, feature_ranges, max_features):
        self.ranges = feature_ranges
        self.max_features = max_features

    def validate(self, features):
        if len(features) != self.max_features:
            raise ValueError(f"Expected {self.max_features} features")

        for i, (val, (low, high)) in enumerate(zip(features, self.ranges)):
            if val < low or val > high:
                raise ValueError(
                    f"Feature {i} out of range: {val} not in [{low}, {high}]"
                )

        return True

    def sanitize(self, features):
        sanitized = []
        for val, (low, high) in zip(features, self.ranges):
            sanitized.append(np.clip(val, low, high))
        return sanitized
```

### Model Stealing Defense

```python
class QueryRateLimiter:
    def __init__(self, max_queries_per_minute=60):
        self.max_qpm = max_queries_per_minute
        self.query_log = {}

    def check_rate(self, client_id):
        now = time.time()
        if client_id not in self.query_log:
            self.query_log[client_id] = []

        # Clean old queries
        self.query_log[client_id] = [
            t for t in self.query_log[client_id] if now - t < 60
        ]

        if len(self.query_log[client_id]) >= self.max_qpm:
            return False

        self.query_log[client_id].append(now)
        return True
```

## Assessment

**Lab: Attack and Defend a Model**

Train a classifier on the MNIST dataset (or a subset). Implement an FGSM adversarial attack and measure how accuracy drops. Then implement input validation that clips pixel values and a query rate limiter. Report before/after accuracy for each defense.

- Time: 60 minutes
- Grading: Working adversarial attack (30%), accuracy impact analysis (20%), input validation (25%), rate limiter (25%)

## Evidence

Upload your attack code, defense implementations, and a summary table showing model accuracy under each condition: clean, attacked, defended with validation, defended with rate limiting.
