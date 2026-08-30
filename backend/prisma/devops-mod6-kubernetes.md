# Module 6 — Kubernetes Fundamentals

**Course:** DevOps & Platform Engineering | **Path:** DevOps (6 of 10)

---

## What You'll Actually Do

You'll deploy, scale, and manage applications on Kubernetes. Not just `kubectl apply` — understanding how it actually works.

---

## Kubernetes Objects

**Pod:** Smallest deployable unit (one or more containers)
**Deployment:** Manages ReplicaSets, rolling updates
**Service:** Stable network endpoint for pods
**Ingress:** HTTP routing to services
**ConfigMap/Secret:** Configuration data
**PersistentVolume:** Storage

---

## Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

---

## Scaling

```bash
# Manual
kubectl scale deployment myapp --replicas=5

# Autoscaling
kubectl autoscale deployment myapp --min=2 --max=10 --cpu-percent=80
```

---

## Essential Commands

```bash
# Get resources
kubectl get pods,svc,deploy

# Describe (debug)
kubectl describe pod myapp-xyz

# Logs
kubectl logs -f myapp-xyz

# Exec into pod
kubectl exec -it myapp-xyz -- /bin/sh

# Apply/delete
kubectl apply -f deployment.yaml
kubectl delete -f deployment.yaml
```

---

## Assessment

**Lab task (25 min):**

1. Deploy an application with a Deployment
2. Create a Service to expose it
3. Scale the deployment
4. Update the image (rolling update)
5. Debug a failing pod

**Grading:**
- Deployment created: 20%
- Service working: 20%
- Scaling tested: 15%
- Update tested: 20%
- Debug completed: 25%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO6 — Kubernetes Fundamentals`
