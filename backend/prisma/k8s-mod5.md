# Module 5 — Secrets Management

## What You'll Actually Do

You'll manage secrets in Kubernetes using multiple approaches: native secrets, Sealed Secrets for GitOps, and HashiCorp Vault for production-grade secret management. You'll encrypt secrets at rest and rotate them without downtime.

## Core Concepts

### Native Kubernetes Secrets

Secrets are base64-encoded (NOT encrypted) objects stored in etcd. They're better than hardcoding credentials in pod specs, but they have limitations:

- Only base64-encoded by default (not encrypted)
- Stored in plaintext in etcd unless you enable encryption at rest
- Limited to 1MB per secret
- No built-in rotation mechanism

```yaml
# Create a secret from literal values
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password='S3cur3P@ss!' \
  -n production

# Or from a file
kubectl create secret generic tls-secret \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem \
  -n production
```

### Encryption at Rest

By default, secrets in etcd are only base64-encoded. Enable encryption to protect them:

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
          secret: <base64-encoded-32-byte-key>
    - identity: {}  # fallback for reading old secrets
```

```bash
# Generate the encryption key
head -c 32 /dev/urandom | base64

# Restart API server with encryption config
# Add to kube-apiserver flags:
# --encryption-provider-config=/etc/kubernetes/encryption-config.yaml
```

### Sealed Secrets

Sealed Secrets encrypt secrets so they can be safely stored in Git. Only the controller in your cluster can decrypt them.

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI
brew install kubeseal

# Seal a secret
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password='S3cur3P@ss!' \
  --dry-run=client -o yaml | kubeseal -o yaml > sealed-secret.yaml
```

```yaml
# sealed-secret.yaml — safe to commit to Git
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9rO...
    password: AgBy3i4OJSWK+PiTySYZZA9rO...
```

### HashiCorp Vault Integration

Vault is the gold standard for secrets management in production.

```bash
# Deploy Vault with Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --namespace vault --create-namespace \
  --set server.dev.enabled=true

# Initialize and unseal (in production, use auto-unseal)
kubectl exec -n vault vault-0 -- vault operator init
kubectl exec -n vault vault-0 -- vault operator unseal <key>
```

```bash
# Store a secret in Vault
kubectl exec -n vault vault-0 -- vault kv put secret/db/credentials \
  username=admin \
  password='S3cur3P@ss!'

# Read it back
kubectl exec -n vault vault-0 -- vault kv get secret/db/credentials
```

### Vault Agent Sidecar

Vault Agent injects secrets into pods automatically:

```yaml
# Vault Agent annotation on pod
apiVersion: v1
kind: Pod
metadata:
  name: app-with-vault
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "app-role"
    vault.hashicorp.com/agent-inject-secret-db-creds: "secret/db/credentials"
    vault.hashicorp.com/agent-inject-template-db-creds: |
      {{- with secret "secret/db/credentials" -}}
      DB_USERNAME={{ .Data.data.username }}
      DB_PASSWORD={{ .Data.data.password }}
      {{- end -}}
spec:
  serviceAccountName: app-sa
  containers:
  - name: app
    image: myapp:1.0
```

## Hands-On Lab

### Task 1: Create and Use Native Secrets

```bash
# Create a secret
kubectl create namespace secrets-demo
kubectl create secret generic api-keys \
  --from-literal=stripe=sk_test_abc123 \
  --from-literal=sendgrid=SG.xyz789 \
  -n secrets-demo

# Mount as environment variables
kubectl run secret-consumer --image=busybox --rm -it -n secrets-demo \
  --env="STRIPE_KEY=$(kubectl get secret api-keys -n secrets-demo -o jsonpath='{.data.stripe}' | base64 -d)" \
  -- /bin/sh

# Mount as a volume
kubectl run secret-volume --image=busybox --rm -it -n secrets-demo \
  --overrides='{"spec":{"volumes":[{"name":"secret-vol","secret":{"secretName":"api-keys"}}],"containers":[{"name":"secret-volume","image":"busybox","volumeMounts":[{"name":"secret-vol","mountPath":"/etc/secrets"}]}]}}' \
  -- ls /etc/secrets
```

### Task 2: Enable Encryption at Rest

```bash
# Generate encryption key
ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
echo "Your key: $ENCRYPTION_KEY"

# Create encryption config (use the key above)
cat > /tmp/encryption-config.yaml << EOF
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: $ENCRYPTION_KEY
    - identity: {}
EOF

# Copy to all control plane nodes
scp /tmp/encryption-config.yaml control-plane:/etc/kubernetes/

# Add --encryption-provider-config=/etc/kubernetes/encryption-config.yaml
# to kube-apiserver manifest

# Restart API server
sudo systemctl restart kubelet

# Verify — create a new secret and check etcd
kubectl create secret test-encryption --from-literal=key=value -n default
ETCDCTL_API=3 etcdctl get /registry/secrets/default/test-encryption \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key | head -c 200
# Should show encrypted data, not plaintext
```

### Task 3: Deploy Sealed Secrets

```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Wait for controller to be ready
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Install kubeseal
curl -sL https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -o kubeseal
chmod +x kubeseal && sudo mv kubeseal /usr/local/bin/

# Seal a secret
kubectl create secret generic db-creds \
  --from-literal=username=admin \
  --from-literal=password='secret123' \
  --dry-run=client -o yaml | kubeseal -o yaml > sealed-db-creds.yaml

# Apply the sealed secret
kubectl apply -f sealed-db-creds.yaml

# Verify the secret was created
kubectl get secret db-creds -n default -o jsonpath='{.data.username}' | base64 -d
```

### Task 4: Rotate Secrets Without Downtime

```bash
# Update the sealed secret with new values
kubectl create secret generic db-creds \
  --from-literal=username=admin \
  --from-literal=password='newpassword456' \
  --dry-run=client -o yaml | kubeseal -o yaml > sealed-db-creds-new.yaml

kubectl apply -f sealed-db-creds-new.yaml

# Rolling restart deployment to pick up new secrets
kubectl rollout restart deployment/myapp

# Watch the rollout
kubectl rollout status deployment/myapp
```

## Assessment

**Lab Task**: Implement a complete secrets management workflow: create native secrets, enable encryption at rest, deploy Sealed Secrets for GitOps, and rotate secrets without downtime. Document each step.

**Time**: 55 minutes

**Grading** (100 points):
- Native secrets created and mounted (20 pts)
- Encryption at rest configured and verified (25 pts)
- Sealed Secrets controller deployed and working (25 pts)
- Secret rotation completed without pod restart failures (20 pts)
- Evidence that secrets are encrypted in etcd (10 pts)

## Evidence

Save the following to your evidence folder:
1. `secret-mounting.txt` — evidence of secrets mounted as env vars and volumes
2. `encryption-test.txt` — etcd output showing encrypted secret data
3. `sealed-secret.yaml` — your SealedSecret resource
4. `rotation-log.txt` — rollout status during secret rotation
5. `vault-setup.txt` — Vault initialization output (if completed bonus)
