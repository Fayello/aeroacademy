# Module 10 — Advanced Security

Kubernetes security isn't a single layer — it's defense in depth. Pod security stops you from running privileged containers. RBAC limits who can do what. Network policies control traffic. But attackers find ways around individual controls. Advanced security means layering multiple controls so that no single bypass gives an attacker full access. This module covers OPA/Gatekeeper policies, Falco runtime detection, network policy enforcement, supply chain security, and the practical implementation of defense in depth.

## OPA/Gatekeeper

Open Policy Agent (OPA) is a general-purpose policy engine. Gatekeeper is the Kubernetes integration for OPA. It uses Custom Resource Definitions (CRDs) to define and enforce policies.

### How Gatekeeper Works

1. You define a `ConstraintTemplate` — a reusable Rego policy.
2. You create a `Constraint` — an instance of the template with specific parameters.
3. Gatekeeper watches for resource changes and evaluates them against active Constraints.
4. If a resource violates a Constraint, Gatekeeper rejects it (or warns, depending on enforcement mode).

### Installation

```bash
# Install Gatekeeper
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v3.15.0/deploy/gatekeeper.yaml

# Verify installation
kubectl -n gatekeeper-system get pods
```

### Common Constraint Templates

**1. Require Labels**

```yaml
# require-labels-template.yaml
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
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        
        violation[{"msg": msg}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }
```

```yaml
# require-labels-constraint.yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
  parameters:
    labels:
    - team
    - environment
```

**2. Restrict Image Registries**

```yaml
# allowed-registries-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedregistries
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRegistries
      validation:
        openAPIV3Schema:
          type: object
          properties:
            registries:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sallowedregistries
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          image := container.image
          not startswith(image, input.parameters.registries[_])
          msg := sprintf("Container '%v' image '%v' is not from an allowed registry", [container.name, image])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          image := container.image
          not startswith(image, input.parameters.registries[_])
          msg := sprintf("Init container '%v' image '%v' is not from an allowed registry", [container.name, image])
        }
```

**3. Limit Resource Ranges**

```yaml
# resource-limits-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sresourcelimits
spec:
  crd:
    spec:
      names:
        kind: K8sResourceLimits
      validation:
        openAPIV3Schema:
          type: object
          properties:
            maxCpu:
              type: string
            maxMemory:
              type: string
            minCpu:
              type: string
            minMemory:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sresourcelimits
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container '%v' must have CPU limits", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container '%v' must have memory limits", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.cpu
          msg := sprintf("Container '%v' must have CPU requests", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.memory
          msg := sprintf("Container '%v' must have memory requests", [container.name])
        }
```

**4. Block Privilege Escalation**

```yaml
# no-privilege-escalation-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8snoprivilegeescalation
spec:
  crd:
    spec:
      names:
        kind: K8sNoPrivilegeEscalation
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8snoprivilegeescalation
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.allowPrivilegeEscalation == false
          msg := sprintf("Container '%v' must set allowPrivilegeEscalation=false", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot == true
          msg := sprintf("Container '%v' must run as non-root", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.capabilities.add[_] != "NET_BIND_SERVICE"
          msg := sprintf("Container '%v' cannot add capabilities", [container.name])
        }
```

### Audit Mode

Before enforcing policies, run them in audit mode to see what would be rejected:

```yaml
# Audit mode constraint
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label-audit
spec:
  enforcementAction: dryrun  # or warn
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
  parameters:
    labels:
    - team
```

Check audit results:

```bash
# Check constraint violations
kubectl get constraints -o custom-columns=\
  NAME:.metadata.name,\
  KIND:.spec.kind,\
  ENFORCEMENT:.spec.enforcementAction,\
  VIOLATIONS:.status.totalViolations

# Get detailed violations
kubectl describe k8srequiredlabels require-team-label
```

## Falco

Falco is a runtime security tool that detects anomalous behavior in containers and hosts. It uses system calls to monitor for suspicious activity.

### How Falco Works

1. Falco hooks into the Linux kernel using eBPF or kernel modules.
2. It monitors system calls made by containers and the host.
3. It compares system call patterns against a set of rules.
4. When a rule matches, Falco generates an alert.

### Installation

```bash
# Install Falco with Helm
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco-system \
  --create-namespace \
  --set driver.kind=ebpf \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl="https://hooks.slack.com/services/xxx"
```

### Falco Rules

Falco comes with built-in rules. You can also create custom rules:

```yaml
# custom-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-custom-rules
  namespace: falco-system
data:
  custom-rules.yaml: |
    - rule: Container Drift Detected
      desc: Detect when a container starts a new process not in the original image
      condition: >
        spawned_process and container and
        not proc.name in (falco.enabled_containers) and
        container.id != host_container_id
      output: >
        Container drift detected 
        (user=%user.name container_id=%container.id container_name=%container.name 
         parent_process=%proc.pname process=%proc.name cmdline=%proc.cmdline)
      priority: WARNING
      tags: [container, drift, mitre_execution]
    
    - rule: Sensitive File Read
      desc: Detect reading sensitive files in containers
      condition: >
        open_read and container and
        (fd.name startswith /etc/shadow or
         fd.name startswith /etc/passwd or
         fd.name startswith /proc/self/environ or
         fd.name contains /etc/kubernetes/pki)
      output: >
        Sensitive file read in container
        (user=%user.name file=%fd.name container_id=%container.id 
         container_name=%container.name parent=%proc.pname process=%proc.name)
      priority: CRITICAL
      tags: [container, filesystem, mitre_credential_access]
    
    - rule: Outbound Connection to C2 Server
      desc: Detect outbound connections to known C2 server IPs
      condition: >
        outbound and container and
        (fd.typechar4 = 4 or fd.typechar4 = 6) and
        not container.image.repository in (falco.trusted_images)
      output: >
        Outbound connection to untrusted destination
        (user=%user.name command=%proc.cmdline connection=%fd.name 
         container_id=%container.id container_name=%container.name)
      priority: CRITICAL
      tags: [container, network, mitre_command_and_control]
    
    - rule: K8s Secret Access
      desc: Detect unauthorized access to Kubernetes secrets
      condition: >
        open_read and container and
        fd.name startswith /var/run/secrets/kubernetes.io
      output: >
        Kubernetes secret accessed
        (user=%user.name file=%fd.name container_id=%container.id 
         container_name=%container.name process=%proc.name)
      priority: WARNING
      tags: [container, kubernetes, mitre_credential_access]
```

### Falco Integration

```yaml
# falcosidekick-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falcosidekick-config
  namespace: falco-system
data:
  config.yaml: |
    slack:
      webhookurl: "https://hooks.slack.com/services/xxx"
      channel: "#security-alerts"
      username: "Falco"
      icon: "https://Falco.org/images/favicon/logo-falco-circle.png"
    
    pagerduty:
      routingKey: "your-routing-key"
    
    elasticsearch:
      hostport: "http://elasticsearch.logging.svc.cluster.local:9200"
      index: "falco-alerts"
    
    grafana:
      hostport: "http://grafana.monitoring.svc.cluster.local:3000"
      apikey: "your-api-key"
      dashboardid: 1
```

### Falco Event Types

- **Container drift**: New process spawned that wasn't in the original image.
- **File access**: Sensitive files read or written.
- **Network connections**: Outbound connections to unexpected destinations.
- **System calls**: Dangerous system calls (mount, ptrace, etc.).
- **Kubernetes API**: Unauthorized access to the API server.

## Network Policy Enforcement

### Advanced Network Policy Patterns

**1. Restrict Egress to Specific IP Ranges**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: payment-service
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/8
    ports:
    - protocol: TCP
      port: 443
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

**2. Allow Ingress Only from Specific Namespaces**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: frontend
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - protocol: TCP
      port: 8080
```

**3. Deny All Cross-Namespace Traffic**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-namespace
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - podSelector: {}  # Same namespace only
    ports:
    - protocol: TCP
      port: 8080
  - to:  # DNS
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

**4. Time-Based Network Policies (with Cilium)**

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: time-based-access
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: admin-panel
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: vpn-gateway
    toPorts:
    - ports:
      - port: "443"
        protocol: TCP
  # Cilium supports L7 and time-based policies
```

## Supply Chain Security

### Software Bill of Materials (SBOM)

Generate an SBOM for every container image:

```bash
# Generate SBOM with Syft
syft nginx:1.25 -o spdx-json > sbom.json

# Generate SBOM with Trivy
trivy image --format spdx-json nginx:1.25 > sbom.json

# Scan SBOM for vulnerabilities
grype sbom:sbom.json
```

### Image Provenance

Track the build provenance of every image:

```yaml
# SLSA Provenance
apiVersion: provenance.dev/v0.2
kind: Provenance
metadata:
  name: my-app-v1.0.0
  namespace: security
spec:
  buildType: https://example.com/build/v1
  builder:
    id: https://github.com/my-org/my-app/.github/workflows/build.yml@main
  invocation:
    configSource:
      uri: https://github.com/my-org/my-app
      digest:
        sha1: abc123...
  materials:
  - uri: https://github.com/my-org/my-app
    digest:
      sha1: abc123...
  metadata:
    buildStartedOn: 2024-01-15T10:00:00Z
    buildFinishedOn: 2024-01-15T10:05:00Z
    completeness:
      materials: true
      environment: false
      parameters: true
    reproducible: false
```

### Supply Chain Verification

```yaml
# verify-supply-chain.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8ssupplychainverified
spec:
  crd:
    spec:
      names:
        kind: K8sSupplyChainVerified
      validation:
        openAPIV3Schema:
          type: object
          properties:
            requiredAnnotations:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8ssupplychainverified
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not has_annotation(input.review.object.metadata.annotations, "supply-chain/verified")
          msg := sprintf("Container '%v' image must have supply chain verification annotation", [container.name])
        }
        
        has_annotation(annotations, key) {
          annotations[key]
        }
```

## Real Scenario: Implementing Defense in Depth

Let's build a complete defense-in-depth security system for a production cluster.

### Layer 1: Admission Control (OPA/Gatekeeper)

```yaml
# Layer 1: Admission policies
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sdefensedepth
spec:
  crd:
    spec:
      names:
        kind: K8sDefenseDepth
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sdefensedepth
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot == true
          msg := sprintf("Container '%v' must run as non-root", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.readOnlyRootFilesystem == true
          msg := sprintf("Container '%v' must use read-only root filesystem", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          count(container.securityContext.capabilities.drop) == 0
          msg := sprintf("Container '%v' must drop capabilities", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits
          msg := sprintf("Container '%v' must have resource limits", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sDefenseDepth
metadata:
  name: defense-depth-production
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaces:
    - production
```

### Layer 2: Pod Security Standards

```bash
# Enforce restricted policy
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/audit-version=latest
```

### Layer 3: Network Policies

```yaml
# Layer 3: Network segmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-specific-traffic
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

### Layer 4: Runtime Security (Falco)

```yaml
# Layer 4: Runtime monitoring
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-custom-rules
  namespace: falco-system
data:
  defense-in-depth.yaml: |
    - rule: Container Not Running as Non-Root
      desc: Detect containers running as root
      condition: >
        spawned_process and container and
        user.uid = 0 and
        not container.image.repository in (system_images)
      output: >
        Container running as root
        (user=%user.name container=%container.name process=%proc.name)
      priority: WARNING
      tags: [container, mitre_privilege_escalation]
    
    - rule: Unexpected Network Connection
      desc: Detect outbound connections not expected
      condition: >
        outbound and container and
        not fd.name in (expected_destinations)
      output: >
        Unexpected outbound connection
        (container=%container.name destination=%fd.name process=%proc.name)
      priority: WARNING
      tags: [container, network, mitre_command_and_control]
    
    - rule: File Write in Container
      desc: Detect file writes in read-only containers
      condition: >
        open_write and container and
        container.image.readonly = true
      output: >
        File write in read-only container
        (file=%fd.name container=%container.name process=%proc.name)
      priority: CRITICAL
      tags: [container, filesystem, mitre_impact]
```

### Layer 5: Supply Chain Security

```yaml
# Layer 5: Image verification
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8ssupplychainverified
spec:
  crd:
    spec:
      names:
        kind: K8sSupplyChainVerified
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8ssupplychainverified
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not startswith(container.image, "registry.example.com/")
          msg := sprintf("Container '%v' must use images from trusted registry", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not contains(container.image, "@sha256:")
          msg := sprintf("Container '%v' must use image digest", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          endswith(container.image, ":latest")
          msg := sprintf("Container '%v' cannot use latest tag", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sSupplyChainVerified
metadata:
  name: supply-chain-production
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaces:
    - production
```

### Layer 6: RBAC

```yaml
# Layer 6: Least privilege access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: restricted-developer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: production
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: restricted-developer
  apiGroup: rbac.authorization.k8s.io
```

### Layer 7: Monitoring and Alerting

```yaml
# Layer 7: Security monitoring
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: security-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
  - name: security.rules
    rules:
    - alert: FalcoAlert
      expr: falco_events_total{priority="CRITICAL"} > 0
      for: 0m
      labels:
        severity: critical
      annotations:
        summary: "Falco detected critical security event"
    
    - alert: PodSecurityViolation
      expr: kube_pod_security_violations_total > 0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod security violations detected"
    
    - alert: UnauthorizedAPIAccess
      expr: sum(rate(apiserver_audit_event_total{verb="get",objectRefResource="secrets"}[5m])) > 10
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High rate of secret access attempts"
```

### Testing Defense in Depth

```bash
# Test Layer 1: Admission control
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-privileged
  namespace: production
spec:
  containers:
  - name: test
    image: nginx:latest
    securityContext:
      privileged: true
EOF
# Expected: Error - violates Gatekeeper constraint

# Test Layer 2: Pod Security Standards
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-root
  namespace: production
spec:
  containers:
  - name: test
    image: nginx:1.25
EOF
# Expected: Error - violates Pod Security Standards

# Test Layer 3: Network policies
kubectl exec -n production test-pod -- wget -q --timeout=3 http://database.data.svc.cluster.local:5432
# Expected: Connection refused - network policy blocks

# Test Layer 4: Runtime detection
kubectl exec -n production test-pod -- sh -c "cat /etc/shadow"
# Expected: Falco alert - sensitive file access

# Test Layer 5: Supply chain
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-unsigned
  namespace: production
spec:
  containers:
  - name: test
    image: docker.io/library/nginx:latest
EOF
# Expected: Error - violates supply chain constraint
```

## Assessment

### Lab 1 — OPA/Gatekeeper (30 minutes)

1. Install Gatekeeper and create 3 constraint templates.
2. Create constraints that enforce: required labels, allowed registries, and resource limits.
3. Test constraints with compliant and non-compliant resources.
4. Use audit mode to identify existing violations.
5. Fix all existing violations.

**Grading**: 10 points. 2 points per task. Full credit for correct templates, constraints, and working enforcement.

### Lab 2 — Falco Runtime Detection (45 minutes)

1. Install Falco with custom rules.
2. Create rules that detect: file writes in containers, sensitive file access, and unexpected network connections.
3. Trigger each rule and verify alerts are generated.
4. Configure Falco to send alerts to Slack.
5. Analyze Falco logs for security events.

**Grading**: 15 points. 3 points per task. Full credit for correct rule creation, working alerts, and accurate analysis.

### Lab 3 — Defense in Depth (45 minutes)

1. Implement all 7 layers of defense in depth.
2. Test each layer independently.
3. Test bypassing multiple layers (defense should hold).
4. Write a security architecture document.
5. Create a security runbook for incident response.

**Grading**: 15 points. 3 points per task. Full credit for comprehensive implementation, thorough testing, and complete documentation.

## Evidence

Submit the following as proof of completion:

1. Gatekeeper constraint templates and constraints
2. Falco custom rules and alert configurations
3. Network policy YAML files
4. Supply chain verification configurations
5. RBAC configurations
6. Security architecture document
7. Security runbook
