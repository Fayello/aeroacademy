# Module 9: ML Governance

## Governance Is How You Sleep at Night

When your model denies a loan application, who is responsible? When it misclassifies a medical image, who gets sued? When it leaks training data through its API, who notifies the affected users? These are not hypothetical questions. They are the questions that regulators, lawyers, and executives ask when something goes wrong. ML governance is the system of policies, processes, and tools that ensures you can answer those questions.

This module covers the practical implementation of ML governance: model registries that track every model version and its lineage, approval workflows that prevent unauthorized models from reaching production, audit logs that prove compliance with regulations, and documentation requirements that make your models reproducible and understandable.

## The Model Registry: Your Single Source of Truth

A model registry is a centralized catalog of all trained models. It records who trained each model, what data it was trained on, what hyperparameters were used, and what its performance metrics are. Without a registry, you end up with a directory of model files named `model_v3_final.pkl` and no way to know which one is in production.

```python
import json
import hashlib
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, List, Optional

class ModelStage(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"

@dataclass
class ModelVersion:
    version_id: str
    model_name: str
    stage: ModelStage
    artifacts: Dict[str, str]
    metrics: Dict[str, float]
    parameters: Dict[str, any]
    data_hash: str
    code_hash: str
    description: str
    created_by: str
    created_at: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    tags: List[str] = None
    lineage: Dict[str, str] = None

class ModelRegistry:
    def __init__(self, registry_path: str):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(parents=True, exist_ok=True)
        self._load_registry()
    
    def _load_registry(self):
        registry_file = self.registry_path / 'registry.json'
        if registry_file.exists():
            with open(registry_file) as f:
                self.registry = json.load(f)
        else:
            self.registry = {
                'models': {},
                'versions': {},
                'audit_log': []
            }
    
    def _save_registry(self):
        with open(self.registry_path / 'registry.json', 'w') as f:
            json.dump(self.registry, f, indent=2, default=str)
    
    def _compute_hash(self, data) -> str:
        return hashlib.sha256(
            json.dumps(data, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
    
    def register_model(
        self, model_name: str, version_id: str,
        artifacts: Dict[str, str], metrics: Dict[str, float],
        parameters: Dict, data_info: Dict, code_info: Dict,
        description: str, created_by: str, tags: List[str] = None
    ) -> ModelVersion:
        data_hash = self._compute_hash(data_info)
        code_hash = self._compute_hash(code_info)
        
        model_version = ModelVersion(
            version_id=version_id,
            model_name=model_name,
            stage=ModelStage.DEVELOPMENT,
            artifacts=artifacts,
            metrics=metrics,
            parameters=parameters,
            data_hash=data_hash,
            code_hash=code_hash,
            description=description,
            created_by=created_by,
            created_at=datetime.utcnow().isoformat(),
            tags=tags or [],
            lineage={
                'data_hash': data_hash,
                'code_hash': code_hash,
                'parent_version': None,
            }
        )
        
        key = f"{model_name}/{version_id}"
        self.registry['versions'][key] = asdict(model_version)
        
        if model_name not in self.registry['models']:
            self.registry['models'][model_name] = {
                'latest_version': version_id,
                'created_at': datetime.utcnow().isoformat(),
                'description': description,
            }
        
        self._log_audit('register', key, created_by, {
            'version_id': version_id,
            'stage': ModelStage.DEVELOPMENT.value,
        })
        
        self._save_registry()
        return model_version
    
    def transition_stage(
        self, model_name: str, version_id: str,
        new_stage: ModelStage, approved_by: str,
        approval_notes: str = ""
    ) -> ModelVersion:
        key = f"{model_name}/{version_id}"
        
        if key not in self.registry['versions']:
            raise ValueError(f"Model version {key} not found")
        
        version_data = self.registry['versions'][key]
        current_stage = ModelStage(version_data['stage'])
        
        valid_transitions = {
            ModelStage.DEVELOPMENT: [ModelStage.STAGING, ModelStage.ARCHIVED],
            ModelStage.STAGING: [ModelStage.PRODUCTION, ModelStage.ARCHIVED, ModelStage.DEVELOPMENT],
            ModelStage.PRODUCTION: [ModelStage.ARCHIVED, ModelStage.STAGING],
            ModelStage.ARCHIVED: [ModelStage.DEVELOPMENT],
        }
        
        if new_stage not in valid_transitions.get(current_stage, []):
            raise ValueError(
                f"Invalid transition: {current_stage.value} -> {new_stage.value}"
            )
        
        version_data['stage'] = new_stage.value
        version_data['approved_by'] = approved_by
        version_data['approved_at'] = datetime.utcnow().isoformat()
        
        if new_stage == ModelStage.PRODUCTION:
            version_data['tags'] = version_data.get('tags', [])
            version_data['tags'].append('production')
            self.registry['models'][model_name]['production_version'] = version_id
        
        self._log_audit('transition', key, approved_by, {
            'from_stage': current_stage.value,
            'to_stage': new_stage.value,
            'notes': approval_notes,
        })
        
        self._save_registry()
        return ModelVersion(**version_data)
    
    def get_model_version(
        self, model_name: str, version_id: str = None
    ) -> Dict:
        if version_id:
            key = f"{model_name}/{version_id}"
            return self.registry['versions'].get(key)
        
        # Return production version
        model_info = self.registry['models'].get(model_name)
        if model_info and 'production_version' in model_info:
            prod_version = model_info['production_version']
            return self.registry['versions'].get(f"{model_name}/{prod_version}")
        
        return None
    
    def list_versions(self, model_name: str) -> List[Dict]:
        versions = []
        for key, data in self.registry['versions'].items():
            if key.startswith(f"{model_name}/"):
                versions.append(data)
        return sorted(versions, key=lambda v: v['created_at'], reverse=True)
    
    def _log_audit(
        self, action: str, resource: str, 
        actor: str, details: Dict
    ):
        self.registry['audit_log'].append({
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'resource': resource,
            'actor': actor,
            'details': details,
        })

# Usage
registry = ModelRegistry('model_registry')

# Register a new model
model_version = registry.register_model(
    model_name='fraud_detector',
    version_id='v1.0.0',
    artifacts={'model': 'models/fraud_v1.pt', 'preprocessor': 'preprocessor.pkl'},
    metrics={'f1': 0.85, 'precision': 0.82, 'recall': 0.88},
    parameters={'n_estimators': 200, 'max_depth': 5, 'learning_rate': 0.1},
    data_info={'path': 'data/transactions.parquet', 'rows': 50000, 'features': 128},
    code_info={'git_commit': 'abc123', 'branch': 'main'},
    description='Initial fraud detection model',
    created_by='ml-engineer-1',
    tags=['fraud', 'production-candidate']
)

# Move to staging
registry.transition_stage(
    'fraud_detector', 'v1.0.0', ModelStage.STAGING,
    approved_by='ml-lead',
    approval_notes='Passed all validation tests'
)

# Move to production
registry.transition_stage(
    'fraud_detector', 'v1.0.0', ModelStage.PRODUCTION,
    approved_by='ml-director',
    approval_notes='A/B test passed, approved for full deployment'
)
```

The stage transition validation prevents accidental deployments. A model must pass through development, staging, and production in order. Each transition requires approval from a different person, creating separation of duties.

## Lineage Tracking: Proving Where Your Model Came From

Lineage tracking records the exact data, code, and configuration that produced a model. When a regulator asks "why did this model deny this person's loan?", you need to trace the model back to its inputs and prove that those inputs were legitimate.

```python
class LineageTracker:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
    
    def record_training_lineage(
        self, model_name: str, version_id: str,
        training_config: Dict,
        data_sources: List[Dict],
        code_versions: List[Dict],
        environment: Dict
    ):
        lineage = {
            'training_config': training_config,
            'data_sources': data_sources,
            'code_versions': code_versions,
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat(),
        }
        
        key = f"{model_name}/{version_id}"
        self.registry.registry['versions'][key]['lineage'] = lineage
        self.registry._save_registry()
    
    def trace_lineage(self, model_name: str, version_id: str) -> Dict:
        key = f"{model_name}/{version_id}"
        version = self.registry.registry['versions'].get(key)
        
        if not version:
            return None
        
        lineage = version.get('lineage', {})
        
        # Trace data lineage
        data_hash = lineage.get('data_hash')
        data_sources = lineage.get('data_sources', [])
        
        # Trace code lineage
        code_hash = lineage.get('code_hash')
        code_versions = lineage.get('code_versions', [])
        
        # Trace model lineage
        parent = lineage.get('parent_version')
        
        return {
            'model': f"{model_name}/{version_id}",
            'data': {
                'hash': data_hash,
                'sources': data_sources,
            },
            'code': {
                'hash': code_hash,
                'versions': code_versions,
            },
            'training_config': lineage.get('training_config'),
            'environment': lineage.get('environment'),
            'parent_model': parent,
        }
    
    def generate_lineage_report(self, model_name: str, version_id: str) -> str:
        lineage = self.trace_lineage(model_name, version_id)
        
        if not lineage:
            return "No lineage information found"
        
        report = [
            f"Lineage Report: {lineage['model']}",
            "=" * 50,
            "",
            "Data Sources:",
        ]
        
        for source in lineage['data']['sources']:
            report.append(f"  - {source.get('name', 'unknown')}: {source.get('path', 'N/A')}")
        
        report.extend([
            "",
            "Code Versions:",
        ])
        
        for code in lineage['code']['versions']:
            report.append(f"  - {code.get('repository', 'N/A')}: {code.get('commit', 'N/A')}")
        
        report.extend([
            "",
            f"Training Config: {lineage.get('training_config', {})}",
            f"Environment: {lineage.get('environment', {})}",
        ])
        
        return "\n".join(report)

lineage_tracker = LineageTracker(registry)
```

## Approval Workflows

Model deployment must follow an approval process. No model reaches production without explicit approval from designated reviewers. The approval process enforces quality gates: the model must pass accuracy thresholds, fairness checks, security scans, and documentation requirements.

```python
from enum import Enum
from dataclasses import dataclass, field
from typing import Callable

class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

@dataclass
class ApprovalGate:
    name: str
    check_fn: Callable
    required: bool = True
    description: str = ""

@dataclass
class ApprovalRequest:
    request_id: str
    model_name: str
    version_id: str
    requested_by: str
    requested_at: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    gates: List[Dict] = field(default_factory=list)
    approvals: List[Dict] = field(default_factory=list)
    rejections: List[Dict] = field(default_factory=list)

class ApprovalWorkflow:
    def __init__(self):
        self.gates = []
        self.requests = {}
    
    def add_gate(self, gate: ApprovalGate):
        self.gates.append(gate)
    
    def create_request(
        self, model_name: str, version_id: str, 
        requested_by: str
    ) -> ApprovalRequest:
        request = ApprovalRequest(
            request_id=f"{model_name}_{version_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            model_name=model_name,
            version_id=version_id,
            requested_by=requested_by,
            requested_at=datetime.utcnow().isoformat(),
        )
        
        # Evaluate all gates
        for gate in self.gates:
            try:
                passed = gate.check_fn(model_name, version_id)
                request.gates.append({
                    'name': gate.name,
                    'passed': passed,
                    'required': gate.required,
                    'checked_at': datetime.utcnow().isoformat(),
                })
            except Exception as e:
                request.gates.append({
                    'name': gate.name,
                    'passed': False,
                    'required': gate.required,
                    'error': str(e),
                    'checked_at': datetime.utcnow().isoformat(),
                })
        
        # Check if all required gates passed
        all_required_passed = all(
            g['passed'] for g in request.gates if g['required']
        )
        
        if all_required_passed:
            request.status = ApprovalStatus.APPROVED
        else:
            request.status = ApprovalStatus.PENDING
        
        self.requests[request.request_id] = request
        return request
    
    def approve(
        self, request_id: str, approver: str, 
        notes: str = ""
    ):
        request = self.requests[request_id]
        
        if request.status != ApprovalStatus.PENDING:
            raise ValueError(f"Request {request_id} is not pending")
        
        request.approvals.append({
            'approver': approver,
            'timestamp': datetime.utcnow().isoformat(),
            'notes': notes,
        })
        
        # Check if enough approvals received
        if len(request.approvals) >= 2:  # Require 2 approvals
            request.status = ApprovalStatus.APPROVED
        
        self.requests[request_id] = request
    
    def reject(
        self, request_id: str, rejector: str, 
        reason: str
    ):
        request = self.requests[request_id]
        request.status = ApprovalStatus.REJECTED
        request.rejections.append({
            'rejector': rejector,
            'timestamp': datetime.utcnow().isoformat(),
            'reason': reason,
        })
        self.requests[request_id] = request

# Define quality gates
def accuracy_gate(model_name, version_id):
    registry = ModelRegistry('model_registry')
    version = registry.get_model_version(model_name, version_id)
    return version['metrics'].get('f1', 0) >= 0.70

def fairness_gate(model_name, version_id):
    # Placeholder: would check fairness metrics
    return True

def security_gate(model_name, version_id):
    # Placeholder: would run security scan
    return True

def documentation_gate(model_name, version_id):
    registry = ModelRegistry('model_registry')
    version = registry.get_model_version(model_name, version_id)
    return bool(version.get('description'))

workflow = ApprovalWorkflow()
workflow.add_gate(ApprovalGate("accuracy", accuracy_gate, True, "F1 >= 0.70"))
workflow.add_gate(ApprovalGate("fairness", fairness_gate, True, "No bias detected"))
workflow.add_gate(ApprovalGate("security", security_gate, True, "No vulnerabilities"))
workflow.add_gate(ApprovalGate("documentation", documentation_gate, True, "Description provided"))

# Create approval request
request = workflow.create_request('fraud_detector', 'v1.0.0', 'ml-engineer-1')
print(f"Request status: {request.status.value}")

# Approve
workflow.approve(request.request_id, 'ml-lead', 'Looks good')
workflow.approve(request.request_id, 'ml-director', 'Approved for production')
```

## Audit Logging

Every action on a model must be logged. Who registered the model, who approved it, who deployed it, who modified it. Audit logs are not optionalthey are required by regulations like GDPR, HIPAA, and SOX.

```python
import logging
from typing import Any

class AuditLogger:
    def __init__(self, log_path: str):
        self.log_path = Path(log_path)
        self.log_path.mkdir(parents=True, exist_ok=True)
        
        self.logger = logging.getLogger('ml_audit')
        self.logger.setLevel(logging.INFO)
        
        handler = logging.FileHandler(
            self.log_path / 'audit.log'
        )
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(message)s'
        ))
        self.logger.addHandler(handler)
    
    def log_event(
        self, event_type: str, resource: str,
        actor: str, details: Dict[str, Any],
        severity: str = 'INFO'
    ):
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'resource': resource,
            'actor': actor,
            'details': details,
            'severity': severity,
        }
        
        self.logger.info(json.dumps(event, default=str))
        
        # Also store in structured format
        event_file = self.log_path / f"{event_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(event_file, 'w') as f:
            json.dump(event, f, indent=2, default=str)
    
    def log_model_registration(
        self, model_name: str, version_id: str,
        registered_by: str, details: Dict
    ):
        self.log_event(
            'model_registered',
            f"{model_name}/{version_id}",
            registered_by,
            details
        )
    
    def log_model_deployment(
        self, model_name: str, version_id: str,
        deployed_by: str, environment: str
    ):
        self.log_event(
            'model_deployed',
            f"{model_name}/{version_id}",
            deployed_by,
            {'environment': environment}
        )
    
    def log_prediction(
        self, model_name: str, version_id: str,
        input_hash: str, prediction: Any,
        latency_ms: float
    ):
        self.log_event(
            'prediction_served',
            f"{model_name}/{version_id}",
            'system',
            {
                'input_hash': input_hash,
                'prediction': prediction,
                'latency_ms': latency_ms,
            }
        )
    
    def log_data_access(
        self, dataset_name: str, accessed_by: str,
        purpose: str, rows_accessed: int
    ):
        self.log_event(
            'data_access',
            dataset_name,
            accessed_by,
            {
                'purpose': purpose,
                'rows_accessed': rows_accessed,
            }
        )
    
    def generate_audit_report(
        self, start_date: str, end_date: str
    ) -> pd.DataFrame:
        events = []
        
        for event_file in self.log_path.glob('*.json'):
            with open(event_file) as f:
                event = json.load(f)
                if start_date <= event['timestamp'][:10] <= end_date:
                    events.append(event)
        
        return pd.DataFrame(events)

audit = AuditLogger('audit_logs')

# Log events
audit.log_model_registration(
    'fraud_detector', 'v1.0.0', 'ml-engineer-1',
    {'metrics': {'f1': 0.85}, 'data_hash': 'abc123'}
)

audit.log_model_deployment(
    'fraud_detector', 'v1.0.0', 'ml-director', 'production'
)

audit.log_data_access(
    'transactions', 'ml-engineer-1', 'model_training', 50000
)
```

## Model Documentation Requirements

Every model in production must have documentation that explains what it does, how it was built, and what its limitations are. This documentation serves three audiences: engineers who maintain the model, auditors who verify compliance, and stakeholders who make decisions based on the model's outputs.

```python
class ModelDocumentation:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
    
    def generate_model_card(
        self, model_name: str, version_id: str
    ) -> str:
        version = self.registry.get_model_version(model_name, version_id)
        
        card = f"""# Model Card: {model_name} {version_id}

## Model Details
- **Model Name:** {model_name}
- **Version:** {version_id}
- **Stage:** {version['stage']}
- **Created By:** {version['created_by']}
- **Created At:** {version['created_at']}
- **Description:** {version['description']}

## Intended Use
- **Primary Use Case:** Fraud detection for financial transactions
- **Out-of-Scope Uses:** Medical diagnosis, criminal profiling
- **Users:** Fraud analysts, automated transaction processing

## Training Data
- **Dataset:** Transactions dataset
- **Data Hash:** {version.get('data_hash', 'N/A')}
- **Size:** {version.get('data_info', {}).get('rows', 'N/A')} rows
- **Features:** {version.get('data_info', {}).get('features', 'N/A')} features
- **Time Period:** 2023-01-01 to 2023-12-31

## Model Architecture
- **Type:** Gradient Boosting Classifier
- **Parameters:** {json.dumps(version.get('parameters', {}), indent=2)}

## Performance Metrics
- **F1 Score:** {version.get('metrics', {}).get('f1', 'N/A')}
- **Precision:** {version.get('metrics', {}).get('precision', 'N/A')}
- **Recall:** {version.get('metrics', {}).get('recall', 'N/A')}

## Fairness Metrics
- **Demographic Parity:** Not evaluated
- **Equalized Odds:** Not evaluated

## Limitations
- May perform poorly on transactions from new merchant categories
- Performance degrades when fraud patterns change significantly
- Requires retraining every 30 days to maintain accuracy

## Ethical Considerations
- Model decisions may affect customer access to financial services
- False positives may inconvenience legitimate customers
- False negatives result in financial losses

## Monitoring
- **Drift Detection:** PSI monitored daily
- **Performance:** F1 score tracked weekly
- **Alerts:** F1 < 0.70 triggers investigation

## Version History
"""
        versions = self.registry.list_versions(model_name)
        for v in versions:
            card += f"- **{v['version_id']}:** {v['stage']} ({v['created_at'][:10]})\n"
        
        return card

doc_generator = ModelDocumentation(registry)
model_card = doc_generator.generate_model_card('fraud_detector', 'v1.0.0')
print(model_card)
```

## Compliance Checklist

Before deploying a model, you must verify compliance with relevant regulations. This checklist ensures nothing is missed.

```python
class ComplianceChecker:
    def __init__(self):
        self.checks = []
    
    def add_check(self, name: str, check_fn: Callable, regulation: str):
        self.checks.append({
            'name': name,
            'check_fn': check_fn,
            'regulation': regulation,
        })
    
    def run_checks(self, model_info: Dict) -> Dict:
        results = []
        
        for check in self.checks:
            try:
                passed = check['check_fn'](model_info)
                results.append({
                    'check': check['name'],
                    'regulation': check['regulation'],
                    'passed': passed,
                })
            except Exception as e:
                results.append({
                    'check': check['name'],
                    'regulation': check['regulation'],
                    'passed': False,
                    'error': str(e),
                })
        
        all_passed = all(r['passed'] for r in results)
        
        return {
            'compliant': all_passed,
            'results': results,
            'timestamp': datetime.utcnow().isoformat(),
        }

def check_data_retention(model_info):
    return model_info.get('data_retention_days', 0) <= 365

def check_consent(model_info):
    return model_info.get('has_consent', False)

def check_explanation(model_info):
    return model_info.get('has_explanation', False)

def check_audit_log(model_info):
    return model_info.get('has_audit_log', False)

compliance = ComplianceChecker()
compliance.add_check('data_retention', check_data_retention, 'GDPR')
compliance.add_check('consent', check_consent, 'GDPR')
compliance.add_check('explanation', check_explanation, 'GDPR')
compliance.add_check('audit_log', check_audit_log, 'SOX')

result = compliance.run_checks({
    'data_retention_days': 90,
    'has_consent': True,
    'has_explanation': True,
    'has_audit_log': True,
})

print(f"Compliant: {result['compliant']}")
for r in result['results']:
    status = "PASS" if r['passed'] else "FAIL"
    print(f"  [{status}] {r['check']} ({r['regulation']})")
```

## Risk Management for ML Systems

ML systems introduce risks that traditional software does not have. A model can make incorrect predictions that cause financial loss, legal liability, or reputational damage. Risk management identifies, assesses, and mitigates these risks before they materialize.

The ML risk taxonomy has four categories. Model risk: the model makes incorrect predictions. Data risk: the training data is biased, corrupted, or outdated. Operational risk: the serving infrastructure fails. Compliance risk: the model violates regulations.

Each category requires different mitigation strategies. Model risk is mitigated by thorough testing, monitoring, and human oversight. Data risk is mitigated by data quality checks, bias detection, and regular retraining. Operational risk is mitigated by redundancy, failover, and disaster recovery. Compliance risk is mitigated by documentation, audits, and legal review.

```python
class MLRiskManager:
    def __init__(self):
        self.risks = []
        self.mitigations = {}
    
    def identify_risk(self, category: str, description: str, 
                      likelihood: str, impact: str):
        risk_id = f"RISK_{len(self.risks) + 1:03d}"
        
        risk = {
            'id': risk_id,
            'category': category,
            'description': description,
            'likelihood': likelihood,
            'impact': impact,
            'risk_score': self._compute_score(likelihood, impact),
        }
        
        self.risks.append(risk)
        return risk_id
    
    def _compute_score(self, likelihood: str, impact: str) -> int:
        likelihood_scores = {'low': 1, 'medium': 2, 'high': 3}
        impact_scores = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        return likelihood_scores[likelihood] * impact_scores[impact]
    
    def add_mitigation(self, risk_id: str, mitigation: str, 
                       owner: str, deadline: str):
        if risk_id not in self.mitigations:
            self.mitigations[risk_id] = []
        
        self.mitigations[risk_id].append({
            'mitigation': mitigation,
            'owner': owner,
            'deadline': deadline,
            'status': 'pending',
        })
    
    def generate_risk_report(self) -> str:
        report = ["ML Risk Management Report", "=" * 50]
        
        # Sort by risk score
        sorted_risks = sorted(self.risks, key=lambda r: r['risk_score'], reverse=True)
        
        for risk in sorted_risks:
            report.append(f"\n{risk['id']}: {risk['description']}")
            report.append(f"  Category: {risk['category']}")
            report.append(f"  Likelihood: {risk['likelihood']}, Impact: {risk['impact']}")
            report.append(f"  Risk Score: {risk['risk_score']}")
            
            if risk['id'] in self.mitigations:
                for m in self.mitigations[risk['id']]:
                    report.append(f"  Mitigation: {m['mitigation']} ({m['owner']}, {m['deadline']})")
        
        return "\n".join(report)

risk_manager = MLRiskManager()

# Identify risks
risk_manager.identify_risk(
    'model', 'Model makes incorrect fraud predictions',
    likelihood='medium', impact='high'
)
risk_manager.identify_risk(
    'data', 'Training data has biased fraud labels',
    likelihood='low', impact='critical'
)
risk_manager.identify_risk(
    'operational', 'Model serving goes down during peak traffic',
    likelihood='medium', impact='high'
)
risk_manager.identify_risk(
    'compliance', 'Model violates fair lending regulations',
    likelihood='low', impact='critical'
)

# Add mitigations
risk_manager.add_mitigation(
    'RISK_001', 'Implement A/B testing and monitoring',
    'ml-team', '2024-02-01'
)
risk_manager.add_mitigation(
    'RISK_002', 'Audit training data for bias quarterly',
    'data-team', '2024-01-15'
)

print(risk_manager.generate_risk_report())
```

The risk score combines likelihood and impact. A high-likelihood, high-impact risk scores 9 and requires immediate attention. A low-likelihood, low-impact risk scores 1 and can be monitored without immediate action. The risk report prioritizes risks by score, ensuring the most dangerous issues are addressed first.

## Change Management for ML Models

Changing a production model is not like changing a production API. An API change is atomicyou deploy the new code and it takes effect immediately. A model change is gradualyou deploy the new model and its effects emerge over time as it processes new data. This gradual effect makes change management more complex.

The change management process for ML has five steps. First, document the change: what is different, why it is different, and what the expected impact is. Second, get approval: the change must be reviewed by someone who understands the model and its implications. Third, test the change: run the model on historical data and compare results. Fourth, deploy gradually: use canary deployment to limit the blast radius. Fifth, monitor the change: watch for unexpected effects and be ready to roll back.

```python
class ChangeManager:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.changes = []
    
    def propose_change(self, model_name: str, old_version: str, 
                       new_version: str, reason: str, 
                       expected_impact: dict) -> str:
        change_id = f"CHG_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        change = {
            'id': change_id,
            'model_name': model_name,
            'old_version': old_version,
            'new_version': new_version,
            'reason': reason,
            'expected_impact': expected_impact,
            'status': 'proposed',
            'created_at': datetime.utcnow().isoformat(),
        }
        
        self.changes.append(change)
        return change_id
    
    def approve_change(self, change_id: str, approver: str, notes: str):
        for change in self.changes:
            if change['id'] == change_id:
                change['status'] = 'approved'
                change['approved_by'] = approver
                change['approval_notes'] = notes
                change['approved_at'] = datetime.utcnow().isoformat()
                return True
        return False
    
    def execute_change(self, change_id: str) -> dict:
        for change in self.changes:
            if change['id'] == change_id:
                if change['status'] != 'approved':
                    return {'error': 'Change not approved'}
                
                # Deploy new version
                change['status'] = 'executed'
                change['executed_at'] = datetime.utcnow().isoformat()
                
                return {
                    'status': 'executed',
                    'old_version': change['old_version'],
                    'new_version': change['new_version'],
                }
        return {'error': 'Change not found'}

change_manager = ChangeManager(registry)

# Propose a change
change_id = change_manager.propose_change(
    'fraud_detector', 'v1.0.0', 'v1.1.0',
    'Improved recall by 5% with new features',
    {'expected_f1_improvement': 0.05, 'expected_latency_change': 'no change'}
)

# Approve
change_manager.approve_change(change_id, 'ml-director', 'Approved based on A/B test results')

# Execute
result = change_manager.execute_change(change_id)
print(result)
```

The change manager enforces the process. No model change reaches production without documentation, approval, and gradual rollout. This prevents the "rogue data scientist" problem where someone deploys a model without proper review.

The change management process also creates an audit trail. When an auditor asks "why was this model deployed on March 15?", the change manager has the answer: who proposed it, who approved it, what the expected impact was, and what the actual impact was. This audit trail is essential for regulatory compliance and for internal accountability.

## Building a Governance Culture

Governance is not just tools and processesit is a culture. The best governance system fails if people do not follow it. Building a governance culture requires leadership buy-in, clear communication, and consistent enforcement.

Leadership buy-in means executives must value governance. If the VP of Engineering says "just ship it, we will fix it later," engineers will skip governance steps. If the VP says "no model reaches production without passing quality gates," engineers will follow the process. Leadership sets the tone.

Clear communication means everyone understands why governance matters. Engineers who see governance as bureaucracy will resist it. Engineers who understand that governance prevents incidents, protects users, and enables compliance will embrace it. Explain the "why" before the "what."

Consistent enforcement means governance applies to everyone equally. If the CEO's pet project skips quality gates, the governance system loses credibility. If the most senior data scientist's model goes through the same review as a junior engineer's model, the system is perceived as fair and worth following.

The governance system should be lightweight enough that it does not slow down development. If every model change requires a two-week approval process, engineers will find ways to bypass it. If every change requires a one-hour review, engineers will follow it. Optimize for compliance, not for control.

## Assessment

### Lab Task 1: Build a Model Registry (Time: 90 minutes)

Implement a model registry with versioning, stage transitions, and audit logging.

**Steps:**
1. Implement the `ModelRegistry` class with `register_model()`, `transition_stage()`, and `get_model_version()`.
2. Add stage transition validation (development -> staging -> production).
3. Implement audit logging for all registry operations.
4. Add data and code hash tracking for lineage.
5. Register a model, move it through stages, and verify the audit log.
6. Generate a model card for the registered model.

**Grading Criteria:**
- Model registration stores all metadata correctly (15 points)
- Stage transitions enforce valid paths (15 points)
- Audit log captures all operations with timestamps (15 points)
- Data and code hashes are computed and stored (10 points)
- Model card is comprehensive and accurate (15 points)
- Registry handles concurrent access safely (10 points)
- Error handling for invalid transitions and missing models (10 points)
- Registry persists across restarts (10 points)

### Lab Task 2: Approval Workflow (Time: 75 minutes)

Build an approval workflow with quality gates.

**Steps:**
1. Define quality gates: accuracy threshold, fairness check, security scan, documentation.
2. Implement the `ApprovalWorkflow` class with `create_request()`, `approve()`, and `reject()`.
3. Require 2 approvals for production deployment.
4. Gate checks must run automatically when a request is created.
5. Log all approval decisions with reasons.

**Grading Criteria:**
- Quality gates execute correctly (15 points)
- Approval workflow requires correct number of approvals (15 points)
- Gates that fail block deployment (15 points)
- Rejection prevents further approvals (10 points)
- All decisions are logged with reasons (15 points)
- Workflow handles edge cases (duplicate requests, expired approvals) (15 points)
- Documentation explains the workflow (15 points)

### Lab Task 3: Compliance Audit (Time: 60 minutes)

Run a compliance audit on a production model.

**Steps:**
1. Define compliance checks for GDPR, SOX, and internal policies.
2. Run all checks against a registered model.
3. Generate a compliance report with pass/fail status for each check.
4. Identify the most critical compliance gaps.
5. Recommend specific actions to address each gap.

**Grading Criteria:**
- Compliance checks cover all required regulations (15 points)
- Report correctly identifies passing and failing checks (15 points)
- Critical gaps are correctly prioritized (15 points)
- Recommendations are specific and actionable (15 points)
- Report is suitable for auditor review (15 points)
- Code is reusable for different models and regulations (15 points)
- Audit trail is complete and verifiable (10 points)

## Evidence

- `model_registry.py`: Complete model registry with versioning and stage management
- `lineage_tracker.py`: Lineage tracking module with data and code hash verification
- `approval_workflow.py`: Approval workflow with quality gates and multi-approver support
- `audit_logger.py`: Audit logging system with structured event storage
- `model_card_template.md`: Model card template with all required sections
- `compliance_checker.py`: Compliance checking module for GDPR and SOX
- `audit_report.pdf`: Sample audit report from a production model
