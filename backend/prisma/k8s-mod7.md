# Module 7 — Cluster Hardening

A default Kubernetes installation is not hardened. The API server accepts connections on unencrypted ports, etcd stores data without encryption, audit logging is disabled, and many security features are turned off. Cluster hardening means configuring every component to follow security best practices. This module covers the CIS Kubernetes Benchmark, audit logging, API server security, etcd encryption, and the practical work of hardening a cluster for compliance.

## CIS Kubernetes Benchmark

The Center for Internet Security (CIS) publishes a Kubernetes Benchmark — a checklist of over 200 configuration items organized by control plane, etcd, control plane configuration, worker nodes, and policies. The benchmark is freely available and is the industry standard for Kubernetes security.

### Key Categories

**Control Plane:**
- API Server: authentication, authorization, audit logging, encryption
- Controller Manager: Use service account credentials, configure secure ciphers
- Scheduler: Protect scheduling decisions

**etcd:**
- Certificate-based authentication
- Encryption at rest
- Client certificate authentication

**Worker Nodes:**
- kubelet authentication and authorization
- Container runtime security
- Pod security

**Policies:**
- RBAC and service accounts
- Pod security
- Network policies
- Secrets management

### Running the Benchmark

The easiest way to check your cluster against the CIS benchmark is using kube-bench:

```bash
# Run kube-bench as a pod
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml

# Check results
kubectl logs -l app=kube-bench

# Or run directly on a node
kube-bench run
```

kube-bench output:

```
[INFO] 1 Control Plane Security Configuration
[INFO] 1.1 Master Node Configuration Files
[PASS] 1.1.1 Ensure that the --anonymous-auth argument is set to false
[PASS] 1.1.2 Ensure that the --basic-auth-file argument is not set
[PASS] 1.1.3 Ensure that the --token-auth-file argument is not set
[FAIL] 1.1.4 Ensure that the --audit-log-path argument is set
[FAIL] 1.1.5 Ensure that the --audit-log-maxage argument is set to 30
[FAIL] 1.1.6 Ensure that the --audit-log-maxbackup argument is set to 10
[PASS] 1.1.7 Ensure that the --audit-log-maxsize argument is set to 100
[PASS] 1.1.8 Ensure that the --authorization-mode argument is not set to AlwaysAllow
[PASS] 1.1.9 Ensure that the --authorization-mode argument includes Node
[PASS] 1.1.10 Ensure that the --authorization-mode argument includes RBAC
...
```

**Scoring:**

```bash
# Check specific category
kube-bench run --targets master

# Check specific test
kube-bench run --check 1.1.4

# Output as JSON
kube-bench run --json > results.json
```

## Audit Logging

Kubernetes audit logging records every request to the API server. This is critical for security monitoring, compliance, and incident response.

### Audit Policy

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log all requests at Metadata level (minimal data)
  - level: Metadata
    resources:
    - group: ""
      resources: ["secrets", "configmaps"]
  
  # Log all requests at RequestResponse level (full data)
  - level: RequestResponse
    resources:
    - group: ""
      resources: ["pods", "services"]
    - group: "apps"
      resources: ["deployments", "statefulsets", "daemonsets"]
    - group: "rbac.authorization.k8s.io"
      resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
    - group: "networking.k8s.io"
      resources: ["networkpolicies", "ingresses"]
  
  # Log authentication failures
  - level: Metadata
    omitStages:
    - RequestReceived
    stages:
    - ResponseComplete
  
  # Log all other requests at Metadata level
  - level: Metadata
    omitStages:
    - RequestReceived
```

### Enable Audit Logging

Add to kube-apiserver manifest:

```yaml
# /etc/kubernetes/manifests/kube-apiserver.yaml
spec:
  containers:
  - command:
    - kube-apiserver
    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml
    - --audit-log-path=/var/log/kubernetes/audit/audit.log
    - --audit-log-maxage=30
    - --audit-log-maxbackup=10
    - --audit-log-maxsize=100
    volumeMounts:
    - name: audit-log
      mountPath: /var/log/kubernetes/audit
      readOnly: false
    - name: audit-policy
      mountPath: /etc/kubernetes/audit-policy.yaml
      readOnly: true
  volumes:
  - name: audit-log
    hostPath:
      path: /var/log/kubernetes/audit
      type: DirectoryOrCreate
  - name: audit-policy
    hostPath:
      path: /etc/kubernetes/audit-policy.yaml
      type: FileOrCreate
```

### Analyzing Audit Logs

```bash
# Search audit logs for specific users
cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.user.username == "admin@example.com")'

# Search for secret access
cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.objectRef.resource == "secrets" and .verb == "get")'

# Search for RBAC changes
cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.objectRef.resource == "clusterroles" or .objectRef.resource == "clusterrolebindings")'

# Search for failed requests
cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.responseStatus.code == 403 or .responseStatus.code == 401)'

# Search for pod exec operations
cat /var/log/kubernetes/audit/audit.log | \
  jq 'select(.objectRef.resource == "pods" and .objectRef.subresource == "exec")'
```

### Forwarding Audit Logs

Forward audit logs to a central logging system:

```yaml
# Fluentd configuration for audit logs
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-audit-config
  namespace: kube-system
data:
  audit.conf: |
    <source>
      @type tail
      path /var/log/kubernetes/audit/audit.log
      pos_file /var/log/kubernetes/audit/audit.log.pos
      tag kubernetes.audit
      <parse>
        @type json
      </parse>
    </source>
    
    <filter kubernetes.audit>
      @type record_transformer
      <record>
        hostname "#{Socket.gethostname}"
      </record>
    </filter>
    
    <match kubernetes.audit>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix kubernetes-audit
      include_tag_key true
    </match>
```

## API Server Security

### Authentication

Disable anonymous authentication and weak authentication methods:

```yaml
# kube-apiserver flags
- --anonymous-auth=false
- --basic-auth-file=/etc/kubernetes/basic-auth.csv  # REMOVE this
- --token-auth-file=/etc/kubernetes/token-auth.csv  # REMOVE this
- --oidc-issuer-url=https://accounts.google.com
- --oidc-client-id=kubernetes
- --oidc-username-claim=email
- --oidc-groups-claim=groups
```

### Authorization

Use RBAC only:

```yaml
- --authorization-mode=Node,RBAC
```

Remove AlwaysAllow and AlwaysDeny modes.

### Admission Controllers

Enable security-focused admission controllers:

```yaml
- --enable-admission-plugins=NodeRestriction,PodSecurity,AlwaysPullImages,PodSecurityPolicy
```

- **NodeRestriction**: Limits kubelet to modifying only its own node and pods assigned to it.
- **PodSecurity**: Enforces Pod Security Standards.
- **AlwaysPullImages**: Forces image pulling on every pod start (prevents cached image tampering).

### TLS Configuration

Use strong TLS ciphers and protocols:

```yaml
- --tls-min-version=VersionTLS12
- --tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

### API Server Rate Limiting

Protect against DoS attacks:

```yaml
- --max-requests-inflight=400
- --max-mutating-requests-inflight=200
- --request-timeout=300s
```

### External Access Control

```yaml
# Restrict API server access
- --bind-address=10.0.1.10
- --secure-port=6443

# kubelet security
- --kubelet-certificate-authority=/etc/kubernetes/pki/ca.crt
- --kubelet-client-certificate=/etc/kubernetes/pki/apiserver-kubelet-client.crt
- --kubelet-client-key=/etc/kubernetes/pki/apiserver-kubelet-client.key
```

## etcd Security

### Encryption at Rest

```yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64-32-byte-key>
    - identity: {}
  - resources:
    - configmaps
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64-32-byte-key>
    - identity: {}
```

### etcd Access Control

```yaml
# Restrict etcd access to API server only
- --etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt
- --etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key
- --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt
```

### etcd Performance

```bash
# Check etcd performance
ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  endpoint status --write-out=table

# Check etcd member list
ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  member list --write-out=table
```

## Worker Node Hardening

### kubelet Security

```yaml
# /var/lib/kubelet/config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: true
    cacheTTL: 0s
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.crt
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 0s
    cacheUnauthorizedTTL: 0s
cgroupDriver: systemd
clusterDNS:
- 10.96.0.10
clusterDomain: cluster.local
containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"
  nodefs.inodesFree: "5%"
protectKernelDefaults: true
rotateCertificates: true
serializeImagePulls: false
serverTLSBootstrap: true
```

### Node Operating System

```bash
# Disable unused filesystems
echo "install cramfs /bin/true" >> /etc/modprobe.d/CIS.conf
echo "install freevxfs /bin/true" >> /etc/modprobe.d/CIS.conf
echo "install hfs /bin/true" >> /etc/modprobe.d/CIS.conf
echo "install hfsplus /bin/true" >> /etc/modprobe.d/CIS.conf
echo "install udf /bin/true" >> /etc/modprobe.d/CIS.conf

# Set kernel parameters
cat <<EOF >> /etc/sysctl.d/k8s.conf
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
kernel.randomize_va_space = 2
fs.suid_dumpable = 0
EOF
sysctl --system
```

### Container Runtime Security

```toml
# /etc/containerd/config.toml
version = 2

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"
  
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.crun]
  runtime_type = "io.containerd.runc.v2"
  
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.crun.options]
    SystemdCgroup = true

[plugins."io.containerd.grpc.v1.cri".registry]
  config_path = "/etc/containerd/certs.d"
```

### Filesystem Permissions

```bash
# Restrict file permissions
chmod 600 /etc/kubernetes/pki/apiserver.crt
chmod 600 /etc/kubernetes/pki/apiserver.key
chmod 600 /etc/kubernetes/pki/apiserver-kubelet-client.crt
chmod 600 /etc/kubernetes/pki/apiserver-kubelet-client.key
chmod 600 /etc/kubernetes/pki/front-proxy-client.crt
chmod 600 /etc/kubernetes/pki/front-proxy-client.key
chmod 600 /etc/kubernetes/pki/etcd/server.crt
chmod 600 /etc/kubernetes/pki/etcd/server.key
chmod 600 /var/lib/kubelet/config.yaml
chmod 700 /etc/kubernetes/pki
chmod 700 /etc/kubernetes/manifests
```

## Real Scenario: Hardening a Cluster for Compliance

Let's harden a cluster to meet SOC 2 compliance requirements.

### Step 1: Run Initial Assessment

```bash
# Run kube-bench
kube-bench run --json > initial-assessment.json

# Count findings
cat initial-assessment.json | jq '[.Controls[].tests[].results[] | select(.status == "FAIL")] | length'
# 47 failures

# List critical failures
cat initial-assessment.json | jq -r '[.Controls[].tests[] | select(.status == "FAIL") | select(.severity == "critical")][] | .desc'
```

### Step 2: Harden API Server

```yaml
# Updated kube-apiserver.yaml
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
  - name: kube-apiserver
    image: registry.k8s.io/kube-apiserver:v1.29.0
    command:
    - kube-apiserver
    - --advertise-address=10.0.1.10
    - --allow-privileged=true
    - --anonymous-auth=false
    - --authorization-mode=Node,RBAC
    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml
    - --audit-log-path=/var/log/kubernetes/audit/audit.log
    - --audit-log-maxage=30
    - --audit-log-maxbackup=10
    - --audit-log-maxsize=100
    - --client-ca-file=/etc/kubernetes/pki/ca.crt
    - --enable-admission-plugins=NodeRestriction,PodSecurity,AlwaysPullImages
    - --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt
    - --etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt
    - --etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key
    - --etcd-servers=https://127.0.0.1:2379
    - --encryption-provider-config=/etc/kubernetes/encryption-config.yaml
    - --kubelet-client-certificate=/etc/kubernetes/pki/apiserver-kubelet-client.crt
    - --kubelet-client-key=/etc/kubernetes/pki/apiserver-kubelet-client.key
    - --kubelet-certificate-authority=/etc/kubernetes/pki/ca.crt
    - --max-requests-inflight=400
    - --max-mutating-requests-inflight=200
    - --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.crt
    - --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client.key
    - --request-timeout=300s
    - --service-account-key-file=/etc/kubernetes/pki/sa.pub
    - --service-cluster-ip-range=10.96.0.0/12
    - --tls-cert-file=/etc/kubernetes/pki/apiserver.crt
    - --tls-min-version=VersionTLS12
    - --tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    - --tls-private-key-file=/etc/kubernetes/pki/apiserver.key
    volumeMounts:
    - mountPath: /etc/kubernetes/pki
      name: k8s-certs
      readOnly: true
    - mountPath: /etc/ssl/certs
      name: ca-certs
      readOnly: true
    - mountPath: /etc/kubernetes/audit-policy.yaml
      name: audit-policy
      readOnly: true
    - mountPath: /var/log/kubernetes/audit
      name: audit-log
    - mountPath: /etc/kubernetes/encryption-config.yaml
      name: encryption-config
      readOnly: true
  hostNetwork: true
  priorityClassName: system-cluster-critical
  volumes:
  - hostPath:
      path: /etc/kubernetes/pki
      type: DirectoryOrCreate
    name: k8s-certs
  - hostPath:
      path: /etc/ssl/certs
      type: DirectoryOrCreate
    name: ca-certs
  - hostPath:
      path: /etc/kubernetes/audit-policy.yaml
      type: FileOrCreate
    name: audit-policy
  - hostPath:
      path: /var/log/kubernetes/audit
      type: DirectoryOrCreate
    name: audit-log
  - hostPath:
      path: /etc/kubernetes/encryption-config.yaml
      type: FileOrCreate
    name: encryption-config
```

### Step 3: Enable Encryption at Rest

```bash
# Generate encryption key
ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)

# Create encryption config
cat <<EOF > /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: ${ENCRYPTION_KEY}
    - identity: {}
EOF

# Re-encrypt existing secrets
kubectl get secrets --all-namespaces -o json | kubectl replace -f -
```

### Step 4: Configure Audit Logging

```bash
# Create audit policy directory
mkdir -p /var/log/kubernetes/audit

# Apply audit policy
cp audit-policy.yaml /etc/kubernetes/audit-policy.yaml

# Restart API server (if using static pods)
crictl stopp $(crictl pods --name kube-apiserver -q)
```

### Step 5: Harden kubelet

```bash
# Apply kubelet hardening
cat <<EOF > /var/lib/kubelet/config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: true
    cacheTTL: 0s
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.crt
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 0s
    cacheUnauthorizedTTL: 0s
cgroupDriver: systemd
clusterDNS:
- 10.96.0.10
clusterDomain: cluster.local
containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"
  nodefs.inodesFree: "5%"
protectKernelDefaults: true
rotateCertificates: true
serializeImagePulls: false
serverTLSBootstrap: true
EOF

# Restart kubelet
systemctl restart kubelet
```

### Step 6: Apply Pod Security Standards

```bash
# Label all namespaces
for ns in $(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}'); do
  kubectl label namespace $ns \
    pod-security.kubernetes.io/enforce=restricted \
    pod-security.kubernetes.io/enforce-version=latest \
    pod-security.kubernetes.io/warn=restricted \
    pod-security.kubernetes.io/warn-version=latest \
    pod-security.kubernetes.io/audit=restricted \
    pod-security.kubernetes.io/audit-version=latest \
    --overwrite
done
```

### Step 7: Run Final Assessment

```bash
# Run kube-bench again
kube-bench run --json > final-assessment.json

# Compare results
cat initial-assessment.json | jq '[.Controls[].tests[].results[] | select(.status == "FAIL")] | length'
# 47 failures

cat final-assessment.json | jq '[.Controls[].tests[].results[] | select(.status == "FAIL")] | length'
# 3 failures (remaining are informational)
```

### Step 8: Documentation

```bash
# Create compliance report
cat <<EOF > compliance-report.md
# Kubernetes Cluster Hardening Report

## Date: $(date +%Y-%m-%d)
## Cluster: production
## Benchmark: CIS Kubernetes Benchmark v1.8

## Changes Applied
1. API Server: disabled anonymous auth, enabled RBAC, enabled audit logging, enabled encryption at rest
2. kubelet: disabled anonymous auth, enabled webhook authorization, enabled certificate rotation
3. Pod Security: enforced restricted policy on all namespaces
4. Audit: configured comprehensive audit logging with retention

## Results
- Initial failures: 47
- Final failures: 3 (informational)
- Compliance score: 94%

## Remaining Items
1. 1.1.12 Ensure that the admission control plugin PodSecurityPolicy is set (deprecated)
2. 4.2.12 Ensure that the --protect-kernel-defaults argument is set to true
3. 4.2.13 Ensure that the --make-iptables-util-chains argument is not set to false
EOF
```

## Assessment

### Lab 1 — CIS Benchmark Audit (30 minutes)

1. Run kube-bench on the lab cluster and save the results.
2. Identify all CRITICAL and HIGH severity failures.
3. For each failure, write the remediation command.
4. Apply the top 5 most critical fixes.
5. Re-run kube-bench and compare results.

**Grading**: 10 points. 2 points per task. Full credit for accurate audit, correct identification, and working fixes.

### Lab 2 — API Server Hardening (45 minutes)

1. Create a hardened API server configuration with all security flags.
2. Enable audit logging with a comprehensive audit policy.
3. Enable encryption at rest for Secrets.
4. Test that the hardened API server rejects insecure requests.
5. Analyze audit logs for security events.

**Grading**: 15 points. 3 points per task. Full credit for correct configuration, working audit logging, and accurate analysis.

### Lab 3 — Full Cluster Hardening (45 minutes)

1. Harden a cluster to meet CIS Benchmark Level 2.
2. Apply Pod Security Standards (restricted) to all namespaces.
3. Harden kubelet configuration on all nodes.
4. Run kube-bench and achieve a score above 90%.
5. Write a compliance report documenting all changes.

**Grading**: 15 points. 3 points per task. Full credit for comprehensive hardening, high compliance score, and detailed report.

## Evidence

Submit the following as proof of completion:

1. kube-bench initial and final reports
2. Hardened API server configuration
3. Audit policy configuration
4. Encryption at rest configuration
5. kubelet hardening configuration
6. Pod Security Standards labels
7. Compliance report
