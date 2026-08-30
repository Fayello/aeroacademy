# Module 3 — RBAC

## What You'll Actually Do

You'll build a complete RBAC system from scratch: create roles, bind them to users and service accounts, test permissions, and debug access denials. By the end, you'll understand exactly how Kubernetes decides who can do what.

## Core Concepts

### Authentication → Authorization

Authentication answers "who are you?" — Authorization answers "can you do this?"

Kubernetes supports multiple auth methods:
- X.509 client certificates
- Bearer tokens
- OpenID Connect
- Webhook tokens

Once authenticated, the API server checks RBAC (or ABAC) to authorize the request.

### RBAC Components

**Role**: A set of permissions within a namespace. Defines what actions (get, list, create, update, delete) are allowed on which resources (pods, services, secrets).

**ClusterRole**: Same as Role but cluster-wide. Also covers non-namespaced resources like nodes and persistent volumes.

**RoleBinding**: Attaches a Role to a user, group, or service account within a namespace.

**ClusterRoleBinding**: Attaches a ClusterRole cluster-wide.

### The RBAC Check Flow

```
API Request → Is there a ClusterRoleBinding for this user? → Check ClusterRole
             → Is there a RoleBinding in this namespace?    → Check Role
             → If both exist, permissions are merged
             → If neither exists, DENIED
```

### Verbs and Resources

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
- apiGroups: [""]           # "" = core API group
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["create", "update", "patch"]
```

Verbs: `get`, `list`, `watch`, `create`, `update`, `patch`, `delete`, `deletecollection`

Resources: `pods`, `services`, `deployments`, `secrets`, `configmaps`, `nodes`, `namespaces`, etc.

### Wildcard Permissions

Use `*` sparingly — it's powerful and dangerous:

```yaml
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]   # Full cluster admin — avoid this
```

### User vs Group vs ServiceAccount

```bash
# Check who you are
kubectl auth whoami

# Check what you can do
kubectl auth can-i create pods
kubectl auth can-i delete secrets --namespace kube-system

# Check permissions for a specific user
kubectl auth can-i get pods --as=developer --namespace=development

# Check all permissions for a user
kubectl auth can-i --list --as=developer --namespace=development
```

## Hands-On Lab

### Task 1: Create a Developer Role

```yaml
# developer-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

```bash
kubectl create namespace development
kubectl apply -f developer-role.yaml
```

### Task 2: Create a User and Bind the Role

```bash
# Generate a client certificate for the user
openssl genrsa -out developer.key 2048
openssl req -new -key developer.key -out developer.csr -subj "/CN=developer/O=development-team"
# Sign with cluster CA (you'll need the CA key and cert from /etc/kubernetes/pki/)
openssl x509 -req -in developer.csr -CA /etc/kubernetes/pki/ca.crt -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial -out developer.crt -days 365

# Configure kubectl context for this user
kubectl config set-credentials developer --client-certificate=developer.crt --client-key=developer.key
kubectl config set-context dev-context --cluster=kubernetes --user=developer --namespace=development
```

```yaml
# developer-rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: development
subjects:
- kind: User
  name: developer
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f developer-rolebinding.yaml
```

### Task 3: Test Permissions

```bash
# Switch to developer context
kubectl config use-context dev-context

# These should work
kubectl get pods -n development
kubectl create deployment nginx --image=nginx -n development
kubectl get svc -n development

# This should fail — developer can't access secrets
kubectl get secrets -n development

# This should fail — developer can't access other namespaces
kubectl get pods -n kube-system

# Check what the developer can do
kubectl auth can-i --list --namespace=development
```

### Task 4: Create a Read-Only Role for QA

```yaml
# qa-readonly-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: qa-readonly
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services", "configmaps", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: qa-readonly-binding
  namespace: development
subjects:
- kind: User
  name: qa-tester
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: qa-readonly
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f qa-readonly-role.yaml

# Test QA permissions
kubectl auth can-i get pods --as=qa-tester --namespace=development
kubectl auth can-i create pods --as=qa-tester --namespace=development
kubectl auth can-i delete pods --as=qa-tester --namespace=development
```

### Task 5: Debug RBAC Denials

```bash
# When a user gets denied, check
kubectl auth can-i <verb> <resource> --as=<user> --namespace=<ns>

# Look at all role bindings in a namespace
kubectl get rolebindings -n development -o yaml

# Check if a service account has permissions
kubectl auth can-i list pods --as=system:serviceaccount:development:app-sa

# Audit logs show RBAC decisions
kubectl get events --field-selector reason=Forbidden
```

## Assessment

**Lab Task**: Build a complete RBAC system with three users: a namespace admin, a developer, and a read-only auditor. Each should have exactly the permissions they need — no more, no less. Test and document every permission check.

**Time**: 50 minutes

**Grading** (100 points):
- Namespace admin can manage all resources in their namespace (25 pts)
- Developer can deploy and manage pods but not delete namespace (25 pts)
- Auditor can only read, all write operations denied (25 pts)
- All permission tests documented with `can-i` output (15 pts)
- No excessive permissions (wildcards or cluster-admin misuse) (10 pts)

## Evidence

Save the following to your evidence folder:
1. `role-definitions.yaml` — all Role and ClusterRole YAML files
2. `rolebindings.yaml` — all RoleBinding and ClusterRoleBinding YAML files
3. `admin-permissions.txt` — `kubectl auth can-i --list` output for admin
4. `developer-permissions.txt` — `kubectl auth can-i --list` output for developer
5. `auditor-permissions.txt` — `kubectl auth can-i --list` output for auditor
6. `denial-examples.txt` — evidence of denied operations
