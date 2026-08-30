# Module 6 — Container Security: ECR, ECS, and EKS

## What You'll Actually Do

You'll scan container images for vulnerabilities in ECR, configure ECS task definitions with minimal permissions, and harden an EKS cluster. Containers expand your attack surface fast — every image is a potential entry point, and every container runtime is a potential escape.

## Image Security — ECR Scanning

Every container image is a full filesystem with a full attack surface. Scanning isn't optional.

```bash
# Create a private ECR repository
aws ecr create-repository \
  --repository-name my-app \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=KMS

# Enable enhanced scanning (uses both Amazon Inspector and Clair)
aws ecr put-registry-scanning-configuration \
  --scan-type ENHANCED \
  --rules '[
    {
      "scanFrequency": "SCAN_ON_PUSH",
      "filter": "*",
      "destinationFilters": ["DEFAULT"]
    }
  ]'

# Check scan results
aws ecr describe-image-scan-findings \
  --repository-name my-app \
  --image-id imageTag=latest
```

### Building Secure Images

```dockerfile
# Bad - running as root with everything installed
FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl wget vim
COPY . /app
CMD ["/app/start.sh"]

# Good - minimal image, non-root user, no shell
FROM gcr.io/distroless/java17-debian12
COPY --chown=nonroot:nonroot app.jar /app/app.jar
USER nonroot
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Key principles:
- Use minimal base images (distroless, alpine, scratch)
- Never run as root
- Pin specific versions, not `latest`
- Don't install unnecessary tools
- Use multi-stage builds

## ECS Security

ECS task definitions control what your containers can access.

```json
{
  "family": "secure-app",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsAppTaskRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "essential": true,
      "readonlyRootFilesystem": true,
      "privileged": false,
      "user": "1000:1000",
      "seccompProfile": {
        "type": "RuntimeDefault"
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/secure-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

The `taskRoleArn` is the IAM role the container assumes. Don't give it more than it needs. The `executionRoleArn` is what ECS uses to pull images and write logs.

## EKS Security — Kubernetes Hardening

Kubernetes adds another layer of complexity. Every pod is a potential attacker foothold.

### Pod Security Standards

```yaml
# Enforce restricted pod security
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### Network Policies

```yaml
# Deny all ingress by default, then allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
# Allow only the frontend to talk to the backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
```

### RBAC

```yaml
# Least privilege RBAC for a service account
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: app-reader
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-reader-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: app-service-account
roleRef:
  kind: Role
  name: app-reader
  apiGroup: rbac.authorization.k8s.io
```

## Lab Task — Secure a Container Pipeline

1. **Image Scan** — Push 3 container images to ECR (one with known vulnerabilities, one minimal, one with a secret baked in). Document scan results for each.

2. **ECS Hardening** — Write a task definition for a web application that follows security best practices:
   - Non-root user
   - Read-only root filesystem
   - No privileged mode
   - CloudWatch logging enabled
   - Minimal task role

3. **EKS Network Policy** — If EKS is available: Deploy the frontend/backend app and create network policies that allow only the frontend to reach the backend. Test by trying to curl the backend directly from a different pod.

4. **Fix** — Take the vulnerable image, rebuild it with a minimal base, rescan, and document the improvement.

**Time:** 60 minutes

**Grading (10 points):**
- 3 points: ECR scan results documented for all 3 images
- 3 points: ECS task definition follows security best practices
- 2 points: EKS network policies correctly restrict traffic
- 2 points: Vulnerable image rebuilt and rescanned

**Evidence:** ECR scan reports, task definition JSON, EKS network policy YAMLs, before/after scan comparisons.
