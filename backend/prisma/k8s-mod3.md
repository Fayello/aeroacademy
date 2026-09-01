# Module 3: RBAC

Role-Based Access Control is the mechanism that determines who can do what in your Kubernetes cluster. Without RBAC, anyone with API access can read secrets, delete deployments, and create new users. With RBAC, you can restrict a service account to only reading ConfigMaps in a single namespace while a human admin can manage RBAC itself. This module covers the complete RBAC system: Roles, ClusterRoles, RoleBindings, ClusterRoleBindings, service account tokens, and the practical implementation of least privilege.

## How RBAC Works

Kubernetes RBAC is an authorization mode. When a request reaches the API server, it goes through authentication (who are you?) and then authorization (are you allowed to do this?). RBAC is one of several authorization modes. Others include AlwaysAllow, AlwaysDeny, and Node. Most clusters use RBAC exclusively.

The flow:

1. A request arrives at the API server with credentials (certificate, token, or OIDC).
2. The API server authenticates the request and identifies the user (or service account).
3. The API server evaluates authorization rules in this order:
   - Node authorizer (for kubelet requests)
   - RBAC authorizer
   - Webhook authorizer (if configured)
4. The first authorizer that returns Allow or Deny determines the result.
5. If no authorizer returns a decision, the request is denied.

RBAC checks three things:
- **Who**: The subject (user, group, or service account).
- **What**: The resource (pods, services, secrets, etc.).
- **How**: The verb (get, list, watch, create, update, patch, delete).

If a binding exists that matches the subject and grants the requested verb on the resource, the request is allowed. Otherwise, it's denied.

## Roles and ClusterRoles

### Roles

A Role defines permissions within a single namespace. It specifies which API groups, resources, and verbs are allowed:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-manager
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
```

Breaking this down:

- `apiGroups`: Which API group the resource belongs to. Core resources (pods, services, configmaps) are in the `""` group. Apps resources (deployments, statefulsets, daemonsets) are in the `"apps"` group.
- `resources`: The specific resource type.
- `verbs`: The actions allowed. `get` retrieves a single object. `list` retrieves multiple objects. `watch` sets up a watch connection. `create`, `update`, `patch`, `delete` modify objects.

A Role is always scoped to one namespace. The namespace is specified in `metadata.namespace`.

### ClusterRoles

A ClusterRole defines permissions at the cluster level. It can do everything a Role does (but applies across all namespaces) plus it can define permissions for cluster-scoped resources:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["storage.k8s.io"]
  resources: ["storageclasses"]
  verbs: ["get", "list", "watch"]
```

ClusterRoles are not namespace-scoped. They can be bound to subjects in any namespace.

Key difference: A ClusterRole that defines permissions for namespace-scoped resources (like pods) grants those permissions across all namespaces when bound via a ClusterRoleBinding. When bound via a RoleBinding, it's scoped to that namespace.

### Aggregated ClusterRoles

ClusterRoles can be aggregated: you can combine multiple ClusterRoles into one. This is useful for building incremental permission sets:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-endpoints
  labels:
    rbac.authorization.k8s.io/aggregate-to-monitoring: "true"
rules:
- apiGroups: [""]
  resources: ["services", "endpoints", "pods"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.authorization.k8s.io/aggregate-to-monitoring: "true"
rules: []
```

The `prometheus` ClusterRole automatically includes all ClusterRoles with the label `rbac.authorization.k8s.io/aggregate-to-monitoring: "true"`. This is how the Kubernetes dashboard and other tools build their permission sets.

### Special ClusterRoles

Kubernetes provides built-in ClusterRoles that you can bind to subjects:

- `cluster-admin`: Full access to everything. The superuser role.
- `admin`: Full access within a namespace (including RBAC).
- `edit`: Read/write access to most resources in a namespace (no RBAC).
- `view`: Read-only access to most resources in a namespace (no secrets).

```bash
# View built-in ClusterRoles
kubectl get clusterroles | grep -E "admin|edit|view|cluster-admin"

# View what a ClusterRole grants
kubectl describe clusterrole admin
```

Use these built-in roles when they match your needs. Only create custom Roles when you need specific permissions.

## RoleBindings and ClusterRoleBindings

Roles and ClusterRoles define permissions. Bindings connect them to subjects (users, groups, or service accounts).

### RoleBinding

A RoleBinding grants a Role (or ClusterRole) to subjects within a specific namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: User
  name: jane@example.com
  apiGroup: rbac.authorization.k8s.io
- kind: Group
  name: dev-team
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: my-app-sa
  namespace: production
roleRef:
  kind: Role
  name: pod-manager
  apiGroup: rbac.authorization.k8s.io
```

This grants the `pod-manager` Role to the User `jane@example.com`, the Group `dev-team`, and the ServiceAccount `my-app-sa`: all within the `production` namespace.

### ClusterRoleBinding

A ClusterRoleBinding grants a ClusterRole to subjects across the entire cluster:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-nodes
subjects:
- kind: User
  name: admin@example.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

This grants the `node-reader` ClusterRole to `admin@example.com` across all namespaces.

### Binding a ClusterRole to a Namespace

You can use a RoleBinding to bind a ClusterRole to subjects within a single namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: view-in-production
  namespace: production
subjects:
- kind: Group
  name: qa-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

This grants the `view` ClusterRole to the `qa-team` group: but only in the `production` namespace. This is a common pattern: define permissions once in a ClusterRole, bind them per-namespace with RoleBindings.

## Service Account Tokens

Service accounts are used by pods to authenticate to the Kubernetes API. Every pod has a service account (defaulting to the `default` service account if none is specified).

### Token Mounting

When a pod uses a service account, Kubernetes mounts a token into the pod at `/var/run/secrets/kubernetes.io/serviceaccount/token`. This token is a JWT that authenticates to the API server as the service account.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-consumer
  namespace: production
spec:
  serviceAccountName: api-consumer-sa
  containers:
  - name: app
    image: my-app:latest
```

The `api-consumer-sa` service account's token is mounted at `/var/run/secrets/kubernetes.io/serviceaccount/token`. The pod can use this token to call the API server.

### Automounting Tokens

By default, Kubernetes mounts the service account token into every pod. This is often unnecessary and a security risk. Disable it:

```yaml
# Disable for a specific pod
apiVersion: v1
kind: Pod
metadata:
  name: no-token-pod
spec:
  automountServiceAccountToken: false
  containers:
  - name: app
    image: my-app:latest
```

```yaml
# Disable for a service account (all pods using it)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: no-token-sa
  namespace: production
automountServiceAccountToken: false
```

### Projected Service Account Tokens

Since Kubernetes 1.21, you can mount a projected service account token with a specific audience and expiration:

```yaml
spec:
  containers:
  - name: app
    volumeMounts:
    - name: sa-token
      mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      readOnly: true
  volumes:
  - name: sa-token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3600
          audience: "https://kubernetes.default.svc"
```

The `audience` field scopes the token to a specific audience. The token is only valid for that audience. The `expirationSeconds` field sets the token lifetime. After expiration, the token is invalid and must be refreshed.

This is the recommended approach for production workloads. Short-lived, audience-scoped tokens limit the blast radius of token compromise.

### External Identity Providers

In production, you often integrate Kubernetes with an external identity provider (OIDC, LDAP, SAML). This lets you use your existing identity system for Kubernetes access:

```yaml
# API server OIDC configuration
- --oidc-issuer-url=https://accounts.google.com
- --oidc-client-id=kubernetes
- --oidc-username-claim=email
- --oidc-groups-claim=groups
```

With OIDC, you can bind ClusterRoles to OIDC users and groups:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-binding
subjects:
- kind: User
  name: admin@example.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

## Least Privilege in Practice

The principle of least privilege means granting only the permissions needed for a specific task. Here's how to implement it in real-world scenarios.

### Step 1: Audit Current Permissions

```bash
# List all ClusterRoleBindings
kubectl get clusterrolebindings -o custom-columns=\
  NAME:.metadata.name,\
  ROLE:.roleRef.name,\
  SUBJECTS:.subjects[*].name

# List all RoleBindings in a namespace
kubectl get rolebindings -n production -o custom-columns=\
  NAME:.metadata.name,\
  ROLE:.roleRef.name,\
  SUBJECTS:.subjects[*].name

# Check what permissions a user has
kubectl auth can-i --list --as=jane@example.com

# Check if a user can perform a specific action
kubectl auth can-i create pods --as=jane@example.com -n production
kubectl auth can-i delete secrets --as=system:serviceaccount:production:my-app-sa
```

### Step 2: Identify Over-Privileged Subjects

```bash
# Find all subjects bound to cluster-admin
kubectl get clusterrolebindings -o json | jq -r '
  .items[] | 
  select(.roleRef.name == "cluster-admin") | 
  .subjects[]? | 
  "\(.kind)/\(.name)"'

# Find all ClusterRoles with wildcard permissions
kubectl get clusterroles -o json | jq -r '
  .items[] | 
  select(.rules[]? | 
    (.apiGroups[]? == "*" or .resources[]? == "*" or .verbs[]? == "*")) |
  .metadata.name'
```

### Step 3: Create Granular Roles

Instead of binding `cluster-admin`, create specific Roles:

```yaml
# Bad: Full cluster access for a CI/CD pipeline
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cicd-admin
subjects:
- kind: ServiceAccount
  name: cicd-sa
  namespace: ci-cd
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

```yaml
# Good: Scoped access for a CI/CD pipeline
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cicd-deployer
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

### Step 4: Test Permissions

```bash
# As the CI/CD service account, test permissions
kubectl auth can-i create deployments -n production \
  --as=system:serviceaccount:ci-cd:cicd-sa

kubectl auth can-i delete secrets -n production \
  --as=system:serviceaccount:ci-cd:cicd-sa

kubectl auth can-i create clusterroles \
  --as=system:serviceaccount:ci-cd:cicd-sa
```

### Step 5: Monitor and Audit

```bash
# Enable RBAC audit logging
# In /etc/kubernetes/audit-config.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  resources:
  - group: "rbac.authorization.k8s.io"
    resources: ["clusterroles", "rolebindings", "clusterrolebindings"]
    verbs: ["create", "update", "delete"]

# Check audit logs for RBAC changes
grep "rbac.authorization.k8s.io" /var/log/kubernetes/audit/audit.log | \
  jq 'select(.verb == "create" or .verb == "update" or .verb == "delete")'
```

## Real Scenario: Implementing RBAC for a CI/CD System

Let's build a complete RBAC setup for a CI/CD system (like Jenkins, GitHub Actions, or GitLab CI) that deploys to Kubernetes.

### Architecture

- CI/CD namespace: `ci-cd`
- Target namespaces: `staging`, `production`
- Service accounts: `cicd-staging`, `cicd-production`
- Teams: `dev-team` (read staging, write staging), `ops-team` (read/write production)

### Step 1: Create Service Accounts

```yaml
# cicd-service-accounts.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-staging
  namespace: ci-cd
  labels:
    component: cicd
automountServiceAccountToken: true
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-production
  namespace: ci-cd
  labels:
    component: cicd
automountServiceAccountToken: true
```

### Step 2: Create Roles

```yaml
# cicd-roles.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cicd-staging-deployer
  namespace: staging
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cicd-production-deployer
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
```

Note: The production role doesn't include `delete`. This prevents accidental deletion of production resources.

### Step 3: Create RoleBindings

```yaml
# cicd-rolebindings.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cicd-staging
  namespace: staging
subjects:
- kind: ServiceAccount
  name: cicd-staging
  namespace: ci-cd
roleRef:
  kind: Role
  name: cicd-staging-deployer
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cicd-production
  namespace: production
subjects:
- kind: ServiceAccount
  name: cicd-production
  namespace: ci-cd
roleRef:
  kind: Role
  name: cicd-production-deployer
  apiGroup: rbac.authorization.k8s.io
```

### Step 4: Create Team RBAC

```yaml
# team-roles.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: dev-viewer
  namespace: staging
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
kind: Role
metadata:
  name: ops-manager
  namespace: production
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-viewer-binding
  namespace: staging
subjects:
- kind: Group
  name: dev-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: dev-viewer
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ops-manager-binding
  namespace: production
subjects:
- kind: Group
  name: ops-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: ops-manager
  apiGroup: rbac.authorization.k8s.io
```

### Step 5: Deploy and Test

```bash
# Apply all RBAC configurations
kubectl apply -f cicd-service-accounts.yaml
kubectl apply -f cicd-roles.yaml
kubectl apply -f cicd-rolebindings.yaml
kubectl apply -f team-roles.yaml

# Test CI/CD service account in staging
kubectl auth can-i create deployments -n staging \
  --as=system:serviceaccount:ci-cd:cicd-staging
# yes

kubectl auth can-i delete secrets -n staging \
  --as=system:serviceaccount:ci-cd:cicd-staging
# no

# Test CI/CD service account in production
kubectl auth can-i create deployments -n production \
  --as=system:serviceaccount:ci-cd:cicd-production
# yes

kubectl auth can-i delete deployments -n production \
  --as=system:serviceaccount:ci-cd:cicd-production
# no (production role doesn't include delete)

# Test dev team access
kubectl auth can-i list pods -n staging \
  --as=jane@example.com --group=dev-team
# yes

kubectl auth can-i create deployments -n staging \
  --as=jane@example.com --group=dev-team
# no (dev-viewer role is read-only)
```

### Step 6: Generate Kubeconfig for CI/CD

```bash
# Get the service account token
TOKEN=$(kubectl -n ci-cd create token cicd-production \
  --duration=8760h)

# Create kubeconfig
cat <<EOF > cicd-kubeconfig.yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority: /etc/kubernetes/pki/ca.crt
    server: https://k8s.example.com:6443
  name: production-cluster
contexts:
- context:
    cluster: production-cluster
    user: cicd-production
  name: cicd-context
current-context: cicd-context
users:
- name: cicd-production
  user:
    token: ${TOKEN}
EOF
```

## Common Pitfalls

### 1. Wildcard Permissions

```yaml
# Bad: Wildcard on all resources
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

This is equivalent to cluster-admin. Never use wildcards unless absolutely necessary.

### 2. Forgetting Namespace Scope

A RoleBinding in namespace A can't grant access to namespace B. If you need cross-namespace access, use ClusterRoleBindings.

### 3. Not Auditing Regularly

RBAC permissions accumulate over time. Old service accounts, test roles, and temporary bindings pile up. Schedule monthly audits:

```bash
# Find unused ClusterRoles
kubectl get clusterroles -o json | jq -r '
  .items[] | 
  select(.metadata.name | startswith("system:") | not) |
  select(.metadata.name | startswith("cluster-admin") | not) |
  .metadata.name' | while read role; do
    bindings=$(kubectl get clusterrolebindings -o json | \
      jq -r ".items[] | select(.roleRef.name == \"$role\") | .metadata.name")
    if [ -z "$bindings" ]; then
      echo "UNUSED ClusterRole: $role"
    fi
  done
```

### 4. Service Account Token Leakage

Service account tokens are JWTs. They don't expire by default. Rotate them regularly and use projected tokens with short expiration:

```bash
# Delete a service account token (forces regeneration)
kubectl -n production delete secret $(kubectl -n production get secret | \
  grep my-app-sa-token | awk '{print $1}')
```

## Assessment

### Lab 1: RBAC Basics (30 minutes)

1. Create a Role that allows reading pods and services in the `default` namespace.
2. Create a RoleBinding that grants this Role to a user `dev@example.com`.
3. Test permissions using `kubectl auth can-i`.
4. Create a ClusterRole that allows reading nodes and persistent volumes.
5. Create a ClusterRoleBinding that grants this ClusterRole to a user `ops@example.com`.

**Grading**: 10 points. 2 points per task. Full credit for correct manifests and accurate permission tests.

### Lab 2: CI/CD RBAC (45 minutes)

1. Create a CI/CD namespace with two service accounts: `cicd-staging` and `cicd-production`.
2. Create Roles that allow the CI/CD service accounts to manage deployments, services, and configmaps in their respective namespaces.
3. Prevent the production service account from deleting resources.
4. Create kubeconfig files for both service accounts.
5. Test the RBAC by running kubectl commands with each kubeconfig.

**Grading**: 15 points. 3 points per task. Full credit for correct RBAC setup, working kubeconfigs, and accurate tests.

### Lab 3: Least Privilege Audit (45 minutes)

1. Audit all ClusterRoleBindings in the cluster. Identify any subjects bound to `cluster-admin`.
2. For each `cluster-admin` binding, determine if a more restrictive role would suffice.
3. Create replacement Roles/ClusterRoles with minimal permissions.
4. Test the replacement roles to ensure they provide sufficient access.
5. Write a report documenting the findings and recommendations.

**Grading**: 15 points. 3 points per task. Full credit for thorough audit, correct replacement roles, and comprehensive report.

## Evidence

Submit the following as proof of completion:

1. RBAC YAML files (Roles, ClusterRoles, RoleBindings, ClusterRoleBindings)
2. Permission test outputs (`kubectl auth can-i` results)
3. Kubeconfig files for CI/CD service accounts
4. Audit report with cluster-admin bindings and recommendations
5. Screenshots of all steps
