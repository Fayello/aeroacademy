# Module 4 — Network Policies

## What You'll Actually Do

You'll create network policies that control pod-to-pod traffic, restrict ingress and egress, and implement microsegmentation. You'll work with Cilium for advanced network policy enforcement and debugging.

## Core Concepts

### What Network Policies Do

By default, Kubernetes allows all pods to communicate with all other pods. Network policies restrict this. They're like firewall rules for your cluster.

Key behaviors:
- **No policies = all traffic allowed** (default)
- **Any policy exists = traffic denied by default** for pods it selects
- Policies are additive — multiple policies selecting the same pod combine their allow rules
- Policies are namespace-scoped

### Ingress vs Egress

- **Ingress**: Controls who can send traffic TO your pod
- **Egress**: Controls where your pod can send traffic

You need a CNI that supports network policies (Calico, Cilium, Weave Net). Flannel doesn't support them.

### Policy Types

```yaml
# Deny all ingress to a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}        # Selects all pods in namespace
  policyTypes:
  - Ingress

# Allow only specific pods to reach the database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5432
```

### Egress Control

```yaml
# Allow DNS and specific external services only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  # Allow specific external service
  - to:
    - ipBlock:
        cidr: 10.0.0.0/8
    ports:
    - protocol: TCP
      port: 443
```

### Cilium — Advanced Network Policy

Cilium extends network policies with:
- **L7 policies**: Filter by HTTP method, path, headers
- **DNS-based policies**: Allow traffic to specific domains
- **Identity-based policies**: Use pod identity instead of IPs
- **Visibility**: Hubble UI for traffic visualization

```yaml
# Cilium L7 HTTP policy
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: l7-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: backend
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: frontend
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/v1/.*"
        - method: POST
          path: "/api/v1/orders"
```

## Hands-On Lab

### Task 1: Install a CNI That Supports Network Policies

```bash
# If using Calico
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml

# If using Cilium
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --namespace kube-system

# Verify CNI is running
kubectl get pods -n kube-system -l k8s-app=calico-node
# or
kubectl get pods -n kube-system -l k8s-app=cilium
```

### Task 2: Create a Namespace with Default Deny

```bash
kubectl create namespace netpol-demo
```

```yaml
# default-deny.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: netpol-demo
spec:
  podSelector: {}
  policyTypes:
  - Ingress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: netpol-demo
spec:
  podSelector: {}
  policyTypes:
  - Egress
```

```bash
kubectl apply -f default-deny.yaml
```

### Task 3: Deploy Test Applications

```yaml
# apps.yaml
apiVersion: v1
kind: Pod
metadata:
  name: frontend
  namespace: netpol-demo
  labels:
    app: frontend
spec:
  containers:
  - name: frontend
    image: nginx:1.25

---
apiVersion: v1
kind: Pod
metadata:
  name: backend
  namespace: netpol-demo
  labels:
    app: backend
spec:
  containers:
  - name: backend
    image: nginx:1.25

---
apiVersion: v1
kind: Pod
metadata:
  name: database
  namespace: netpol-demo
  labels:
    app: database
spec:
  containers:
  - name: database
    image: nginx:1.25
```

```bash
kubectl apply -f apps.yaml

# Verify pods are running
kubectl get pods -n netpol-demo

# Test connectivity — should all fail with default deny
kubectl exec -n netpol-demo frontend -- curl -s --connect-timeout 3 backend
kubectl exec -n netpol-demo frontend -- curl -s --connect-timeout 3 database
```

### Task 4: Create Selective Allow Policies

```yaml
# allow-frontend-to-backend.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: netpol-demo
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80

---
# allow-frontend-to-database.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-database
  namespace: netpol-demo
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
```

```bash
kubectl apply -f allow-frontend-to-backend.yaml
kubectl apply -f allow-frontend-to-database.yaml

# Test — frontend should reach backend and database
kubectl exec -n netpol-demo frontend -- curl -s --connect-timeout 3 backend
kubectl exec -n netpol-demo frontend -- curl -s --connect-timeout 3 database

# Test — backend should NOT reach database (no policy allows it)
kubectl exec -n netpol-demo backend -- curl -s --connect-timeout 3 database
```

### Task 5: Debug with Cilium Hubble

```bash
# Install Hubble CLI
curl -fsSL https://get.hubble.sh | bash

# Port-forward Hubble UI
kubectl port-forward -n kube-system svc/hubble-ui 12000:80

# Check flow logs
hubble observe --namespace netpol-demo
hubble observe --namespace netpol-demo --to-pod netpol-demo/database
```

## Assessment

**Lab Task**: Implement network policies for a 3-tier application (frontend → API → database). Default deny all traffic, then create specific allow rules. Verify connectivity at each layer. Document all tests.

**Time**: 50 minutes

**Grading** (100 points):
- Default deny policies created and working (20 pts)
- Frontend can reach API but not database directly (25 pts)
- API can reach database (25 pts)
- External traffic blocked to all pods (15 pts)
- Debugging evidence using Hubble or equivalent (15 pts)

## Evidence

Save the following to your evidence folder:
1. `network-policies.yaml` — all NetworkPolicy resources
2. `connectivity-tests.txt` — curl results for each pod-to-pod test
3. `hubble-output.txt` — Hubble flow logs showing allowed/denied traffic
4. `policy-diagram.png` — a diagram showing the traffic flow rules
