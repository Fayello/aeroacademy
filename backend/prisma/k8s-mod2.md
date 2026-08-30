# Module 2 — Pod Security

## What You'll Actually Do

You'll lock down pods so they can't run as root, can't write to the filesystem, and can't escalate privileges. You'll configure Pod Security Standards (the replacement for the deprecated PodSecurityPolicy) and security contexts at both pod and container level.

## Core Concepts

### Why Pod Security Matters

A container running as root with host access is a cluster breach waiting to happen. The most common container escapes exploit exactly these misconfigurations. Pod security is your first line of defense.

### Pod Security Standards (PSS)

Kubernetes replaced PodSecurityPolicy with Pod Security Standards, enforced via the Pod Security Admission controller. Three levels:

- **Privileged**: Unrestricted. Used for system pods, logging agents, CNI plugins. Never for user workloads.
- **Baseline**: Prevents known privilege escalations. Blocks host networking, host PID, host IPC, privileged containers, and most volume types.
- **Restricted**: Hardened. Follows pod security best practices. Forces non-root, drops all capabilities, uses seccomp profiles.

### Security Contexts

Security contexts define privilege and access control settings at the pod or container level.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:1.25
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
        add:
          - NET_BIND_SERVICE
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: cache
      mountPath: /var/cache/nginx
    - name: run
      mountPath: /var/run
  volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir: {}
  - name: run
    emptyDir: {}
```

Key points:
- `runAsNonRoot: true` — container refuses to start as root
- `readOnlyRootFilesystem: true` — prevents writes except to mounted volumes
- `allowPrivilegeEscalation: false` — blocks setuid/setgid
- `capabilities.drop: ALL` — strips all Linux capabilities, then adds back only what's needed

### Enforcing PSS at Namespace Level

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

The three modes:
- **enforce**: Rejects pods that violate the standard
- **audit**: Logs violations but allows the pod
- **warn**: Shows warnings to the user but allows the pod

### Service Accounts

Don't let pods use the default service account with mounted tokens.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
automountServiceAccountToken: false

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      serviceAccountName: app-sa
      automountServiceAccountToken: false
      containers:
      - name: app
        image: myapp:1.0
```

## Hands-On Lab

### Task 1: Create a Restricted Namespace

```bash
# Create namespace with restricted PSS
kubectl create namespace secure-ns
kubectl label namespace secure-ns \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted

# Verify labels
kubectl get namespace secure-ns --show-labels
```

### Task 2: Deploy a Compliant Pod

```yaml
# secure-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: compliant-pod
  namespace: secure-ns
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: registry.k8s.io/pause:3.9
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
```

```bash
kubectl apply -f secure-pod.yaml
kubectl get pod compliant-pod -n secure-ns
```

### Task 3: Watch It Reject Bad Pods

```yaml
# bad-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: bad-pod
  namespace: secure-ns
spec:
  containers:
  - name: app
    image: nginx
    securityContext:
      privileged: true
```

```bash
kubectl apply -f bad-pod.yaml
# This should be rejected with a 403 error

# Check audit logs for the violation
kubectl get events -n secure-ns --field-selector reason=FailedCreate
```

### Task 4: Fix the Bad Pod

Modify the bad pod to comply with restricted standards:
- Add `runAsNonRoot: true`
- Set `allowPrivilegeEscalation: false`
- Drop all capabilities
- Add seccomp profile

```bash
kubectl apply -f fixed-pod.yaml
kubectl get pods -n secure-ns
```

### Task 5: Inspect Running Pod Security

```bash
# Check what security settings are actually applied
kubectl get pod compliant-pod -n secure-ns -o jsonpath='{.spec.securityContext}' | jq .

# Verify the pod is running as non-root
kubectl exec -n secure-ns compliant-pod -- id

# Check the container's seccomp profile
kubectl get pod compliant-pod -n secure-ns -o jsonpath='{.spec.containers[0].securityContext.seccompProfile}' | jq .
```

## Assessment

**Lab Task**: Create a namespace with restricted Pod Security Standards. Deploy 3 workloads: one compliant pod, one that gets rejected, and one fixed version of the rejected pod. Document the rejection and the fix.

**Time**: 45 minutes

**Grading** (100 points):
- Namespace with correct PSS labels (15 pts)
- Compliant pod running in restricted namespace (25 pts)
- Bad pod correctly rejected (20 pts)
- Fixed pod deployed successfully (25 pts)
- Evidence of security context inspection (15 pts)

## Evidence

Save the following to your evidence folder:
1. `namespace-labels.txt` — output of `kubectl get namespace secure-ns --show-labels`
2. `compliant-pod.yaml` — your compliant pod spec
3. `rejection-error.txt` — the error message when deploying the bad pod
4. `fixed-pod.yaml` — your fixed pod spec
5. `security-inspection.txt` — output of security context inspection commands
