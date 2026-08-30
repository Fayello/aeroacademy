# Module 6 — Container Image Security

## What You'll Actually Do

You'll set up image scanning in your CI pipeline, implement image signing with Cosign, configure registry security policies, and ensure only verified images run in your cluster. This is about preventing supply chain attacks at the image level.

## Core Concepts

### The Image Supply Chain Problem

Every container image is a stack of layers. Each layer can contain vulnerabilities, malware, or backdoors. If you pull an image without checking, you're trusting:
- The base image maintainer
- The package repositories it pulls from
- The build process that created it
- The registry that stores it

### Image Scanning

Scanning tools analyze images for known vulnerabilities (CVEs) in packages and dependencies.

- **Trivy**: Fast, comprehensive, supports container images, filesystems, and git repos
- **Grype**: Sibling project to Syft, focuses on vulnerability matching
- **Snyk**: Commercial with open-source tier, good developer experience

```bash
# Scan an image with Trivy
trivy image nginx:1.25

# Scan with severity filter
trivy image --severity HIGH,CRITICAL nginx:1.25

# Scan and exit with error if vulnerabilities found
trivy image --exit-code 1 --severity CRITICAL nginx:1.25

# Scan a local image
docker build -t myapp:1.0 .
trivy image myapp:1.0
```

### Image Signing with Cosign

Cosign (from Sigstore) signs container images so you can verify they haven't been tampered with.

```bash
# Install Cosign
curl -sL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o cosign
chmod +x cosign && sudo mv cosign /usr/local/bin/

# Generate a key pair
cosign generate-key-pair

# Sign an image
cosign sign --key cosign.key myregistry.io/myapp:1.0

# Verify a signature
cosign verify --key cosign.pub myregistry.io/myapp:1.0

# Sign with keyless (OIDC-based, no key management)
cosign sign myregistry.io/myapp:1.0
cosign verify myregistry.io/myapp:1.0
```

### Admission Control for Images

Use OPA Gatekeeper or Kyverno to enforce image policies:

```yaml
# Kyverno policy — require signed images
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-signature
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-image-signature
    match:
      any:
      - resources:
          kinds:
          - Pod
    verifyImages:
    - imageReferences:
      - "myregistry.io/*"
      attestors:
      - entries:
        - keys:
            publicKeys: |-
              -----BEGIN PUBLIC KEY-----
              MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
              -----END PUBLIC KEY-----
```

### Image Pull Secrets

Private registries require authentication:

```bash
# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.io \
  --docker-username=deployer \
  --docker-password=$REGISTRY_PASSWORD \
  --docker-email=deployer@company.com

# Use in pod spec
kubectl run private-app --image=myregistry.io/myapp:1.0 \
  --overrides='{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}'
```

### Registry Security

- Enable TLS on all registries
- Use token-based authentication (not basic auth)
- Enable vulnerability scanning at push time
- Implement retention policies to clean old images
- Use immutable tags (never overwrite `:latest`)

## Hands-On Lab

### Task 1: Set Up Trivy for Image Scanning

```bash
# Install Trivy
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update && sudo apt-get install trivy

# Scan a public image
trivy image nginx:1.25

# Scan with output format for CI
trivy image --format json --output trivy-report.json nginx:1.25

# Create a scan script
cat > scan-image.sh << 'EOF'
#!/bin/bash
IMAGE=$1
RESULT=$(trivy image --exit-code 1 --severity CRITICAL,HIGH --format json "$IMAGE" 2>/dev/null)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "FAIL: $IMAGE has critical/high vulnerabilities"
    echo "$RESULT" | jq '.Results[].Vulnerabilities[] | {VulnerabilityID, Severity, PkgName, InstalledVersion, FixedVersion}'
    exit 1
else
    echo "PASS: $IMAGE is clean"
    exit 0
fi
EOF
chmod +x scan-image.sh
```

### Task 2: Scan Multiple Images and Generate Report

```bash
# Scan a list of images
IMAGES="nginx:1.25 redis:7-alpine postgres:15-alpine python:3.12-slim"

echo "# Image Security Scan Report" > scan-report.md
echo "Generated: $(date)" >> scan-report.md
echo "" >> scan-report.md

for IMAGE in $IMAGES; do
    echo "Scanning $IMAGE..."
    echo "## $IMAGE" >> scan-report.md
    trivy image --severity HIGH,CRITICAL "$IMAGE" 2>/dev/null | tail -20 >> scan-report.md
    echo "" >> scan-report.md
done

cat scan-report.md
```

### Task 3: Sign Images with Cosign

```bash
# Generate key pair
cosign generate-key-pair

# Push your own image (use a test registry)
docker build -t myregistry.io/testapp:1.0 .
docker push myregistry.io/testapp:1.0

# Sign it
cosign sign --key cosign.key myregistry.io/testapp:1.0

# Verify the signature
cosign verify --key cosign.pub myregistry.io/testapp:1.0

# Try to verify with wrong key (should fail)
cosign verify --key wrong-key.pub myregistry.io/testapp:1.0
```

### Task 4: Enforce Image Policies in Kubernetes

```bash
# Install Kyverno
helm repo add kyverno https://kyverno.github.io/kyverno/
helm install kyverno kyverno/kyverno -n kyverno --create-namespace

# Apply a policy to require image scanning
cat > require-trivy-scan.yaml << 'EOF'
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-scan
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-image-vulnerabilities
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Images must be scanned and have no CRITICAL vulnerabilities"
      pattern:
        spec:
          containers:
          - image: "!*:latest && !*:unstable"
EOF

kubectl apply -f require-trivy-scan.yaml

# Test — this should fail (uses :latest tag)
kubectl run test-pod --image=nginx:latest

# Test — this should work
kubectl run test-pod --image=nginx:1.25
```

### Task 5: Set Up Image Pull Secrets

```bash
# Create pull secret for a private registry
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER \
  --docker-password=$GITHUB_TOKEN \
  --docker-email=$GITHUB_EMAIL

# Create a deployment that uses it
cat > private-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: private-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: private-app
  template:
    metadata:
      labels:
        app: private-app
    spec:
      imagePullSecrets:
      - name: regcred
      containers:
      - name: app
        image: ghcr.io/myorg/private-app:1.0
EOF

kubectl apply -f private-deployment.yaml
kubectl get pods -l app=private-app
```

## Assessment

**Lab Task**: Build a complete image security pipeline: scan 5 images, sign your own image, create an admission policy that blocks unsigned/unscanned images, and document the entire workflow.

**Time**: 50 minutes

**Grading** (100 points):
- Trivy installed and scanning images (20 pts)
- Scan report generated with findings (15 pts)
- Cosign key pair created and image signed (20 pts)
- Signature verification successful (15 pts)
- Admission policy blocks unsigned images (20 pts)
- Documentation of the complete pipeline (10 pts)

## Evidence

Save the following to your evidence folder:
1. `trivy-scan-results.json` — Trivy scan output for at least 3 images
2. `scan-report.md` — formatted scan report
3. `cosign-verification.txt` — output of cosign verify command
4. `admission-policy.yaml` — your Kyverno/OPA policy
5. `blocked-pod.txt` — evidence of a pod being blocked by the policy
