# Module 2: Pod Security

Containers run as root by default. That's the default in Docker, containerd, and every OCI-compliant runtime. In a Kubernetes cluster, this means a compromised container has root access to the node: and depending on the runtime configuration, potentially to other containers on the same node. Pod security is about restricting what containers can do, what users they run as, and what resources they can access.

This module covers the evolution from PodSecurityPolicy (deprecated and removed) to Pod Security Standards, security contexts, service accounts, and the practical work of securing a multi-tenant cluster.

## The Problem: Why Pod Security Exists

Consider this scenario: a developer deploys a pod that runs as root, mounts the host filesystem at `/`, and opens a reverse shell. If you have no pod security controls, that pod is running on your node with full host access. The developer didn't mean to do this: they just copied a Dockerfile from Stack Overflow that runs everything as root.

Or consider this: a pod has access to the Kubernetes API with cluster-admin privileges. An attacker who compromises the pod can create new cluster-admin roles, read all secrets, and pivot to every namespace. This is exactly what happened in the 2018 Tesla cryptojacking incident.

Pod security prevents these scenarios by enforcing restrictions at the pod level. You can't stop developers from writing bad Dockerfiles, but you can prevent Kubernetes from running the resulting containers with dangerous configurations.

## PodSecurityPolicy (Deprecated)

Before Kubernetes 1.25, PodSecurityPolicy (PSP) was the native way to enforce pod security. PSP was a cluster-level resource that defined what pods could and couldn't do. You created a PSP, created a ClusterRole that referenced it, and bound it to users or service accounts.

Here's what a PSP looked like:

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
  - ALL
  volumes:
  - 'configMap'
  - 'emptyDir'
  - 'projected'
  - 'secret'
  - 'downwardAPI'
  - 'persistentVolumeClaim'
  hostNetwork: false
  hostPorts: []
  hostPID: false
  hostIPC: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

PSP had problems. The API was confusing. The interaction between PSP, RBAC, and admission was poorly documented. Debugging why a pod was rejected was a nightmare. And the deprecation timeline was aggressive: PSP was removed entirely in Kubernetes 1.25.

If you're on a Kubernetes version before 1.25, you might still encounter PSP. Don't invest in it. Plan your migration to Pod Security Standards.

## Pod Security Standards

Pod Security Standards (PSS) replaced PSP in Kubernetes 1.25. They define three security levels:

### Privileged

Unrestricted. No restrictions on pod security. This is the default for pods in the `kube-system` namespace and for any pod that doesn't have a pod security label. Use this only for system pods that need full access.

### Baseline

Prevents known privilege escalations while maintaining compatibility with common workloads. This is the minimum standard for all production workloads. Key restrictions:

- No privileged containers
- No host network, PID, or IPC
- No host path volumes (use PVCs instead)
- No capability additions beyond NET_BIND_SERVICE
- No running as root (you must specify a non-root user)
- No privilege escalation (no `allowPrivilegeEscalation: true`)
- No host ports
- No proc mount type
- No AppArmor or seccomp profiles can be unset

### Restricted

The strictest level. Follows current pod security best practices for hardened workloads. All baseline restrictions plus:

- Must drop ALL capabilities
- Must run as non-root (UID must be 65534 or higher)
- Must use a specific seccomp profile (RuntimeDefault or Localhost)
- Must use an explicit seccomp profile path if Localhost
- Volume types limited to configMap, csi, downwardAPI, emptyDir, ephemeral, persistentVolumeClaim, projected, secret
- Must set seccompProfile field

### Enforcing Standards

Standards are enforced through namespace labels:

```bash
# Enforce restricted policy on a namespace
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/audit-version=latest
```

Three modes:
- **Enforce**: Rejects non-compliant pods. Pod creation fails.
- **Warn**: Allows the pod but returns a warning in the API response. Good for rolling out changes.
- **Audit**: Logs non-compliant pods to the API server audit log. Useful for monitoring.

Use `warn` and `audit` before `enforce`. Switch all namespaces to `enforce` at once and you'll break things. Roll out progressively:

```bash
# Step 1: Audit only: see what would be rejected
kubectl label namespace production pod-security.kubernetes.io/audit=restricted

# Step 2: Warn: see warnings in kubectl output
kubectl label namespace production pod-security.kubernetes.io/warn=restricted

# Step 3: Enforce: reject non-compliant pods
kubectl label namespace production pod-security.kubernetes.io/enforce=restricted
```

### Exemptions

Some pods must run with elevated privileges. In Kubernetes, the `kube-system` namespace is exempt by default. For other system pods, you can create exemptions in the admission controller configuration:

```yaml
# /etc/kubernetes/manifests/kube-apiserver.yaml (additional flag)
- --admission-control-config-file=/etc/kubernetes/admission-config.yaml
```

```yaml
# /etc/kubernetes/admission-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: PodSecurity
  configuration:
    apiVersion: pod-security.admission.config.k8s.io/v1
    kind: PodSecurityConfiguration
    defaults:
      enforce: "restricted"
      enforce-version: "latest"
      warn: "restricted"
      warn-version: "latest"
      audit: "restricted"
      audit-version: "latest"
    exemptions:
      usernames: []
      runtimeClassNames:
      - gvisor
      - kata
      namespaces:
      - kube-system
      - kube-public
```

## Security Contexts

A security context defines the security settings for a pod or container. It's how you tell Kubernetes to run a container as a specific user, drop capabilities, use a seccomp profile, and more.

### Pod-Level Security Context

Applied to all containers in the pod:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:1.25
```

Key fields:
- `runAsUser`: UID the container runs as. Must be non-root for restricted policies.
- `runAsGroup`: GID for the container's process.
- `fsGroup`: GID applied to all files created by the container. Useful for volumes that need group write access.
- `runAsNonRoot`: If true, Kubernetes rejects pods that try to run as root (UID 0).
- `seccompProfile.type`: RuntimeDefault uses the container runtime's default profile. Localhost loads a custom profile from a file.

### Container-Level Security Context

Applied to a specific container:

```yaml
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
    seccompProfile:
      type: RuntimeDefault
```

Key fields:
- `allowPrivilegeEscalation`: If false, the container can't gain more privileges than its parent. Always false in restricted policies.
- `readOnlyRootFilesystem`: The container can't write to its root filesystem. Use emptyDir volumes for writable paths.
- `capabilities.drop`: Linux capabilities to remove. Dropping ALL and adding only what's needed is the principle of least privilege.
- `capabilities.add`: Capabilities to add. NET_BIND_SERVICE is the only one allowed in the baseline policy.

### Capabilities in Detail

Linux capabilities break root privileges into discrete units. Instead of "root" being all-powerful, capabilities let you grant specific permissions:

- `CAP_NET_BIND_SERVICE`: Bind to ports below 1024 (needed for web servers on port 80/443)
- `CAP_SYS_TIME`: Set system clock (almost never needed in containers)
- `CAP_NET_RAW`: Use raw sockets (needed for ping, not needed for most apps)
- `CAP_SYS_ADMIN`: A catch-all that grants many privileges (avoid this)

Here's a practical example: a web server that needs to bind to port 80 but nothing else:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-restricted
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-restricted
  template:
    metadata:
      labels:
        app: nginx-restricted
    spec:
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE
        volumeMounts:
        - name: nginx-cache
          mountPath: /var/cache/nginx
        - name: nginx-run
          mountPath: /var/run
        - name: nginx-conf
          mountPath: /etc/nginx/conf.d
          readOnly: true
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "200m"
            memory: "256Mi"
      volumes:
      - name: nginx-cache
        emptyDir: {}
      - name: nginx-run
        emptyDir: {}
      - name: nginx-conf
        configMap:
          name: nginx-config
```

Notice the `readOnlyRootFilesystem: true` with emptyDir volumes for writable paths. Nginx needs to write to `/var/cache/nginx` and `/var/run`, but nothing else. The config is mounted from a ConfigMap (read-only). This is the correct pattern for production containers.

### Seccomp Profiles

Seccomp (Secure Computing) filters system calls a container can make. The Linux kernel has over 300 system calls. Most containers use a tiny fraction. Seccomp blocks the rest.

The RuntimeDefault profile (provided by containerd or CRI-O) blocks dangerous system calls. It's a good default. Localhost profiles let you define custom filters:

```yaml
seccompProfile:
  type: Localhost
  localhostProfile: profiles/custom-seccomp.json
```

The profile file must be on the node at `/var/lib/kubelet/seccomp/profiles/`. Here's a minimal custom profile:

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "fstat", 
                "mmap", "mprotect", "munmap", "brk", "ioctl",
                "access", "pipe", "select", "sched_yield",
                "clone", "fork", "execve", "exit", "wait4",
                "kill", "getpid", "socket", "connect", "accept",
                "sendto", "recvfrom", "bind", "listen", "getsockname",
                "getpeername", "socketpair", "setsockopt", "getsockopt",
                "shutdown", "recvmsg", "sendmsg", "mremap",
                "msync", "mincore", "madvise", "shmget", "shmat",
                "shmctl", "dup", "dup2", "pause", "nanosleep",
                "getitimer", "alarm", "setitimer", "getpid",
                "sendfile", "socket", "connect", "accept", "sendto",
                "recvfrom", "sendmsg", "recvmsg", "shutdown",
                "bind", "listen", "getsockname", "getpeername",
                "socketpair", "setsockopt", "getsockopt", "clone",
                "fork", "vfork", "execve", "exit", "wait4",
                "kill", "uname", "semget", "semop", "semctl",
                "shmdt", "shmget", "shmop", "shmat", "msgget",
                "msgsnd", "msgrcv", "msgctl", "fcntl", "flock",
                "fsync", "fdatasync", "truncate", "ftruncate",
                "getdents", "getcwd", "chdir", "fchdir",
                "rename", "mkdir", "rmdir", "creat", "link",
                "unlink", "symlink", "readlink", "chmod", "fchmod",
                "chown", "fchown", "lchown", "umask", "gettimeofday",
                "getrlimit", "getrusage", "sysinfo", "times",
                "getuid", "getgid", "setuid", "setgid", "geteuid",
                "getegid", "setpgid", "getppid", "getpgrp",
                "setsid", "setreuid", "setregid", "getgroups",
                "setgroups", "setresuid", "getresuid", "setresgid",
                "getresgid", "getpgid", "setfsuid", "setfsgid",
                "getsid", "capget", "capset", "rt_sigpending",
                "rt_sigtimedwait", "rt_sigaction", "rt_sigprocmask",
                "rt_sigsuspend", "rt_sigreturn", "setpriority",
                "getpriority", "reboot", "setregid", "setgid",
                "setreuid", "setuid", "setresuid", "setresgid",
                "setfsuid", "setfsgid", "times", "setpgid",
                "getpgid", "getpgrp", "setsid", "setreuid",
                "setregid", "getgroups", "setgroups", "setresuid",
                "getresuid", "setresgid", "getresgid", "getpgid",
                "setfsuid", "setfsgid", "getsid"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

In practice, use the RuntimeDefault profile. Custom profiles are for specialized workloads (database kernels, network-intensive applications) where specific system calls need to be blocked.

## Service Accounts

Every pod has a service account. By default, it's the `default` service account in the pod's namespace. This service account gets a token mounted into the pod at `/var/run/secrets/kubernetes.io/serviceaccount/`.

The problem: the default service account often has too many permissions. In older Kubernetes versions, the default service account was automatically bound to the `cluster-admin` ClusterRole in some configurations. This is a critical security issue. If a pod is compromised and has cluster-admin access, the attacker owns the entire cluster.

### Best Practices for Service Accounts

**1. Disable automounting the API token:**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
automountServiceAccountToken: false
```

If your pod doesn't need to talk to the Kubernetes API, don't give it a token.

**2. Create dedicated service accounts:**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nginx-sa
  namespace: production
automountServiceAccountToken: false
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      serviceAccountName: nginx-sa
      automountServiceAccountToken: false
      containers:
      - name: nginx
        image: nginx:1.25
```

**3. Bind service accounts to specific Roles:**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: ServiceAccount
  name: my-app-sa
  namespace: production
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**4. Use bound service account token volumes (projected tokens):**

Since Kubernetes 1.21, you can mount a bound service account token with a specific audience and expiration:

```yaml
spec:
  containers:
  - name: app
    image: my-app:latest
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

Bound tokens expire and are audience-scoped. This limits the damage if a token is leaked.

## Real Scenario: Securing a Multi-Tenant Cluster

Let's say you're running a shared Kubernetes cluster for multiple teams. Each team gets their own namespace. You need to enforce security at the namespace level while giving teams enough freedom to run their workloads.

### Step 1: Create Namespaces with Security Labels

```bash
# Create namespaces
for team in backend frontend data ml; do
  kubectl create namespace $team
done

# Label all namespaces with restricted policy
for team in backend frontend data ml; do
  kubectl label namespace $team \
    pod-security.kubernetes.io/enforce=restricted \
    pod-security.kubernetes.io/enforce-version=latest \
    pod-security.kubernetes.io/warn=restricted \
    pod-security.kubernetes.io/warn-version=latest \
    pod-security.kubernetes.io/audit=restricted \
    pod-security.kubernetes.io/audit-version=latest
done
```

### Step 2: Create Per-Team Service Accounts

```yaml
# backend-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-deployer
  namespace: backend
  labels:
    team: backend
automountServiceAccountToken: false
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-app
  namespace: backend
  labels:
    team: backend
automountServiceAccountToken: false
```

### Step 3: Define Team RBAC

```yaml
# backend-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-developer
  namespace: backend
rules:
- apiGroups: ["", "apps", "batch"]
  resources: ["pods", "deployments", "services", "configmaps", "secrets", "jobs", "cronjobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["pods/log", "pods/exec"]
  verbs: ["get", "create"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-developer-binding
  namespace: backend
subjects:
- kind: ServiceAccount
  name: backend-deployer
  namespace: backend
- kind: Group
  name: backend-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: backend-developer
  apiGroup: rbac.authorization.k8s.io
```

### Step 4: Create a Network Policy Template

```yaml
# default-deny-all.yaml
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
# allow-dns.yaml
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
# allow-same-namespace.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: backend
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
```

### Step 5: Create a Pod Security Template

```yaml
# restricted-pod-template.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-template
  namespace: backend
  labels:
    app: app-template
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-template
  template:
    metadata:
      labels:
        app: app-template
    spec:
      serviceAccountName: backend-app
      automountServiceAccountToken: false
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: my-app:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        ports:
        - containerPort: 8080
```

### Step 6: Audit the Cluster

```bash
# Check all namespaces for security labels
kubectl get namespaces -L pod-security.kubernetes.io/enforce

# List all pods running as root
kubectl get pods --all-namespaces -o json | jq -r '
  .items[] | 
  select(.spec.securityContext.runAsNonRoot == false or 
         .spec.containers[].securityContext.runAsNonRoot == false) |
  "\(.metadata.namespace)/\(.metadata.name)"'

# Check for privileged pods
kubectl get pods --all-namespaces -o json | jq -r '
  .items[] | 
  select(.spec.containers[].securityContext.privileged == true) |
  "\(.metadata.namespace)/\(.metadata.name)"'

# Check for pods with hostNetwork
kubectl get pods --all-namespaces -o json | jq -r '
  .items[] | 
  select(.spec.hostNetwork == true) |
  "\(.metadata.namespace)/\(.metadata.name)"'

# Review pod security audit logs
kubectl get events --field-selector reason=FailedCreate --all-namespaces
```

### Step 7: Test Enforcement

Try deploying a pod that violates the restricted policy:

```yaml
# non-compliant-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: non-compliant
  namespace: backend
spec:
  containers:
  - name: nginx
    image: nginx:1.25
```

```bash
kubectl apply -f non-compliant-pod.yaml
# Error: pods "non-compliant" is forbidden: violates PodSecurity "restricted:latest": 
#   runAsNonRoot (pod must not run as root), 
#   seccompProfile (pod or container "nginx" must set seccompProfile type to RuntimeDefault or Localhost),
#   capabilities (container "nginx" must drop all capabilities), 
#   allowPrivilegeEscalation (container "nginx" must set allowPrivilegeEscalation=false),
#   unrestricted capabilities (container "nginx" must drop ALL),
#   volume types (pod volumes "default-token-abc12" have disallowed volume types)
```

The error message tells you exactly what's wrong. Fix each issue:

```yaml
# compliant-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: compliant
  namespace: backend
spec:
  serviceAccountName: backend-app
  automountServiceAccountToken: false
  securityContext:
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: nginx
    image: nginx:1.25
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    ports:
    - containerPort: 80
    volumeMounts:
    - name: cache
      mountPath: /var/cache/nginx
    - name: run
      mountPath: /var/run
  volumes:
  - name: cache
    emptyDir: {}
  - name: run
    emptyDir: {}
```

```bash
kubectl apply -f compliant-pod.yaml
# pod/compliant created
```

## Common Pitfalls

**1. Running init containers as root.** Init containers run before the main containers. They must also comply with the security policy. Use the same `securityContext` for init containers:

```yaml
initContainers:
- name: init-db
  image: busybox:1.36
  command: ['sh', '-c', 'until nslookup db-service; do echo waiting; sleep 2; done']
  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
      - ALL
    runAsUser: 1000
    runAsNonRoot: true
```

**2. Forgetting about sidecar containers.** Service meshes (Istio, Linkerd) inject sidecar containers. These must also be compliant. Check your service mesh documentation for restricted-mode support.

**3. Using `latest` tag.** The restricted policy doesn't prevent this, but it's a security issue. Use specific tags or digests:

```yaml
image: nginx:1.25.3  # Good
image: nginx@sha256:abc123...  # Better
image: nginx:latest  # Bad
```

**4. Not testing in CI.** Pod security policies should be validated before deployment. Use tools like `kubeconform` or `polaris` in your CI pipeline:

```bash
# kubeconform with strict schema validation
kubeconform -strict -summary deployment.yaml

# Polaris audit
polaris audit --set-exit-code-on-failure
```

## Assessment

### Lab 1: Pod Security Standards (40 minutes)

1. Create three namespaces: `privileged-ns`, `baseline-ns`, `restricted-ns`. Label each with the appropriate enforcement level.
2. Write a pod manifest that satisfies the `baseline` policy. Deploy it to `baseline-ns`. Verify it works.
3. Write a pod manifest that satisfies the `restricted` policy. Deploy it to `restricted-ns`. Verify it works.
4. Try deploying the `baseline` pod to `restricted-ns`. Document the error messages.
5. List all pods running in the cluster. Identify which ones violate the `restricted` policy and explain why.

**Grading**: 15 points. 3 points per task. Full credit for correct manifests, accurate observations, and clear explanations.

### Lab 2: Security Context Hardening (45 minutes)

1. Take an existing Deployment that runs as root. Modify it to comply with the restricted policy. Document every change you made.
2. Write a security context that drops ALL capabilities and adds only NET_BIND_SERVICE. Test it by deploying a pod that listens on port 80.
3. Write a security context with a custom seccomp profile that blocks the `mount` system call. Deploy a pod with this profile and verify that `mount` fails.
4. Configure a service account with `automountServiceAccountToken: false`. Deploy a pod using this service account. Verify that no token is mounted.
5. Create a bound service account token with a 1-hour expiration. Deploy a pod with this token. Wait for it to expire and verify the token is invalid.

**Grading**: 20 points. 4 points per task. Full credit for correct security contexts, working tests, and accurate observations.

### Lab 3: Multi-Tenant Security Design (35 minutes)

1. Design a multi-tenant security model for a cluster with three teams: `platform`, `backend`, `frontend`. Define namespaces, RBAC roles, network policies, and pod security standards for each.
2. Write a script that creates all namespaces, service accounts, RBAC bindings, and network policies in one command.
3. Create a compliant deployment template for each team that includes all security contexts.
4. Test the RBAC by switching between service accounts and attempting operations in different namespaces.
5. Audit the entire setup and write a security report identifying any remaining risks.

**Grading**: 15 points. 3 points per task. Full credit for comprehensive design, working implementation, and thorough audit.

## Evidence

Submit the following as proof of completion:

1. Screenshots of namespace labels and pod security enforcement
2. Before/after manifests for the hardened deployment
3. Security context configurations for all containers
4. RBAC role and binding YAML files
5. Network policy YAML files
6. Audit output showing pod security compliance
7. Security report for the multi-tenant design
