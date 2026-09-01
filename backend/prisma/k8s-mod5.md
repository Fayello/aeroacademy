# Module 5: Secrets Management

Kubernetes stores sensitive configuration: database passwords, API keys, TLS certificates, OAuth tokens: as Secrets. A Secret is a base64-encoded object stored in etcd. It's not encrypted by default. Anyone with `kubectl get secret` and the right RBAC permissions can read it. Anyone with access to etcd can read it. This module covers Kubernetes Secrets, Sealed Secrets, HashiCorp Vault integration, External Secrets Operator, and the practical work of managing secrets across environments.

## Kubernetes Secrets

### What Is a Secret?

A Kubernetes Secret is an object that stores sensitive data. Secrets are similar to ConfigMaps but designed for confidential content:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
data:
  username: YWRtaW4=          # base64-encoded "admin"
  password: cEBzc3cwcmQ=      # base64-encoded "p@ssw0rd"
```

The `data` field contains base64-encoded values. The `stringData` field contains plaintext values (Kubernetes encodes them for you):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
stringData:
  username: admin
  password: p@ssw0rd
```

**Important**: base64 is not encryption. It's encoding. Anyone with the base64 string can decode it. Kubernetes Secrets provide confidentiality only if:
1. etcd encryption at rest is enabled.
2. RBAC restricts who can read Secrets.
3. Secrets are not logged, committed to git, or exposed in pod specs.

### Secret Types

- **Opaque**: Generic key-value pairs (default type).
- **kubernetes.io/tls**: TLS certificate and key.
- **kubernetes.io/dockerconfigjson**: Docker registry credentials.
- **kubernetes.io/basic-auth**: Basic authentication credentials.
- **kubernetes.io/ssh-auth**: SSH private key.
- **bootstrap.kubernetes.io/token**: Bootstrap token for node joining.

### Creating Secrets

```bash
# From literal values
kubectl create secret generic db-credentials \
  --namespace=production \
  --from-literal=username=admin \
  --from-literal=password=p@ssw0rd

# From a file
kubectl create secret generic tls-secret \
  --namespace=production \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key

# From a directory (each file becomes a key)
kubectl create secret generic app-secrets \
  --namespace=production \
  --from-file=secrets/

# From a YAML manifest
kubectl apply -f secret.yaml
```

### Using Secrets

**As environment variables:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
```

**As volume mounts:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
spec:
  containers:
  - name: app
    image: my-app:latest
    volumeMounts:
    - name: db-secret
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: db-secret
    secret:
      secretName: db-credentials
```

The volume mount creates files at `/etc/secrets/username` and `/etc/secrets/password`.

**As projected volumes (with specific items and permissions):**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
spec:
  containers:
  - name: app
    image: my-app:latest
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    projected:
      sources:
      - secret:
          name: db-credentials
          items:
          - key: username
            path: db/username
          - key: password
            path: db/password
          mode: 0400
      - secret:
          name: tls-secret
          items:
          - key: tls.crt
            path: tls/tls.crt
          - key: tls.key
            path: tls/tls.key
            mode: 0400
```

### Secret Immutability

Once created, a Secret can be updated. For critical secrets (like TLS certificates), mark them as immutable to prevent accidental changes:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-cert
  namespace: production
type: kubernetes.io/tls
immutable: true
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

Immutable secrets can't be updated. To change them, delete and recreate the Secret (and restart any pods using it).

### Limitations of Kubernetes Secrets

1. **Stored in etcd as base64**: Not encrypted by default.
2. **No versioning**: Updating a Secret doesn't automatically update pods using it.
3. **No rotation**: No built-in mechanism for automatic rotation.
4. **Git-hostile**: Can't store Secrets in git (they're plaintext).
5. **No audit trail**: No built-in logging of Secret access.

These limitations are why most production deployments use external secret management.

## Enabling Encryption at Rest

By default, etcd stores Secrets as base64-encoded plaintext. Enable encryption at rest:

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
    - identity: {}  # fallback to plaintext (for reading old secrets)
```

Generate the encryption key:

```bash
head -c 32 /dev/urandom | base64
```

Apply to the API server:

```yaml
# Add to kube-apiserver manifest
- --encryption-provider-config=/etc/kubernetes/encryption-config.yaml
```

Restart the API server:

```bash
# Re-encrypt all existing secrets
kubectl get secrets --all-namespaces -o json | kubectl replace -f -
```

### Encryption Providers

Kubernetes supports several encryption providers:

- **aescbc**: AES-CBC encryption. Good balance of security and performance.
- **aesgcm**: AES-GCM encryption. Faster but no random access.
- **identity**: No encryption. Used as fallback for reading old secrets.
- **secretbox**: XSalsa20-Poly1305. Good performance but less widely audited.

### Key Rotation

Rotate encryption keys regularly:

```yaml
# Updated encryption config with new key
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key2
          secret: <new-base64-key>
    - aescbc:
        keys:
        - name: key1
          secret: <old-base64-key>
    - identity: {}
```

The first provider is used for encryption. The rest are tried for decryption. After rotating:
1. Add the new key as the first provider.
2. Re-encrypt all secrets.
3. Remove the old key.

## Sealed Secrets

Sealed Secrets is a Kubernetes controller that encrypts Secrets so they can be safely stored in git. The controller runs in your cluster and decrypts SealedSecrets into regular Secrets.

### How It Works

1. You use `kubeseal` to encrypt a Secret with the controller's public key.
2. The encrypted SealedSecret is stored in git.
3. When applied to the cluster, the controller decrypts it and creates a regular Secret.
4. Only the controller on your cluster can decrypt it.

### Installation

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -O kubeseal
chmod +x kubeseal
sudo mv kubeseal /usr/local/bin/
```

### Creating Sealed Secrets

```yaml
# db-credentials.yaml (regular Secret)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
stringData:
  username: admin
  password: p@ssw0rd
```

```bash
# Seal the secret
kubeseal --format yaml < db-credentials.yaml > sealed-db-credentials.yaml
```

Result:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
    password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
```

The SealedSecret can be committed to git. Only the controller on your cluster can decrypt it.

### Scope Restriction

By default, SealedSecrets are namespace-scoped. A SealedSecret in namespace `production` can only create a Secret in `production`. You can restrict further by name or disable cluster-wide access:

```bash
# Seal with strict scope (namespace + name)
kubeseal --format yaml --scope strict --name db-credentials < db-credentials.yaml > sealed-db-credentials.yaml

# Seal with namespace scope (namespace only)
kubeseal --format yaml --scope namespace-wide < db-credentials.yaml > sealed-db-credentials.yaml
```

### Rotation

To rotate a SealedSecret:
1. Generate a new key on the controller.
2. Re-encrypt the Secret with the new key.
3. Apply the updated SealedSecret.
4. Delete the old Secret (the controller recreates it).

```bash
# Check current sealing keys
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml

# Trigger key rotation
kubectl -n kube-system delete secret -l sealedsecrets.bitnami.com/sealed-secrets-key
```

### Limitations

- Sealed Secrets can't encrypt metadata (labels, annotations are visible).
- No built-in rotation: you must re-seal manually.
- The controller is a single point of failure (back up the signing key).
- Can't use with admission webhooks that modify Secrets.

## HashiCorp Vault Integration

HashiCorp Vault is a full-featured secrets management platform. It provides dynamic secrets, encryption as a service, PKI, and more. Kubernetes has native Vault integration.

### Vault on Kubernetes

```bash
# Install Vault using Helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --namespace vault \
  --create-namespace \
  --set server.dev.enabled=true \
  --set injector.enabled=true
```

### Vault Agent Injector

The Vault Agent Injector is a mutating admission webhook that injects Vault secrets into pods:

```yaml
# Deployment with Vault injection
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-client
  namespace: production
  labels:
    app: db-client
spec:
  replicas: 1
  selector:
    matchLabels:
      app: db-client
  template:
    metadata:
      labels:
        app: db-client
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/agent-inject-secret-db-creds: "database/creds/db-role"
        vault.hashicorp.com/agent-inject-template-db-creds: |
          {{- with secret "database/creds/db-role" -}}
          {
            "username": "{{ .Data.username }}",
            "password": "{{ .Data.password }}"
          }
          {{- end -}}
        vault.hashicorp.com/role: "db-role"
    spec:
      serviceAccountName: db-client
      containers:
      - name: app
        image: my-app:latest
        volumeMounts:
        - name: vault-secrets
          mountPath: /vault/secrets
          readOnly: true
      volumes:
      - name: vault-secrets
        emptyDir:
          medium: Memory
```

The injector automatically:
1. Detects the Vault annotations.
2. Injects an init container that authenticates to Vault.
3. Retrieves the secrets and writes them to `/vault/secrets/db-creds`.
4. Rotates secrets before they expire.

### Vault Kubernetes Auth

Vault uses Kubernetes service account tokens for authentication:

```bash
# Enable Kubernetes auth method
vault auth enable kubernetes

# Configure Kubernetes auth
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Create a role
vault write auth/kubernetes/role/db-role \
  bound_service_account_names=db-client \
  bound_service_account_namespaces=production \
  policies=db-policy \
  ttl=1h
```

### Dynamic Secrets

Vault can generate dynamic database credentials:

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/postgres \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb" \
  allowed_roles="db-role" \
  username="vault-admin" \
  password="vault-admin-password"

# Create a role that generates credentials
vault write database/roles/db-role \
  db_name=postgres \
  default_ttl="1h" \
  max_ttl="24h"
```

When a pod requests credentials, Vault generates a temporary username/password, stores it in Vault, and returns it to the pod. When the TTL expires, Vault revokes the credentials.

### Vault Policies

```hcl
# db-policy.hcl
path "database/creds/db-role" {
  capabilities = ["read"]
}

path "secret/data/production/*" {
  capabilities = ["read", "list"]
}
```

```bash
# Apply the policy
vault policy write db-policy db-policy.hcl
```

## External Secrets Operator

External Secrets Operator (ESO) syncs secrets from external providers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault) into Kubernetes Secrets.

### Installation

```bash
# Install ESO with Helm
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace
```

### AWS Secrets Manager

```yaml
# SecretStore.yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        secretRef:
          accessKeyIDSecretRef:
            name: aws-credentials
            key: access-key-id
          secretAccessKeySecretRef:
            name: aws-credentials
            key: secret-access-key
```

```yaml
# ExternalSecret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: production/db-credentials
      property: username
  - secretKey: password
    remoteRef:
      key: production/db-credentials
      property: password
```

ESO creates a Kubernetes Secret `db-credentials` with the values from AWS Secrets Manager. It refreshes every hour.

### GCP Secret Manager

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcp-secret-manager
  namespace: production
spec:
  provider:
    gcpsm:
      projectID: my-gcp-project
      auth:
        secretRef:
          secretAccessKeySecretRef:
            name: gcp-credentials
            key: credentials.json
```

### Azure Key Vault

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: azure-key-vault
  namespace: production
spec:
  provider:
    azurekv:
      tenantId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      vaultUrl: "https://my-vault.vault.azure.net"
      authType: ServicePrincipalSecret
      servicePrincipalRef:
        clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        secretRef:
          name: azure-sp-credentials
          key: clientSecret
```

### ClusterSecretStore

For sharing a SecretStore across namespaces:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        secretRef:
          accessKeyIDSecretRef:
            name: aws-credentials
            key: access-key-id
            namespace: external-secrets
          secretAccessKeySecretRef:
            name: aws-credentials
            key: secret-access-key
            namespace: external-secrets
```

## Real Scenario: Managing Secrets Across Environments

Let's build a complete secrets management system for a team with development, staging, and production environments.

### Architecture

- **Development**: Kubernetes Secrets (simple, no external dependencies)
- **Staging**: Sealed Secrets (git-safe, no external dependencies)
- **Production**: External Secrets Operator with AWS Secrets Manager (dynamic, auditable, rotatable)

### Step 1: Development Environment

```yaml
# dev-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: development
type: Opaque
stringData:
  username: dev-user
  password: dev-password
  host: dev-db.example.com
  port: "5432"
  database: devdb
```

```bash
kubectl apply -f dev-secrets.yaml
```

### Step 2: Staging Environment

```yaml
# staging-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: staging
type: Opaque
stringData:
  username: staging-user
  password: staging-password
  host: staging-db.example.com
  port: "5432"
  database: stagingdb
```

```bash
# Seal the secret
kubeseal --format yaml --scope strict --name db-credentials < staging-secret.yaml > sealed-staging-secret.yaml

# Commit to git
git add sealed-staging-secret.yaml
git commit -m "Add sealed staging db credentials"

# Apply to cluster
kubectl apply -f sealed-staging-secret.yaml
```

### Step 3: Production Environment

```yaml
# AWS Secrets Manager secret (created via AWS CLI)
aws secretsmanager create-secret \
  --name production/db-credentials \
  --secret-string '{
    "username": "prod-user",
    "password": "prod-password",
    "host": "prod-db.example.com",
    "port": "5432",
    "database": "proddb"
  }'

# ESO SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        secretRef:
          accessKeyIDSecretRef:
            name: aws-credentials
            key: access-key-id
          secretAccessKeySecretRef:
            name: aws-credentials
            key: secret-access-key
---
# ESO ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
    deletionPolicy: Retain
  data:
  - secretKey: username
    remoteRef:
      key: production/db-credentials
      property: username
  - secretKey: password
    remoteRef:
      key: production/db-credentials
      property: password
  - secretKey: host
    remoteRef:
      key: production/db-credentials
      property: host
  - secretKey: port
    remoteRef:
      key: production/db-credentials
      property: port
  - secretKey: database
    remoteRef:
      key: production/db-credentials
      property: database
```

### Step 4: Deployment Template

```yaml
# deployment-template.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      serviceAccountName: my-app-sa
      automountServiceAccountToken: false
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PORT
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: port
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database
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
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
```

### Step 5: Monitoring Secret Access

```bash
# Check ESO status
kubectl get externalsecrets -n production
kubectl describe externalsecret db-credentials -n production

# Check Sealed Secrets controller logs
kubectl -n kube-system logs -l app.kubernetes.io/name=sealed-secrets

# Audit Secret access
kubectl get events --field-selector reason=Get --all-namespaces | grep -i secret
```

### Step 6: Rotation Policy

```bash
# Rotate AWS Secrets Manager secret
aws secretsmanager rotate-secret --secret-id production/db-credentials

# Force ESO refresh
kubectl annotate externalsecret db-credentials -n production \
  force-sync="$(date +%s)" --overwrite

# Check new secret values
kubectl get secret db-credentials -n production -o jsonpath='{.data.password}' | base64 -d
```

## Common Pitfalls

### 1. Storing Secrets in Git

Never commit plain Secrets to git. Use Sealed Secrets or External Secrets Operator.

```bash
# Check for secrets in git history
git log --all -p | grep -i "password\|secret\|token" | head -20
```

### 2. Forgetting to Enable etcd Encryption

```bash
# Check if encryption is enabled
grep -r "encryption-provider-config" /etc/kubernetes/manifests/
```

### 3. Not Rotating Secrets

Set up a rotation policy. For AWS Secrets Manager, enable automatic rotation. For Sealed Secrets, rotate keys quarterly.

### 4. Overly Permissive RBAC

```bash
# Find all subjects that can read secrets
kubectl get clusterrolebindings -o json | jq -r '
  .items[] | 
  select(.roleRef.name == "cluster-admin" or 
         (.roleRef.name | test("secret"))) |
  .subjects[]? | 
  "\(.kind)/\(.name)"'
```

### 5. Logging Secrets

Ensure your application doesn't log secret values:

```bash
# Check application logs for leaked secrets
kubectl logs <pod> | grep -i "password\|secret\|token\|key"
```

### 6. Mounting Secrets as Environment Variables in Plain Text

When you mount a secret as an environment variable, the value appears in `kubectl describe pod` output. Use volume mounts instead:

```yaml
# Bad: visible in describe
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: password

# Good: not visible in describe
volumeMounts:
- name: db-secret
  mountPath: /etc/secrets
  readOnly: true
```

## Assessment

### Lab 1: Kubernetes Secrets (30 minutes)

1. Create a Secret with database credentials using both `data` and `stringData` fields.
2. Mount the Secret as an environment variable and as a volume in a pod.
3. Verify the Secret is accessible in the pod.
4. Enable encryption at rest for Secrets.
5. Re-encrypt existing Secrets and verify the encryption.

**Grading**: 10 points. 2 points per task. Full credit for correct Secret creation, mounting, and encryption.

### Lab 2: Sealed Secrets (45 minutes)

1. Install the Sealed Secrets controller and kubeseal CLI.
2. Create a Secret, seal it with kubeseal, and apply it to the cluster.
3. Verify the SealedSecret creates a regular Secret in the target namespace.
4. Rotate the sealing keys and re-encrypt the SealedSecret.
5. Test namespace-scoped SealedSecrets.

**Grading**: 15 points. 3 points per task. Full credit for correct installation, sealing, and rotation.

### Lab 3: External Secrets Operator (45 minutes)

1. Install ESO and configure a SecretStore for AWS Secrets Manager.
2. Create an ExternalSecret that syncs from AWS Secrets Manager to a Kubernetes Secret.
3. Verify the Secret is created and updated.
4. Update the AWS secret and verify the Kubernetes Secret refreshes.
5. Configure a SecretStore for a second provider (GCP or Azure) and repeat the process.

**Grading**: 15 points. 3 points per task. Full credit for correct ESO setup, working sync, and cross-provider configuration.

## Evidence

Submit the following as proof of completion:

1. Secret YAML files for all scenarios
2. Sealed Secret files and sealing process
3. ESO SecretStore and ExternalSecret configurations
4. Encryption at rest configuration
5. Secret rotation test results
