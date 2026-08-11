#!/usr/bin/env python3
"""Add Container Orchestration lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Container Orchestration

### Learning Objectives
- Understand Kubernetes architecture for web applications
- Deploy applications using Kubernetes manifests
- Configure Ingress controllers for HTTP routing
- Implement horizontal pod autoscaling

### Section 1: Kubernetes Architecture

```
Master Node: API Server, etcd, Scheduler, Controller Manager
Worker Nodes: kubelet, kube-proxy, Container Runtime
```

**Key Resources:**
- **Pod**: Smallest deployable unit, one or more containers
- **Deployment**: Manages pod replicas and updates
- **Service**: Stable network endpoint for pods
- **Ingress**: HTTP/HTTPS routing rules

### Section 2: Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

### Section 3: Service and Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - example.com
    secretName: example-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
```

### Section 4: Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Section 5: Useful Commands

```bash
# Deploy and check
kubectl apply -f deployment.yaml
kubectl get pods -n production
kubectl describe pod <pod-name> -n production

# Scale manually
kubectl scale deployment web-app --replicas=5 -n production

# Logs and debugging
kubectl logs -f deployment/web-app -n production
kubectl exec -it <pod-name> -n production -- /bin/bash

# Update and rollback
kubectl set image deployment/web-app nginx=nginx:1.26 -n production
kubectl rollout undo deployment/web-app -n production
```

### Key Takeaways
- Kubernetes provides automated deployment, scaling, and management
- Deployments manage pod replicas and rolling updates
- Services provide stable networking for pods
- Ingress controllers handle HTTP/HTTPS routing and SSL termination
- HPA automatically scales based on CPU/memory usage

### References
1. [Kubernetes Documentation](https://kubernetes.io/docs/)
2. [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
3. [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)"""

questions = [
    {"text": "What is the smallest deployable unit in Kubernetes?", "answers": [
        {"text": "Container", "isCorrect": False},
        {"text": "Pod", "isCorrect": True},
        {"text": "Node", "isCorrect": False},
        {"text": "Cluster", "isCorrect": False}
    ]},
    {"text": "What Kubernetes resource provides stable network access to pods?", "answers": [
        {"text": "Deployment", "isCorrect": False},
        {"text": "ConfigMap", "isCorrect": False},
        {"text": "Service", "isCorrect": True},
        {"text": "Volume", "isCorrect": False}
    ]},
    {"text": "What does HPA stand for in Kubernetes?", "answers": [
        {"text": "High Performance Allocation", "isCorrect": False},
        {"text": "Horizontal Pod Autoscaler", "isCorrect": True},
        {"text": "High Priority Application", "isCorrect": False},
        {"text": "Host Path Access", "isCorrect": False}
    ]},
    {"text": "What command rolls back a Kubernetes deployment?", "answers": [
        {"text": "kubectl rollback deployment/web-app", "isCorrect": False},
        {"text": "kubectl rollout undo deployment/web-app", "isCorrect": True},
        {"text": "kubectl undo deployment/web-app", "isCorrect": False},
        {"text": "kubectl revert deployment/web-app", "isCorrect": False}
    ]},
    {"text": "What Kubernetes resource handles HTTP/HTTPS routing?", "answers": [
        {"text": "Service", "isCorrect": False},
        {"text": "Pod", "isCorrect": False},
        {"text": "Ingress", "isCorrect": True},
        {"text": "ConfigMap", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Container Orchestration", "order": 3, "lab": "undefined",
    "content": content, "questions": questions
}
data["courses"][0]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Container Orchestration lesson")
