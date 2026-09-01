# Module 6 — Container Image Security

A container image is the starting point of every running container. If the image contains vulnerabilities, malware, or misconfigurations, every pod running that image inherits those problems. Container image security means ensuring that only verified, scanned, and signed images run in your cluster. This module covers image scanning with Trivy and Clair, image signing with Cosign, registry security, admission controllers, and the practical implementation of image policy enforcement.

## The Problem: Why Image Security Matters

A container image is a tarball of layers. Each layer is a filesystem snapshot. An image might contain:
- An operating system base (Ubuntu, Alpine, Debian)
- Application runtime (Node.js, Python, Java)
- Application code
- Configuration files
- System libraries
- OpenSSL, glibc, and other shared libraries

Every library in that image could have known vulnerabilities (CVEs). The base image might have hundreds of packages, each with its own version and vulnerability history. Running an unscanned image in production is like deploying unpatched software — except you don't even know what's in it.

Common issues:
- **Known CVEs**: The base image uses an old version of OpenSSL with known vulnerabilities.
- **Secrets baked in**: A developer hardcodes an API key in the Dockerfile and pushes the image to the registry.
- **Malicious images**: An attacker pushes a modified image to a public registry.
- **Supply chain attacks**: A dependency in the image is compromised (like the SolarWinds attack).
- **Misconfigured images**: The image runs as root, has unnecessary capabilities, or includes debugging tools.
- **Unmaintained images**: Images that haven't been updated in years accumulate vulnerabilities.
- **Transitive dependencies**: A Python package might pull in 50 other packages, each with their own vulnerabilities.

## Image Scanning

### Trivy

Trivy is an open-source vulnerability scanner by Aqua Security. It scans container images, filesystems, git repositories, and Kubernetes clusters for vulnerabilities, misconfigurations, secrets, and license issues.

**Installation:**

```bash
# Install Trivy
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# Or install via script
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

**Scanning an image:**

```bash
# Scan for vulnerabilities
trivy image nginx:1.25

# Scan with severity filter
trivy image --severity HIGH,CRITICAL nginx:1.25

# Scan with specific output format
trivy image --format json --output results.json nginx:1.25

# Scan local image
trivy image --input my-app.tar

# Scan image in registry
trivy image registry.example.com/my-app:v1.0.0

# Scan with skip-dirs (ignore test directories)
trivy image --skip-dirs "/test" --skip-dirs "/docs" my-app:latest

# Scan and only show fixed vulnerabilities
trivy image --ignore-unfixed nginx:1.25
```

**Trivy output example:**

```
nginx:1.25 (debian 12.4)
Total: 245 (UNKNOWN: 0, LOW: 120, MEDIUM: 95, HIGH: 28, CRITICAL: 2)

┌──────────────────────────┬──────────────┬──────────┬────────────────────┬───────────────┬──────────────────────────────────┐
│         Library          │ Vulnerability │ Severity │  Installed Version │ Fixed Version │              Title               │
├──────────────────────────┼──────────────┼──────────┼────────────────────┼───────────────┼──────────────────────────────────┤
│ libssl3                  │ CVE-2024-XXX │ CRITICAL │ 3.0.11-1~deb12u1   │ 3.0.13-1~...  │ OpenSSL: ...                     │
│ libc6                    │ CVE-2024-YYY │ HIGH     │ 2.36-9+deb12u4     │ 2.36-9+...    │ glibc: ...                       │
└──────────────────────────┴──────────────┴──────────┴────────────────────┴───────────────┴──────────────────────────────────┘
```

**Trivy in CI/CD:**

```yaml
# .github/workflows/image-scan.yaml
name: Image Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Build image
      run: docker build -t my-app:${{ github.sha }} .
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: my-app:${{ github.sha }}
        format: table
        exit-code: 1  # Fail on any vulnerability
        severity: CRITICAL,HIGH
        ignore-unfixed: true
    
    - name: Run Trivy config scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: config
        scan-ref: .
        format: table
        exit-code: 1
        severity: CRITICAL,HIGH
```

**Trivy in GitLab CI:**

```yaml
# .gitlab-ci.yml
trivy-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  allow_failure: false
```

### Clair

Clair is an open-source vulnerability scanner by Quay/Red Hat. It's designed for static analysis of container images. Quay.io uses Clair under the hood.

**Installation:**

```bash
# Run Clair with Docker Compose
git clone https://github.com/quay/clair.git
cd clair/contrib/compose
docker compose up -d
```

**Scanning with Clair:**

```bash
# Analyze image with clair-scanner
clair-scanner --ip <scanner-ip> nginx:1.25
```

Clair works differently from Trivy. It builds a database of CVEs from various sources (OS distributions, NVD) and matches package versions against known vulnerabilities. Trivy is simpler to use and covers more ecosystems.

### Scanning in the Cluster

Run Trivy as a Kubernetes Job to scan all images in the cluster:

```yaml
# trivy-scanner-job.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: trivy-image-scanner
  namespace: security
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: trivy-scanner
          containers:
          - name: trivy
            image: aquasec/trivy:latest
            command:
            - /bin/sh
            - -c
            - |
              # Get all images in use
              IMAGES=$(kubectl get pods --all-namespaces -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u)
              
              FAIL=0
              for image in $IMAGES; do
                echo "Scanning $image..."
                RESULT=$(trivy image --severity HIGH,CRITICAL --exit-code 0 --format json "$image" > "/results/$(echo $image | tr '/:' '_').json" 2>&1)
                if [ $? -ne 0 ]; then
                  echo "FAILED: $image has critical vulnerabilities"
                  FAIL=1
                fi
              done
              
              if [ $FAIL -eq 1 ]; then
                echo "Critical vulnerabilities found!"
                exit 1
              fi
              
              echo "Scan complete. Results in /results/"
            volumeMounts:
            - name: results
              mountPath: /results
          restartPolicy: Never
          volumes:
          - name: results
            emptyDir: {}
```

### Scanning Admission Controller

Use Trivy as a validating admission controller to block vulnerable images:

```yaml
# trivy-operator-values.yaml
trivy:
  severity: "HIGH,CRITICAL"
  ignoreUnfixed: true

operator:
  scanJobTimeout: 10m
  scanConcurrentLimit: 5
```

```bash
# Install Trivy Operator
helm install trivy-operator aquasecurity/trivy-operator \
  --namespace trivy-system \
  --create-namespace \
  -f trivy-operator-values.yaml
```

The Trivy Operator automatically scans all images in the cluster and creates VulnerabilityAudit resources. You can use these with OPA/Gatekeeper to block vulnerable images.

### Image Scanning Comparison

| Feature | Trivy | Clair |
|---------|-------|-------|
| Ease of use | Excellent | Moderate |
| Language support | Multi-language | OS packages only |
| Speed | Fast | Moderate |
| Kubernetes integration | Excellent (Operator) | Limited |
| CVE database | NVD, GitHub Advisories | NVD, distribution-specific |
| Config scanning | Yes | No |
| Secret scanning | Yes | No |

## Image Signing

Image scanning finds known vulnerabilities. Image signing proves that an image was built by a specific builder and hasn't been tampered with.

### Cosign

Cosign is a tool for signing, verifying, and storing container images. It's part of the Sigstore project.

**Installation:**

```bash
# Install Cosign
wget https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
chmod +x cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
```

**Generate a key pair:**

```bash
# Generate key pair (interactive)
cosign generate-key-pair

# Or with environment variable
COSIGN_PASSWORD=$(openssl rand -base64 32) cosign generate-key-pair
```

This creates `cosign.key` (private) and `cosign.pub` (public).

**Sign an image:**

```bash
# Sign with key pair
cosign sign --key cosign.key registry.example.com/my-app:v1.0.0

# Sign with keyless (using Fulcio certificate)
cosign sign registry.example.com/my-app:v1.0.0
```

**Verify an image:**

```bash
# Verify with public key
cosign verify --key cosign.pub registry.example.com/my-app:v1.0.0

# Verify keyless signature
cosign verify --certificate-identity=developer@example.com \
  --certificate-oidc-issuer=https://accounts.google.com \
  registry.example.com/my-app:v1.0.0
```

**Sign and scan in CI/CD:**

```yaml
# .github/workflows/sign-and-scan.yaml
name: Build, Scan, and Sign
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Build and push
      run: |
        docker build -t registry.example.com/my-app:${{ github.sha }} .
        docker push registry.example.com/my-app:${{ github.sha }}
    
    - name: Scan with Trivy
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: registry.example.com/my-app:${{ github.sha }}
        exit-code: 1
        severity: CRITICAL
    
    - name: Sign with Cosign
      uses: sigstore/cosign-installer@main
      with:
        cosign-release: 'v2.2.0'
    
    - name: Sign image
      env:
        COSIGN_KEY: ${{ secrets.COSIGN_KEY }}
        COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}
      run: |
        cosign sign --key env://COSIGN_KEY registry.example.com/my-app:${{ github.sha }}
```

### Keyless Signing (Sigstore)

Keyless signing uses short-lived certificates from Fulcio and stores signatures in Rekor transparency log. No keys to manage:

```bash
# Sign keylessly (requires OIDC identity)
cosign sign registry.example.com/my-app:v1.0.0

# Verify keyless signature
cosign verify \
  --certificate-identity=developer@example.com \
  --certificate-oidc-issuer=https://accounts.google.com \
  registry.example.com/my-app:v1.0.0

# Check Rekor transparency log
cosign verify --rekor-url https://rekor.sigstore.dev \
  registry.example.com/my-app:v1.0.0
```

### Supply Chain Security with Cosign

```bash
# Attach an SBOM to an image
cosign attach sbom --sbom sbom.json registry.example.com/my-app:v1.0.0

# Attach a scan result
cosign attach scan --scan trivy-results.json registry.example.com/my-app:v1.0.0

# Verify all attestations
cosign verify-attestation --key cosign.pub \
  --type spdxjson \
  registry.example.com/my-app:v1.0.0
```

## Registry Security

### Registry Configuration

Most image registries (Docker Hub, GCR, ECR, ACR, Harbor) support:
- **Authentication**: Username/password, tokens, OIDC.
- **Authorization**: Role-based access control.
- **Vulnerability scanning**: Built-in scanning (GCR, ECR, Harbor).
- **Image signing**: Integration with Cosign or Notary.

### Harbor Registry

Harbor is an open-source registry with built-in vulnerability scanning, image signing, and RBAC:

```bash
# Install Harbor with Helm
helm repo add harbor https://helm.goharbor.io
helm install harbor harbor/harbor \
  --namespace harbor \
  --create-namespace \
  --set expose.type=ingress \
  --set expose.ingress.hosts.core=harbor.example.com \
  --set persistence.enabled=true \
  --set persistence.persistentVolumeClaimSize=50Gi
```

Harbor features:
- **Vulnerability scanning**: Clair-based scanning on push.
- **Content trust**: Notary/Cosign integration.
- **RBAC**: Project-level access control.
- **Immutability**: Prevent tag overwriting.
- **Replication**: Sync images between registries.
- **Webhook integration**: Notify external systems on push/scanning events.

### Registry Access Control

```yaml
# Restrict registry access with RBAC
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: image-pusher
  namespace: ci-cd
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: image-pusher-binding
  namespace: ci-cd
subjects:
- kind: ServiceAccount
  name: ci-cd-sa
  namespace: ci-cd
roleRef:
  kind: Role
  name: image-pusher
  apiGroup: rbac.authorization.k8s.io
```

## Admission Controllers

Admission controllers intercept requests to the Kubernetes API server before the object is persisted. They can validate, modify, or reject requests.

### Image Policy Webhook

The ImagePolicyWebhook admission controller allows you to define an external webhook that decides which images are allowed:

```yaml
# /etc/kubernetes/admission-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: ImagePolicyWebhook
  configuration:
    apiVersion: imagepolicy.admission.k8s.io/v1alpha1
    kind: ImagePolicyConfiguration
    kubeConfigFile: /etc/kubernetes/webhook-imagepolicy.yaml
    defaultAllow: false
```

```yaml
# /etc/kubernetes/webhook-imagepolicy.yaml
apiVersion: v1
kind: Config
clusters:
- name: image-policy-webhook
  certificate-authority: /etc/kubernetes/pki/image-policy-ca.crt
  server: https://image-policy-webhook.example.com:8443/policy
users:
- name: kube-apiserver
  user:
    client-certificate: /etc/kubernetes/pki/apiserver-webhook-client.crt
    client-key: /etc/kubernetes/pki/apiserver-webhook-client.key
```

### OPA/Gatekeeper for Image Policies

OPA/Gatekeeper provides a more flexible approach using Rego policies:

```yaml
# constraint-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedregistries
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRegistries
      validation:
        openAPIV3Schema:
          type: object
          properties:
            registries:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sallowedregistries
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not startswith(container.image, input.parameters.registries[_])
          msg := sprintf("Container %v uses image %v which is not from an allowed registry", [container.name, container.image])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          not startswith(container.image, input.parameters.registries[_])
          msg := sprintf("Init container %v uses image %v which is not from an allowed registry", [container.name, container.image])
        }
```

```yaml
# constraint.yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRegistries
metadata:
  name: allowed-registries
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
  parameters:
    registries:
    - "registry.example.com/"
    - "docker.io/library/"
    - "gcr.io/my-project/"
```

### Image Signature Verification with Gatekeeper

```yaml
# constraint-template.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8simagesigned
spec:
  crd:
    spec:
      names:
        kind: K8sImageSigned
      validation:
        openAPIV3Schema:
          type: object
          properties:
            cosignPublicKey:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8simagesigned
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not verify_signature(container.image, input.parameters.cosignPublicKey)
          msg := sprintf("Container %v uses unsigned image %v", [container.name, container.image])
        }
```

## Real Scenario: Implementing Image Policy Enforcement

Let's build a complete image policy enforcement system for a production cluster.

### Step 1: Configure Allowed Registries

```yaml
# allowed-registries-constraint.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedregistries
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRegistries
      validation:
        openAPIV3Schema:
          type: object
          properties:
            registries:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sallowedregistries
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          image := container.image
          not startswith(image, input.parameters.registries[_])
          msg := sprintf("Container '%v' image '%v' is not from an allowed registry. Allowed: %v", [container.name, image, input.parameters.registries])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          image := container.image
          not startswith(image, input.parameters.registries[_])
          msg := sprintf("Init container '%v' image '%v' is not from an allowed registry", [container.name, image])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRegistries
metadata:
  name: production-allowed-registries
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaces:
    - production
    - staging
  parameters:
    registries:
    - "registry.example.com/"
    - "docker.io/library/"
```

### Step 2: Block `latest` Tag

```yaml
# no-latest-tag-constraint.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8snolatest
spec:
  crd:
    spec:
      names:
        kind: K8sNoLatest
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8snolatest
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          endswith(container.image, ":latest")
          msg := sprintf("Container '%v' uses ':latest' tag. Use a specific version.", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not contains(container.image, ":")
          msg := sprintf("Container '%v' has no tag. Use a specific version.", [container.name])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sNoLatest
metadata:
  name: no-latest-tag
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaces:
    - production
```

### Step 3: Require Image Digests in Production

```yaml
# require-digest-constraint.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredigest
spec:
  crd:
    spec:
      names:
        kind: K8sRequireDigest
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredigest
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not contains(container.image, "@sha256:")
          msg := sprintf("Container '%v' image '%v' must use a digest for immutability", [container.name, container.image])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireDigest
metadata:
  name: require-digest-production
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    namespaces:
    - production
```

### Step 4: Scan Images Before Deployment

```yaml
# scan-before-deploy.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pre-deploy-scan
  namespace: security
spec:
  schedule: "*/30 * * * *"  # Every 30 minutes
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: trivy-scanner
          containers:
          - name: scanner
            image: aquasec/trivy:latest
            command:
            - /bin/sh
            - -c
            - |
              # Get all unique images in production
              IMAGES=$(kubectl get pods -n production -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u)
              
              FAIL=0
              for image in $IMAGES; do
                echo "Scanning $image..."
                RESULT=$(trivy image --severity CRITICAL,HIGH --exit-code 1 "$image" 2>&1)
                if [ $? -ne 0 ]; then
                  echo "FAILED: $image has critical vulnerabilities"
                  echo "$RESULT"
                  FAIL=1
                fi
              done
              
              if [ $FAIL -eq 1 ]; then
                echo "Critical vulnerabilities found!"
                exit 1
              fi
              
              echo "All images pass security scan"
          restartPolicy: Never
```

### Step 5: Sign Production Images

```bash
# Sign production images
cosign sign --key cosign.key registry.example.com/my-app:v1.0.0

# Verify before deployment
cosign verify --key cosign.pub registry.example.com/my-app:v1.0.0
```

### Step 6: Audit and Monitor

```bash
# Check Gatekeeper constraint violations
kubectl get constraints
kubectl describe k8sallowedregistries production-allowed-registries

# Check image scan results
kubectl get vulnerabilityaudits --all-namespaces

# List all images in use
kubectl get pods --all-namespaces -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u | wc -l
```

## Assessment

### Lab 1 — Image Scanning (30 minutes)

1. Install Trivy and scan 5 different images. Record the vulnerability counts for each.
2. Identify the image with the most CRITICAL vulnerabilities and find a fix (updated base image).
3. Write a CI pipeline that scans images and fails on CRITICAL vulnerabilities.
4. Set up a Trivy Operator in the cluster and check the VulnerabilityAudit results.
5. Scan a Dockerfile for misconfigurations using Trivy config scanning.

**Grading**: 10 points. 2 points per task. Full credit for correct scanning, accurate results, and working pipeline.

### Lab 2 — Image Signing (45 minutes)

1. Generate a Cosign key pair.
2. Build, push, and sign an image.
3. Verify the signed image.
4. Attempt to deploy an unsigned image and verify it fails.
5. Set up keyless signing with Fulcio/Rekor.

**Grading**: 15 points. 3 points per task. Full credit for correct signing, verification, and keyless setup.

### Lab 3 — Image Policy Enforcement (45 minutes)

1. Install Gatekeeper and deploy the allowed registries constraint.
2. Deploy the no-latest-tag constraint.
3. Deploy the require-digest constraint.
4. Test all constraints with compliant and non-compliant pods.
5. Write a comprehensive image policy document for a production cluster.

**Grading**: 15 points. 3 points per task. Full credit for correct constraint deployment, accurate testing, and comprehensive policy.

## Evidence

Submit the following as proof of completion:

1. Trivy scan reports for all images
2. CI pipeline configuration for image scanning
3. Cosign key pair and signed images
4. Gatekeeper constraint templates and constraints
5. Test results for all policy enforcement
6. Image policy document
