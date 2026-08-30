# Module 7 — Cluster Hardening

## What You'll Actually Do

You'll run a CIS Kubernetes Benchmark audit, enable audit logging, harden kubelet and API server configurations, and fix the most common security misconfigurations found in production clusters.

## Core Concepts

### CIS Kubernetes Benchmark

The Center for Internet Security publishes a benchmark for Kubernetes — a checklist of 200+ security controls. Tools like `kube-bench` automate the audit.

Key areas:
- **Control Plane Security**: API server flags, etcd configuration, controller manager settings
- **etcd Security**: Encryption, peer communication, authentication
- **Worker Node Security**: kubelet configuration, proxy settings
- **Policies**: RBAC, service accounts, pod security

### Audit Logging

Kubernetes audit logs record every API request. They're your forensic trail.

Audit policy defines what gets logged:

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Don't log requests to the API server itself
  - level: None
    users: ["system:kube-apiserver"]
    verbs: ["get"]
    resources:
    - group: ""
      resources: ["endpoints", "services", "services/status"]

  # Log pod changes at RequestResponse level
  - level: RequestResponse
    resources:
    - group: ""
      resources: ["pods", "pods/status"]

  # Log secrets at Metadata level (don't log the body)
  - level: Metadata
    resources:
    - group: ""
      resources: ["secrets"]

  # Log everything else at Metadata level
  - level: Metadata
    omitStages:
    - "RequestReceived"
```

### Kubelet Hardening

The kubelet is often overlooked but critical:

```yaml
# /var/lib/kubelet/config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false    # Disable anonymous access
  webhook:
    enabled: true
    cacheTTL: 0s
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.crt
authorization:
  mode: Webhook      # Use RBAC for authorization
  webhook:
    cacheAuthorizedTTL: 0s
    cacheUnauthorizedTTL: 0s
clusterDomain: cluster.local
clusterDNS:
- 10.96.0.10
eventRecordQPS: 5
eventBurst: 10
makeIPTablesUtilChains: true
protectKernelDefaults: true  # Enforce kernel security settings
readOnlyPort: 0              # Disable read-only port (10255)
rotateCertificates: true
tlsCipherSuites:
- TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
- TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
- TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

### API Server Hardening

Key flags for the kube-apiserver:

```yaml
# Critical security flags
--anonymous-auth=false
--authorization-mode=Node,RBAC
--enable-admission-plugins=NodeRestriction,PodSecurity
--encryption-provider-config=/etc/kubernetes/encryption-config.yaml
--audit-log-path=/var/log/kubernetes/audit.log
--audit-log-maxage=30
--audit-log-maxbackup=10
--audit-log-maxsize=100
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
--tls-min-version=VersionTLS12
--tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
--service-account-lookup=true
--service-account-key-file=/etc/kubernetes/pki/sa.pub
--service-account-issuer=https://kubernetes.default.svc
--service-account-signing-key-file=/etc/kubernetes/pki/sa.key
```

### Node Security

Harden the OS itself:

```bash
# Disable unused services
sudo systemctl disable cups
sudo systemctl disable avahi-daemon

# Set kernel parameters
cat >> /etc/sysctl.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_martians = 0
net.ipv4.conf.default.send_martians = 0
kernel.randomize_va_space = 2
fs.suid_dumpable = 0
EOF
sudo sysctl -p
```

## Hands-On Lab

### Task 1: Run kube-bench

```bash
# Install kube-bench
curl -L https://github.com/aquasecurity/kube-bench/releases/latest/download/kube-bench_linux_amd64 -o kube-bench
chmod +x kube-bench && sudo mv kube-bench /usr/local/bin/

# Run the benchmark
sudo kube-bench run

# Run specific controls
sudo kube-bench run --targets master
sudo kube-bench run --targets node

# Generate JSON report
sudo kube-bench run --json > kube-bench-report.json

# Review findings
cat kube-bench-report.json | jq '.Controls[] | {title: .title, total: .total, pass: .pass, fail: .fail, warn: .warn}'
```

### Task 2: Enable Audit Logging

```bash
# Create audit policy
sudo mkdir -p /etc/kubernetes
cat > /etc/kubernetes/audit-policy.yaml << 'EOF'
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: Metadata
    resources:
    - group: ""
      resources: ["secrets"]
  - level: RequestResponse
    resources:
    - group: ""
      resources: ["pods", "services", "configmaps"]
    verbs: ["create", "update", "patch", "delete"]
  - level: Metadata
    omitStages:
    - "RequestReceived"
EOF

# Update kube-apiserver manifest
sudo vi /etc/kubernetes/manifests/kube-apiserver.yaml
# Add these flags:
#   - --audit-log-path=/var/log/kubernetes/audit.log
#   - --audit-log-maxage=30
#   - --audit-log-maxbackup=10
#   - --audit-log-maxsize=100
#   - --audit-policy-file=/etc/kubernetes/audit-policy.yaml

# Wait for API server to restart
sleep 30

# Generate some audit events
kubectl get pods -A
kubectl create namespace test-audit
kubectl delete namespace test-audit

# Check audit log
sudo tail -50 /var/log/kubernetes/audit.log | jq .
```

### Task 3: Harden Kubelet

```bash
# Check current kubelet config
cat /var/lib/kubelet/config.yaml

# Apply hardened config (backup first)
cp /var/lib/kubelet/config.yaml /var/lib/kubelet/config.yaml.bak

# Edit with the hardened settings from the concepts section

# Restart kubelet
sudo systemctl restart kubelet

# Verify anonymous access is disabled
curl -k https://$(hostname):10250/pods
# Should get 401 Unauthorized

# Verify read-only port is closed
curl -k http://$(hostname):10255/pods
# Should fail to connect
```

### Task 4: Fix kube-bench Findings

```bash
# Common fixes for failed checks:

# 1. Ensure RBAC is enabled
# Check: --authorization-mode should include RBAC
grep authorization-mode /etc/kubernetes/manifests/kube-apiserver.yaml

# 2. Disable anonymous authentication
# Check: --anonymous-auth=false
grep anonymous-auth /etc/kubernetes/manifests/kube-apiserver.yaml

# 3. Enable audit logging
# Already done in Task 2

# 4. Ensure kubelet client cert auth
grep --client-cert-auth /etc/kubernetes/manifests/kube-apiserver.yaml

# 5. Set pod eviction threshold
# Check kubelet config for evictionHard settings

# Re-run benchmark after fixes
sudo kube-bench run --targets master > before-fixes.txt
# Apply fixes
sudo kube-bench run --targets master > after-fixes.txt
diff before-fixes.txt after-fixes.txt
```

### Task 5: Set Up Log Rotation

```bash
# Configure audit log rotation
cat > /etc/logrotate.d/kubernetes-audit << 'EOF'
/var/log/kubernetes/audit.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root adm
    sharedscripts
}
EOF

# Test the rotation
sudo logrotate -d /etc/logrotate.d/kubernetes-audit
```

## Assessment

**Lab Task**: Run a CIS benchmark audit, fix the top 5 critical findings, enable audit logging, and document the before/after state. Create a hardening checklist for your cluster.

**Time**: 60 minutes

**Grading** (100 points):
- kube-bench installed and executed (10 pts)
- Audit report generated and analyzed (20 pts)
- Audit logging enabled and capturing events (20 pts)
- At least 5 critical findings fixed (25 pts)
- Before/after comparison documented (15 pts)
- Hardening checklist created (10 pts)

## Evidence

Save the following to your evidence folder:
1. `kube-bench-report.json` — full benchmark report
2. `audit-policy.yaml` — your audit policy configuration
3. `audit-log-sample.txt` — sample audit log entries
4. `before-fixes.txt` — benchmark results before hardening
5. `after-fixes.txt` — benchmark results after hardening
6. `hardening-checklist.md` — your cluster hardening checklist
