# Module 6 — ML Security

## Your Model Is an Attack Surface

Machine learning models are software, and software has vulnerabilities. But ML vulnerabilities are different from traditional software vulnerabilities. An SQL injection changes what your application does. An adversarial attack on a model changes what your model perceives, causing it to make confident, incorrect predictions. The attack does not trigger an error—the model outputs a result with high confidence, and you have no way to know it is wrong until the damage is done.

This module covers the three major categories of ML security threats: adversarial attacks that manipulate inputs to cause misclassification, data poisoning that corrupts the training process, and model extraction that steals your intellectual property. You will implement attack methods, understand why they work, and build defenses that reduce (but never eliminate) the risk.

## Adversarial Attacks: Manipulating Model Inputs

An adversarial example is an input that has been modified slightly—so slightly that a human cannot tell the difference—but causes the model to make a wrong prediction. The perturbation is computed by finding the direction in input space that most strongly affects the model's output.

The Fast Gradient Sign Method (FGSM) is the simplest adversarial attack. It computes the gradient of the loss with respect to the input, then adds a perturbation in the direction that increases the loss. The perturbation is bounded by an epsilon parameter that controls how much the input can change.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

def fgsm_attack(model, x, y, epsilon=0.03):
    x.requires_grad = True
    
    output = model(x)
    loss = F.cross_entropy(output, y)
    model.zero_grad()
    loss.backward()
    
    # Create adversarial example
    x_adv = x + epsilon * x.grad.sign()
    x_adv = torch.clamp(x_adv, 0, 1)  # Keep in valid range
    
    return x_adv.detach()

def evaluate_attack(model, test_loader, epsilon=0.03):
    correct = 0
    adversarial_correct = 0
    total = 0
    
    for x, y in test_loader:
        x_adv = fgsm_attack(model, x, y, epsilon)
        
        # Original predictions
        output = model(x)
        pred = output.argmax(dim=1)
        correct += (pred == y).sum().item()
        
        # Adversarial predictions
        output_adv = model(x_adv)
        pred_adv = output_adv.argmax(dim=1)
        adversarial_correct += (pred_adv == y).sum().item()
        
        total += y.size(0)
    
    print(f"Original accuracy: {correct / total:.4f}")
    print(f"Adversarial accuracy: {adversarial_correct / total:.4f}")
    print(f"Attack success rate: {1 - adversarial_correct / total:.4f}")

evaluate_attack(model, test_loader, epsilon=0.03)
```

The PGD attack (Projected Gradient Descent) is an iterative version of FGSM. It applies multiple small perturbations instead of one large one, making it more effective but slower. PGD is considered the strongest first-order attack—if your model is robust to PGD, it is robust to most gradient-based attacks.

```python
def pgd_attack(
    model, x, y, epsilon=0.03, alpha=0.007, 
    num_steps=10, random_start=True
):
    x_adv = x.clone()
    
    if random_start:
        x_adv = x_adv + torch.empty_like(x_adv).uniform_(-epsilon, epsilon)
        x_adv = torch.clamp(x_adv, 0, 1)
    
    for _ in range(num_steps):
        x_adv.requires_grad = True
        
        output = model(x_adv)
        loss = F.cross_entropy(output, y)
        model.zero_grad()
        loss.backward()
        
        # Gradient step
        x_adv = x_adv + alpha * x_adv.grad.sign()
        
        # Project back to epsilon ball
        delta = torch.clamp(x_adv - x, -epsilon, epsilon)
        x_adv = torch.clamp(x + delta, 0, 1).detach()
    
    return x_adv

# Compare FGSM vs PGD
fgsm_acc = evaluate_attack(model, test_loader, epsilon=0.03)
pgd_correct = 0
for x, y in test_loader:
    x_adv = pgd_attack(model, x, y, epsilon=0.03)
    output_adv = model(x_adv)
    pred_adv = output_adv.argmax(dim=1)
    pgd_correct += (pred_adv == y).sum().item()
print(f"PGD attack accuracy: {pgd_correct / len(test_loader.dataset):.4f}")
```

## Defending Against Adversarial Attacks

Adversarial training is the most effective defense. You generate adversarial examples during training and include them in the training data. The model learns to classify both clean and adversarial examples correctly.

```python
def adversarial_training(
    model, train_loader, test_loader, 
    epsilon=0.03, alpha=0.007, 
    num_steps=7, epochs=10, lr=0.001
):
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=epochs
    )
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for x, y in train_loader:
            x, y = x.cuda(), y.cuda()
            
            # Generate adversarial examples
            x_adv = pgd_attack(
                model, x, y, epsilon, alpha, num_steps
            )
            
            # Combine clean and adversarial examples
            x_combined = torch.cat([x, x_adv])
            y_combined = torch.cat([y, y])
            
            # Forward pass
            output = model(x_combined)
            loss = F.cross_entropy(output, y_combined)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += (pred == y_combined).sum().item()
            total += y_combined.size(0)
        
        scheduler.step()
        
        # Evaluate
        model.eval()
        test_correct = 0
        adv_correct = 0
        for x, y in test_loader:
            x, y = x.cuda(), y.cuda()
            
            output = model(x)
            test_correct += (output.argmax(1) == y).sum().item()
            
            x_adv = pgd_attack(model, x, y, epsilon, alpha, num_steps)
            output_adv = model(x_adv)
            adv_correct += (output_adv.argmax(1) == y).sum().item()
        
        print(f"Epoch {epoch + 1}/{epochs}")
        print(f"  Train Loss: {total_loss / len(train_loader):.4f}")
        print(f"  Train Acc: {correct / total:.4f}")
        print(f"  Test Acc: {test_correct / len(test_loader.dataset):.4f}")
        print(f"  Adv Acc: {adv_correct / len(test_loader.dataset):.4f}")

adversarial_training(model, train_loader, test_loader, epsilon=0.03)
```

Adversarial training has a cost: clean accuracy typically drops by 2-5% because the model must learn to be robust to perturbations, which reduces its ability to exploit subtle patterns in clean data. The epsilon parameter controls the robustness-accuracy tradeoff. Larger epsilon means more robust but lower clean accuracy.

## Randomized Smoothing

Randomized smoothing is a provable defense. It adds random noise to inputs before classification and aggregates predictions over many noisy versions. The central limit theorem guarantees that if each noisy prediction is correct with probability p, the aggregated prediction is correct with probability at least p.

```python
import numpy as np

class SmoothedClassifier:
    def __init__(self, model, sigma=0.25, n_samples=1000):
        self.model = model
        self.sigma = sigma
        self.n_samples = n_samples
    
    def certify(self, x):
        self.model.eval()
        
        # Draw noisy samples
        counts = {}
        for _ in range(self.n_samples):
            noise = torch.randn_like(x) * self.sigma
            x_noisy = x + noise
            
            with torch.no_grad():
                output = self.model(x_noisy)
                pred = output.argmax(dim=1).item()
            
            counts[pred] = counts.get(pred, 0) + 1
        
        # Find top prediction
        top_class = max(counts, key=counts.get)
        top_count = counts[top_class]
        
        # Compute certification radius
        # Using hyperparameter-free certification
        from scipy.stats import binom
        p_lower = binom.ppf(0.001, self.n_samples, top_count / self.n_samples)
        
        if p_lower > 0.5:
            radius = self.sigma * norm.ppf(p_lower)
        else:
            radius = 0.0
        
        return {
            'prediction': top_class,
            'confidence': top_count / self.n_samples,
            'radius': radius,
        }

smoothed = SmoothedClassifier(model, sigma=0.25, n_samples=1000)

# Certify predictions
for x, y in test_loader:
    result = smoothed.certify(x[0:1])
    print(f"Prediction: {result['prediction']}, "
          f"Confidence: {result['confidence']:.3f}, "
          f"Radius: {result['radius']:.3f}")
```

Randomized smoothing gives you a provable guarantee: any perturbation smaller than the certification radius cannot change the prediction. The tradeoff is that the certification radius is often small (0.1-0.5), and larger noise reduces accuracy on clean data.

## Data Poisoning: Corrupting the Training Process

Data poisoning attacks manipulate the training data to cause the model to learn incorrect patterns. The attacker injects carefully crafted training examples that cause the model to misclassify specific inputs at test time.

Backdoor attacks are the most dangerous form of poisoning. The attacker adds a trigger pattern (like a small sticker or a specific pixel pattern) to some training examples. The model learns to associate the trigger with a target label. At test time, any input with the trigger is classified as the target label, while clean inputs are classified correctly.

```python
def inject_backdoor(
    images, labels, target_label=0, 
    trigger_size=5, trigger_position='bottom_right'
):
    poisoned_images = images.clone()
    poisoned_labels = labels.clone()
    
    # Create trigger pattern
    trigger = torch.ones(1, trigger_size, trigger_size)
    trigger[0, 1::2, :] = -1  # Checkerboard pattern
    
    # Apply trigger to a fraction of images
    n_poison = int(0.1 * len(images))  # 10% poison rate
    
    for i in range(n_poison):
        if trigger_position == 'bottom_right':
            poisoned_images[i, :, -trigger_size:, -trigger_size:] = trigger
        elif trigger_position == 'top_left':
            poisoned_images[i, :, :trigger_size, :trigger_size] = trigger
        
        poisoned_labels[i] = target_label
    
    return poisoned_images, poisoned_labels

def detect_poisoning(images, labels, model):
    # Measure confidence on training data
    model.eval()
    confidences = []
    
    for i in range(len(images)):
        with torch.no_grad():
            output = model(images[i:i+1])
            prob = torch.softmax(output, dim=1)
            max_prob = prob.max().item()
            confidences.append(max_prob)
    
    confidences = np.array(confidences)
    
    # High-confidence misclassifications are suspicious
    with torch.no_grad():
        outputs = model(images)
        preds = outputs.argmax(dim=1)
    
    misclassified = (preds != labels).numpy()
    high_confidence = confidences > 0.99
    
    suspicious = misclassified & high_confidence
    
    print(f"Total suspicious samples: {suspicious.sum()}")
    print(f"Suspicious rate: {suspicious.mean():.4f}")
    
    return suspicious

# Inject backdoor
poisoned_images, poisoned_labels = inject_backdoor(
    train_images, train_labels, target_label=0
)

# Train on poisoned data
model.fit(poisoned_images, poisoned_labels)

# Detect poisoning
suspicious = detect_poisoning(train_images, train_labels, model)
```

## Defense Against Data Poisoning

Spectral Signature defense detects poisoned examples by analyzing the singular value decomposition of the feature matrix. Poisoned examples tend to form a cluster that is linearly separable from clean examples in the feature space.

```python
def spectral_signature_defense(
    features: np.ndarray, labels: np.ndarray, 
    threshold: float = 2.0
) -> np.ndarray:
    # Compute per-class feature means
    classes = np.unique(labels)
    class_means = {}
    
    for c in classes:
        class_mask = labels == c
        class_means[c] = features[class_mask].mean(axis=0)
    
    # Compute residual for each sample
    residuals = []
    for i, (x, y) in enumerate(zip(features, labels)):
        residual = x - class_means[y]
        residuals.append(np.linalg.norm(residual))
    
    residuals = np.array(residuals)
    
    # Flag samples with unusually large residuals
    mean_residual = residuals.mean()
    std_residual = residuals.std()
    
    suspicious = residuals > mean_residual + threshold * std_residual
    
    print(f"Detected {suspicious.sum()} suspicious samples "
          f"out of {len(features)} total")
    
    return suspicious

def compute_spectral_signatures(features: np.ndarray, k: int = 5):
    # Center the features
    features_centered = features - features.mean(axis=0)
    
    # Compute SVD
    U, S, Vt = np.linalg.svd(features_centered, full_matrices=False)
    
    # Top k singular vectors capture the main variation
    top_k_components = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
    
    # Residuals indicate outliers
    residuals = np.linalg.norm(features_centered - top_k_components, axis=1)
    
    return residuals

residuals = compute_spectral_signatures(X_train.values, k=5)
threshold = residuals.mean() + 3 * residuals.std()
suspicious_mask = residuals > threshold

print(f"Flagged {suspicious_mask.sum()} samples as potential poisoning")
print(f"Clean data: {(~suspicious_mask).sum()} samples")
```

## Model Extraction: Stealing Your Intellectual Property

Model extraction attacks query a deployed model and use the responses to train a substitute model. The substitute model approximates the original model's decision boundary, giving the attacker a functional copy without access to the training data or model parameters.

```python
class ModelExtractor:
    def __init__(self, api_query_fn, input_dim, output_dim):
        self.api_query_fn = api_query_fn
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.substitute_model = self._build_substitute()
        self.query_log = []
    
    def _build_substitute(self):
        return nn.Sequential(
            nn.Linear(self.input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, self.output_dim)
        )
    
    def generate_queries(self, n_queries: int) -> torch.Tensor:
        # Generate diverse inputs to probe the decision boundary
        inputs = torch.randn(n_queries, self.input_dim)
        
        # Add inputs near decision boundary
        boundary_inputs = self._find_boundary_inputs(n_queries // 2)
        inputs = torch.cat([inputs, boundary_inputs])
        
        return inputs
    
    def _find_boundary_inputs(self, n: int) -> torch.Tensor:
        # Generate inputs near the decision boundary
        # by interpolating between different predicted classes
        inputs = []
        
        for _ in range(n):
            x1 = torch.randn(1, self.input_dim)
            x2 = torch.randn(1, self.input_dim)
            
            # Binary search for decision boundary
            low, high = 0.0, 1.0
            for _ in range(10):
                mid = (low + high) / 2
                x_mid = x1 * mid + x2 * (1 - mid)
                
                pred = self.api_query_fn(x_mid)
                if pred == 0:
                    low = mid
                else:
                    high = mid
            
            inputs.append(x1 * mid + x2 * (1 - mid))
        
        return torch.cat(inputs)
    
    def extract(self, n_queries: int = 10000, epochs: int = 20):
        # Generate queries
        queries = self.generate_queries(n_queries)
        
        # Query the target model
        labels = []
        for q in queries:
            label = self.api_query_fn(q.unsqueeze(0))
            labels.append(label)
        
        labels = torch.tensor(labels)
        
        # Train substitute model
        optimizer = torch.optim.Adam(
            self.substitute_model.parameters(), lr=0.001
        )
        
        for epoch in range(epochs):
            # Shuffle data
            perm = torch.randperm(len(queries))
            queries_shuffled = queries[perm]
            labels_shuffled = labels[perm]
            
            total_loss = 0
            for i in range(0, len(queries), 32):
                batch_x = queries_shuffled[i:i+32]
                batch_y = labels_shuffled[i:i+32]
                
                output = self.substitute_model(batch_x)
                loss = F.cross_entropy(output, batch_y)
                
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
            
            if (epoch + 1) % 5 == 0:
                print(f"Epoch {epoch + 1}, Loss: {total_loss:.4f}")
        
        return self.substitute_model

def protect_against_extraction(
    model, n_queries: int = 10000
) -> Dict[str, float]:
    # Measure query patterns
    query_times = []
    query_results = []
    
    for _ in range(n_queries):
        x = torch.randn(1, 128)
        
        start = time.time()
        with torch.no_grad():
            output = model(x)
            pred = output.argmax(dim=1).item()
        elapsed = time.time() - start
        
        query_times.append(elapsed)
        query_results.append(pred)
    
    # Detect extraction patterns
    unique_predictions = len(set(query_results))
    avg_query_time = np.mean(query_times)
    
    return {
        'unique_predictions': unique_predictions,
        'avg_query_time': avg_query_time,
        'prediction_entropy': stats.entropy(
            np.bincount(query_results) / n_queries
        ),
    }
```

## Defense Against Model Extraction

Rate limiting and query monitoring are the first line of defense. An extraction attack requires thousands of queries in a short time, which is unusual for normal usage. Monitoring query patterns can detect extraction attempts.

```python
import time
from collections import defaultdict

class ExtractionDetector:
    def __init__(
        self, 
        max_queries_per_minute: int = 100,
        max_queries_per_hour: int = 1000,
        entropy_threshold: float = 0.8
    ):
        self.max_queries_per_minute = max_queries_per_minute
        self.max_queries_per_hour = max_queries_per_hour
        self.entropy_threshold = entropy_threshold
        self.query_history = defaultdict(list)
        self.prediction_history = defaultdict(list)
    
    def check_query(self, client_id: str, features: np.ndarray) -> Dict:
        now = time.time()
        
        # Clean old queries
        self.query_history[client_id] = [
            t for t in self.query_history[client_id]
            if now - t < 3600
        ]
        
        # Rate limiting
        recent_minute = sum(
            1 for t in self.query_history[client_id]
            if now - t < 60
        )
        recent_hour = len(self.query_history[client_id])
        
        if recent_minute > self.max_queries_per_minute:
            return {
                'allowed': False,
                'reason': 'Rate limit exceeded (per minute)',
                'risk_score': 0.9
            }
        
        if recent_hour > self.max_queries_per_hour:
            return {
                'allowed': False,
                'reason': 'Rate limit exceeded (per hour)',
                'risk_score': 0.9
            }
        
        # Pattern analysis
        self.query_history[client_id].append(now)
        
        # Check prediction diversity
        if len(self.prediction_history[client_id]) > 100:
            recent_preds = self.prediction_history[client_id][-100:]
            entropy = stats.entropy(
                np.bincount(recent_preds) / len(recent_preds)
            )
            
            if entropy < self.entropy_threshold:
                return {
                    'allowed': True,
                    'warning': 'Unusual prediction pattern detected',
                    'risk_score': 0.6
                }
        
        return {'allowed': True, 'risk_score': 0.1}
    
    def log_prediction(self, client_id: str, prediction: int):
        self.prediction_history[client_id].append(prediction)
        
        # Keep last 1000 predictions
        if len(self.prediction_history[client_id]) > 1000:
            self.prediction_history[client_id] = \
                self.prediction_history[client_id][-1000:]

detector = ExtractionDetector(
    max_queries_per_minute=60,
    max_queries_per_hour=500
)

@app.post("/predict")
async def predict_secure(request: PredictionRequest):
    check = detector.check_query(request.client_id, request.features)
    
    if not check['allowed']:
        raise HTTPException(
            status_code=429, 
            detail=check['reason']
        )
    
    # Proceed with prediction
    result = model.predict(request.features)
    detector.log_prediction(request.client_id, result['prediction'])
    
    if check.get('warning'):
        logger.warning(f"Extraction warning: {check['warning']}")
    
    return result
```

## Security Auditing for ML Systems

ML systems have unique security vulnerabilities that traditional security audits miss. A standard penetration test checks for SQL injection, XSS, and authentication bypass. It does not check for adversarial inputs, data poisoning, or model extraction. You need a security audit process that covers ML-specific threats.

The ML security audit has four phases. First, threat modeling: identify what an attacker could gain by compromising your model. Second, vulnerability assessment: test for adversarial robustness, data poisoning resistance, and extraction protection. Third, penetration testing: simulate real attacks against your deployed model. Fourth, remediation: implement defenses for identified vulnerabilities.

```python
class MLSecurityAuditor:
    def __init__(self, model, training_data):
        self.model = model
        self.training_data = training_data
        self.findings = []
    
    def audit_adversarial_robustness(self, test_data, test_labels):
        print("Testing adversarial robustness...")
        
        for epsilon in [0.01, 0.03, 0.05, 0.1]:
            correct = 0
            for x, y in zip(test_data, test_labels):
                x_tensor = torch.tensor(x, dtype=torch.float32).unsqueeze(0)
                y_tensor = torch.tensor([y])
                
                x_adv = fgsm_attack(self.model, x_tensor, y_tensor, epsilon)
                
                with torch.no_grad():
                    pred = self.model(x_adv).argmax(dim=1).item()
                    if pred == y:
                        correct += 1
            
            accuracy = correct / len(test_data)
            self.findings.append({
                'test': 'adversarial_robustness',
                'epsilon': epsilon,
                'accuracy': accuracy,
                'severity': 'high' if accuracy < 0.5 else 'medium' if accuracy < 0.8 else 'low',
            })
            
            print(f"  Epsilon {epsilon}: accuracy={accuracy:.4f}")
    
    def audit_data_poisoning(self, poison_rate=0.1):
        print("Testing data poisoning resistance...")
        
        # Inject poisoned samples
        n_poison = int(len(self.training_data) * poison_rate)
        poisoned_indices = np.random.choice(len(self.training_data), n_poison, replace=False)
        
        poisoned_data = self.training_data.copy()
        for idx in poisoned_indices:
            poisoned_data.iloc[idx, 0] *= -1  # Flip sign of first feature
        
        # Train on poisoned data
        poisoned_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        # ... train poisoned model ...
        
        # Compare predictions
        original_preds = self.model.predict(test_data)
        poisoned_preds = poisoned_model.predict(test_data)
        
        disagreement_rate = (original_preds != poisoned_preds).mean()
        
        self.findings.append({
            'test': 'data_poisoning',
            'poison_rate': poison_rate,
            'disagreement_rate': disagreement_rate,
            'severity': 'high' if disagreement_rate > 0.1 else 'low',
        })
        
        print(f"  Poison rate {poison_rate}: disagreement={disagreement_rate:.4f}")
    
    def audit_model_extraction(self, n_queries=1000):
        print("Testing model extraction resistance...")
        
        # Simulate extraction attack
        queries = torch.randn(n_queries, 128)
        labels = []
        
        for q in queries:
            with torch.no_grad():
                pred = self.model(q.unsqueeze(0)).argmax(dim=1).item()
            labels.append(pred)
        
        # Check query rate limiting
        query_times = np.random.exponential(0.1, n_queries)  # Simulated
        rate_violations = (np.diff(query_times) < 0.01).sum()
        
        self.findings.append({
            'test': 'model_extraction',
            'n_queries': n_queries,
            'rate_violations': rate_violations,
            'severity': 'medium' if rate_violations > 100 else 'low',
        })
        
        print(f"  Queries: {n_queries}, rate violations: {rate_violations}")
    
    def generate_report(self) -> str:
        report = ["ML Security Audit Report", "=" * 50, ""]
        
        high_findings = [f for f in self.findings if f['severity'] == 'high']
        medium_findings = [f for f in self.findings if f['severity'] == 'medium']
        low_findings = [f for f in self.findings if f['severity'] == 'low']
        
        report.append(f"High severity findings: {len(high_findings)}")
        report.append(f"Medium severity findings: {len(medium_findings)}")
        report.append(f"Low severity findings: {len(low_findings)}")
        
        for finding in self.findings:
            report.append(f"\n[{finding['severity'].upper()}] {finding['test']}")
            for key, value in finding.items():
                if key not in ['test', 'severity']:
                    report.append(f"  {key}: {value}")
        
        return "\n".join(report)

auditor = MLSecurityAuditor(model, X_train)
auditor.audit_adversarial_robustness(X_test.values, y_test.values)
auditor.audit_data_poisoning(poison_rate=0.1)
auditor.audit_model_extraction(n_queries=1000)
print(auditor.generate_report())
```

The security audit is not a one-time activity. It should be repeated whenever the model is retrained, the data pipeline changes, or new threat intelligence emerges. Automate the audit as part of the CI/CD pipeline so every model deployment includes a security check.

## Threat Modeling for ML Systems

Before implementing defenses, you need to understand what you are defending against. Threat modeling identifies the assets (model, data, predictions), the adversaries (competitors, malicious users, insider threats), and the attack vectors (adversarial inputs, data poisoning, model extraction).

The STRIDE framework adapted for ML identifies six threat categories. Spoofing: an attacker impersonates a legitimate user to access model predictions. Tampering: an attacker modifies inputs to cause misclassification. Repudiation: an attacker denies making specific queries (relevant for audit trails). Information disclosure: an attacker extracts model parameters or training data. Denial of service: an attacker floods the model with requests. Elevation of privilege: an attacker gains access to the training pipeline.

Each threat category requires specific defenses. Spoofing requires authentication. Tampering requires input validation and adversarial robustness. Repudiation requires comprehensive logging. Information disclosure requires model extraction detection. Denial of service requires rate limiting. Elevation of privilege requires access controls on the training infrastructure.

The threat model should be documented and reviewed regularly. As your ML system evolves—new features, new data sources, new users—the threat landscape changes. A model that was safe last year might be vulnerable this year because an attacker discovered a new technique or because your system now handles sensitive data it did not handle before.

## Security Best Practices for ML Teams

Security is not just the security team's job. Every ML engineer must follow security practices in their daily work. Here are the practices that matter most.

First, never store secrets in code or configuration files. Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault) for API keys, database credentials, and encryption keys. Secrets in code are committed to Git and visible to anyone with repository access.

Second, use role-based access control (RBAC) for all ML infrastructure. Not everyone needs access to the training pipeline, the model registry, or the production database. Grant minimum necessary access and review permissions quarterly.

Third, encrypt data at rest and in transit. Training data contains sensitive information. Model artifacts contain learned patterns from that data. Both must be encrypted when stored and when transmitted between services.

Fourth, audit all access to models and data. Log who accessed what, when, and from where. These logs are essential for incident response and compliance audits. Without access logs, you cannot determine whether an attacker accessed your model or training data.

Fifth, regularly update dependencies. ML libraries have vulnerabilities just like any other software. Keep PyTorch, TensorFlow, scikit-learn, and other dependencies up to date. Use automated dependency scanning tools to catch known vulnerabilities.

## Assessment

### Lab Task 1: Implement Adversarial Attacks (Time: 90 minutes)

Implement FGSM and PGD attacks and measure their effectiveness.

**Steps:**
1. Implement FGSM attack with configurable epsilon.
2. Implement PGD attack with configurable steps and alpha.
3. Measure attack success rate at epsilon values 0.01, 0.03, 0.05, 0.1.
4. Visualize adversarial examples alongside originals.
5. Compare attack success rates across different model architectures.

**Grading Criteria:**
- FGSM attack correctly computes gradients and perturbs inputs (15 points)
- PGD attack iteratively refines perturbations (15 points)
- Epsilon sweep produces meaningful results (15 points)
- Visualizations show perturbations clearly (10 points)
- Attack success rates are correctly computed (15 points)
- Results are compared across model architectures (15 points)
- Code is well-documented with clear variable names (15 points)

### Lab Task 2: Adversarial Training (Time: 75 minutes)

Implement adversarial training and measure the robustness-accuracy tradeoff.

**Steps:**
1. Train a baseline model without adversarial training.
2. Implement adversarial training with PGD attacks.
3. Train models with epsilon values 0.01, 0.03, 0.05.
4. Measure clean accuracy and adversarial accuracy for each.
5. Plot the robustness-accuracy tradeoff curve.

**Grading Criteria:**
- Baseline model achieves expected clean accuracy (10 points)
- Adversarial training uses PGD during training (15 points)
- Multiple epsilon values produce different tradeoff points (15 points)
- Clean accuracy decreases as epsilon increases (15 points)
- Adversarial accuracy increases as epsilon increases (15 points)
- Tradeoff curve is plotted and interpreted (15 points)
- Analysis discusses practical implications (15 points)

### Lab Task 3: Data Poisoning Detection (Time: 60 minutes)

Implement detection of poisoned training data.

**Steps:**
1. Inject backdoor triggers into 10% of training data.
2. Train a model on poisoned data and verify the backdoor works.
3. Implement spectral signature detection.
4. Implement high-confidence misclassification detection.
5. Measure detection precision and recall.

**Grading Criteria:**
- Backdoor injection works correctly (10 points)
- Poisoned model exhibits backdoor behavior (10 points)
- Spectral signature detection flags poisoned samples (20 points)
- High-confidence detection identifies suspicious samples (15 points)
- Detection precision and recall are computed correctly (20 points)
- Defense removes most poisoned samples (15 points)
- Analysis discusses limitations of each defense (10 points)

## Evidence

- `adversarial_attacks.py` — FGSM and PGD attack implementations with evaluation metrics
- `adversarial_training.py` — Adversarial training loop with robustness-accuracy tracking
- `randomized_smoothing.py` — Randomized smoothing classifier with certification radius computation
- `data_poisoning.py` — Backdoor injection and spectral signature detection
- `extraction_detector.py` — Rate limiting and query pattern analysis for extraction defense
- `robustness_tradeoff.csv` — Results of robustness-accuracy experiments across epsilon values
- `attack_visualizations.png` — Side-by-side comparison of clean and adversarial examples
