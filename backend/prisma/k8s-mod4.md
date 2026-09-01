# Module 4 — Network Policies

By default, every pod in a Kubernetes cluster can communicate with every other pod. No restrictions. A pod in the `frontend` namespace can reach a pod in the `database` namespace. A pod on node A can reach a pod on node B. This flat network model is convenient for development but dangerous in production. Network Policies fix this by defining rules that control traffic flow between pods, namespaces, and external endpoints.

This module covers ingress and egress rules, CNI plugins that enforce network policies, common patterns, and the practical implementation of microsegmentation.

## Why Network Policies Matter

Consider a typical microservices architecture: a web frontend talks to an API gateway, which talks to a user service, which talks to a database. In the default Kubernetes network model, the web frontend can also talk directly to the database. So can the API gateway. So can any other pod in the cluster.

An attacker who compromises the web frontend now has direct access to the database. They don't need to go through the API gateway. They don't need to exploit the user service. They can connect directly.

Network Policies let you define exactly which pods can communicate with which other pods. You can say: "the web frontend can only talk to the API gateway, and the API gateway can only talk to the user service and the database." Everything else is blocked.

Without a CNI plugin that supports network policies, these rules do nothing. The two most common CNI plugins that support network policies are Calico and Cilium. Flannel and Weave Net (basic mode) do not enforce network policies.

## How Network Policies Work

A NetworkPolicy targets pods using a `podSelector`. It defines rules for ingress (incoming traffic) and egress (outgoing traffic). When a NetworkPolicy exists for a namespace, only pods matching the selector are affected. Pods not targeted by any policy retain the default behavior (allow all).

When a pod is targeted by at least one NetworkPolicy:
- **Ingress**: Denied by default. Only traffic matching an ingress rule is allowed.
- **Egress**: Denied by default. Only traffic matching an egress rule is allowed.

This is a critical point. Network Policies are additive. If you create two policies that target the same pod, the union of their rules applies. Deny rules are not supported — you can only allow specific traffic.

### Ingress Rules

Ingress rules control incoming traffic to a pod:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-gateway
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend
    - namespaceSelector:
        matchLabels:
          environment: staging
    ports:
    - protocol: TCP
      port: 8080
```

Breaking this down:

- `podSelector`: Targets pods with label `app: api-gateway` in the `backend` namespace.
- `policyTypes: [Ingress]`: This policy applies to ingress traffic.
- `ingress.from`: Traffic is allowed from pods with label `app: web-frontend` OR from any pod in namespaces with label `environment: staging`.
- `ingress.ports`: Only TCP traffic on port 8080 is allowed.

The `from` field uses OR logic within a rule and AND logic between rules. Here's the difference:

```yaml
# OR logic: Allow from web-frontend OR from staging namespace
ingress:
- from:
  - podSelector:
      matchLabels:
        app: web-frontend
  - namespaceSelector:
      matchLabels:
        environment: staging

# AND logic: Allow from web-frontend AND only in staging namespace
ingress:
- from:
  - podSelector:
      matchLabels:
        app: web-frontend
    namespaceSelector:
      matchLabels:
        environment: staging
```

### Egress Rules

Egress rules control outgoing traffic from a pod:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-frontend-egress
  namespace: frontend
spec:
  podSelector:
    matchLabels:
      app: web-frontend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

This allows the web-frontend pod to:
1. Send traffic to the api-gateway pod on TCP port 8080.
2. Send DNS queries (UDP/TCP port 53) to any pod (including CoreDNS).

Without the DNS rule, the pod can't resolve service names. This is the most common mistake when writing egress policies.

### Combined Ingress and Egress

You can define both ingress and egress rules in a single NetworkPolicy:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-policy
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
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
    - protocol: TCP
      port: 53
```

The user-service can receive traffic from the api-gateway on port 8080, send traffic to the database on port 5432, and resolve DNS. Everything else is blocked.

## CNI Plugins and Network Policy Enforcement

### Calico

Calico is the most widely used CNI for network policy enforcement. It supports:
- Network policies (standard Kubernetes API)
- GlobalNetworkPolicies (cluster-wide policies)
- Network sets (IP address groups)
- BGP peering for direct routing
- VXLAN encapsulation for overlay networking

Calico installation:

```bash
# Install Calico operator
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/tigera-operator.yaml

# Install Calico with default settings
kubectl apply -f - <<EOF
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
    - name: default-ipv4-ippool
      blockSize: 26
      cidr: 10.244.0.0/16
      encapsulation: VXLANCrossSubnet
      natOutgoing: Enabled
      nodeSelector: all()
---
apiVersion: operator.tigera.io/v1
kind: APIServer
metadata:
  name: default
spec: {}
EOF
```

Check Calico status:

```bash
# Verify Calico pods
kubectl -n calico-system get pods

# Check Calico node status
kubectl -n calico-system exec -it $(kubectl -n calico-system get pods -l k8s-app=calico-node -o name | head -1) -- calico-node status

# List Calico network policies
kubectl get networkpolicies --all-namespaces
```

### Cilium

Cilium uses eBPF (extended Berkeley Packet Filter) for high-performance networking and security. It provides:
- Network policies (standard + extended)
- L7 policies (HTTP, gRPC, Kafka)
- Service mesh capabilities
- Observability (Hubble)
- Encryption (WireGuard, IPsec)

Cilium installation:

```bash
# Install Cilium CLI
curl -L --remote-name-all https://github.com/cilium/cilium-cli/releases/latest/download/cilium-linux-amd64.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-amd64.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-amd64.tar.gz /usr/local/bin
rm cilium-linux-amd64.tar.gz{,.sha256sum}

# Install Cilium
cilium install --version 1.15.0

# Check Cilium status
cilium status
```

Cilium's L7 policies allow filtering at the application layer:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: l7-policy
  namespace: backend
spec:
  endpointSelector:
    matchLabels:
      app: api-gateway
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: web-frontend
    toPorts:
    - ports:
      - port: "8080"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/v1/.*"
        - method: POST
          path: "/api/v1/users"
```

This allows only GET requests to `/api/v1/.*` and POST requests to `/api/v1/users` from the web-frontend. All other HTTP methods and paths are blocked.

### Weave Net

Weave Net provides encrypted overlay networking. Its network policy support is more limited than Calico or Cilium:

```bash
# Install Weave Net
kubectl apply -f "https://github.com/weaveworks/weave/releases/latest/download/kube-weave.yaml"
```

Weave Net supports standard Kubernetes NetworkPolicies but doesn't have the advanced features of Calico or Cilium.

### Choosing a CNI

| Feature | Calico | Cilium | Weave Net |
|---------|--------|--------|-----------|
| Network Policies | Yes | Yes | Yes |
| L7 Policies | No | Yes | No |
| BGP | Yes | No | No |
| Encryption | Yes (WireGuard, IPsec) | Yes (WireGuard, IPsec) | Yes (sleeve) |
| Observability | Yes (Enterprise) | Yes (Hubble) | Limited |
| Performance | Good | Excellent | Good |
| Complexity | Medium | High | Low |

For most production deployments, Calico is the safe choice. For teams that need L7 policies, service mesh, or advanced observability, Cilium is worth the added complexity.

## Network Policy Patterns

### Default Deny All

The foundation of network policy. Deny all ingress and egress for all pods in a namespace:

```yaml
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
```

Apply this first, then add allow rules. Without this, pods retain the default allow-all behavior.

### Allow DNS

Almost every pod needs DNS. Without this rule, pods can't resolve service names:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

The empty `to: []` means "to any destination." DNS is typically in the `kube-system` namespace, and you might want to restrict it to just CoreDNS pods, but the common pattern allows DNS to any destination.

### Allow Same Namespace

Allow pods within the same namespace to communicate:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
```

### Allow Specific Service

Allow traffic only to a specific service:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend
    ports:
    - protocol: TCP
      port: 8080
```

### Allow External Ingress

Allow traffic from the ingress controller:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
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
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
```

### Deny All Except Specific IPs

Allow egress to specific IP ranges (for external services):

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-services
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
        except:
        - 10.96.0.0/12  # Exclude cluster service CIDR
    ports:
    - protocol: TCP
      port: 443
  - to:  # DNS
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

### Cross-Namespace Communication

Allow pods from one namespace to talk to pods in another:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring-scrape
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - protocol: TCP
      port: 9090  # Prometheus metrics port
```

## Real Scenario: Implementing Microsegmentation

Let's build a complete microsegmentation setup for a three-tier application: web frontend, API backend, and database.

### Architecture

```
Internet → Ingress Controller → web-frontend → api-backend → database
                                   ↓
                              external-redis
```

### Step 1: Create Namespaces

```bash
kubectl create namespace frontend
kubectl create namespace backend
kubectl create namespace data
kubectl create namespace monitoring
```

### Step 2: Default Deny All

```yaml
# deny-all.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: frontend
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: backend
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: data
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### Step 3: Allow DNS Everywhere

```yaml
# allow-dns.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: frontend
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: backend
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: data
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

### Step 4: Frontend Policies

```yaml
# frontend-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-frontend
  namespace: frontend
spec:
  podSelector:
    matchLabels:
      app: web-frontend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: frontend
spec:
  podSelector:
    matchLabels:
      app: web-frontend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: api-backend
    ports:
    - protocol: TCP
      port: 8080
```

### Step 5: Backend Policies

```yaml
# backend-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: api-backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend
    ports:
    - protocol: TCP
      port: 8080
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-database
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: api-backend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres-database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis-cache
    ports:
    - protocol: TCP
      port: 6379
```

### Step 6: Database Policies

```yaml
# data-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-database
  namespace: data
spec:
  podSelector:
    matchLabels:
      app: postgres-database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-backend
    ports:
    - protocol: TCP
      port: 5432
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-redis
  namespace: data
spec:
  podSelector:
    matchLabels:
      app: redis-cache
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-backend
    ports:
    - protocol: TCP
      port: 6379
```

### Step 7: Monitoring Access

```yaml
# monitoring-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring-scrape
  namespace: frontend
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - protocol: TCP
      port: 9090
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring-scrape
  namespace: backend
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - protocol: TCP
      port: 9090
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring-scrape
  namespace: data
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
    ports:
    - protocol: TCP
      port: 9090
```

### Step 8: Deploy and Test

```bash
# Apply all policies
kubectl apply -f deny-all.yaml
kubectl apply -f allow-dns.yaml
kubectl apply -f frontend-policies.yaml
kubectl apply -f backend-policies.yaml
kubectl apply -f data-policies.yaml
kubectl apply -f monitoring-policies.yaml

# Deploy test pods
kubectl -n frontend run test-frontend --image=busybox:1.36 -- sleep 3600
kubectl -n backend run test-backend --image=busybox:1.36 -- sleep 3600
kubectl -n data run test-database --image=busybox:1.36 -- sleep 3600

# Test connectivity
kubectl -n frontend exec test-frontend -- wget -q --timeout=3 http://api-backend.backend.svc.cluster.local:8080
# Should succeed

kubectl -n frontend exec test-frontend -- wget -q --timeout=3 http://postgres-database.data.svc.cluster.local:5432
# Should fail (frontend can't reach database directly)

kubectl -n backend exec test-backend -- wget -q --timeout=3 http://postgres-database.data.svc.cluster.local:5432
# Should succeed

kubectl -n backend exec test-backend -- wget -q --timeout=3 http://web-frontend.frontend.svc.cluster.local:80
# Should fail (backend can't reach frontend)
```

## Troubleshooting Network Policies

### Pod Can't Reach Another Pod

```bash
# Check if NetworkPolicies exist
kubectl get networkpolicies -n <namespace>

# Describe the policy
kubectl describe networkpolicy <policy-name> -n <namespace>

# Check pod labels
kubectl get pods -n <namespace> --show-labels

# Test connectivity
kubectl exec <pod> -- wget -q --timeout=3 <target-service>:<port>

# Check CNI plugin logs
kubectl -n calico-system logs -l k8s-app=calico-node --tail=50
```

### CNI Plugin Issues

```bash
# Check CNI pods
kubectl -n kube-system get pods -l k8s-app=calico-node
kubectl -n calico-system get pods

# Check CNI configuration
cat /etc/cni/net.d/10-calico.conflist

# Check BGP peers (Calico)
kubectl -n calico-system exec -it $(kubectl -n calico-system get pods -l k8s-app=calico-node -o name | head -1) -- calico-node status
```

### DNS Resolution Failures

```bash
# Test DNS resolution
kubectl exec <pod> -- nslookup kubernetes.default

# Check CoreDNS
kubectl -n kube-system get pods -l k8s-app=kube-dns
kubectl -n kube-system logs -l k8s-app=kube-dns

# Check DNS configmap
kubectl -n kube-system get configmap coredns -o yaml
```

## Assessment

### Lab 1 — Network Policy Basics (30 minutes)

1. Create a namespace `lab-netpol` and apply a default deny-all policy.
2. Deploy two pods: `client` and `server` in the `lab-netpol` namespace.
3. Verify that the client cannot reach the server (default deny).
4. Create a NetworkPolicy that allows the client to reach the server on port 80.
5. Verify connectivity works after applying the policy.

**Grading**: 10 points. 2 points per task. Full credit for correct policies and accurate connectivity tests.

### Lab 2 — Multi-Namespace Policies (45 minutes)

1. Create three namespaces: `web`, `api`, `db`.
2. Deploy pods in each namespace.
3. Implement policies that allow: web → api, api → db, but NOT web → db.
4. Test all connectivity paths and document results.
5. Add DNS access to all namespaces.
6. Add monitoring access from a `monitoring` namespace.

**Grading**: 15 points. 3 points per task. Full credit for correct policies, working connectivity, and comprehensive testing.

### Lab 3 — Production Microsegmentation (45 minutes)

1. Design a microsegmentation plan for a 5-service application.
2. Write all NetworkPolicy manifests.
3. Apply the policies in the correct order (deny-all first, then allow rules).
4. Test every connectivity path.
5. Document the results and write a troubleshooting guide for common NetworkPolicy issues.

**Grading**: 15 points. 3 points per task. Full credit for comprehensive design, correct implementation, and thorough documentation.

## Evidence

Submit the following as proof of completion:

1. NetworkPolicy YAML files for all scenarios
2. Connectivity test results (successful and blocked connections)
3. CNI plugin status output
4. Microsegmentation design document
5. Troubleshooting guide
