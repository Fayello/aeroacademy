# Module 6 — Kubernetes Fundamentals

## Why Kubernetes Exists

Docker solved the "works on my machine" problem. Docker Compose solved running multiple containers locally. But neither solved the problem of running containers reliably in production across multiple servers, with automatic scaling, self-healing, and rolling updates.

Kubernetes (K8s) is a container orchestration platform. It manages the lifecycle of containers across a cluster of machines. You tell Kubernetes what you want (3 replicas of the web server, 1 PostgreSQL instance, 2 Redis instances), and Kubernetes makes it happen. If a server dies, Kubernetes moves the containers to another server. If traffic spikes, Kubernetes adds more replicas. If a deployment fails, Kubernetes rolls it back.

Google created Kubernetes based on their internal system called Borg, which has been running production workloads since 2003. Google open-sourced Kubernetes in 2014, and it has become the standard for container orchestration. Every major cloud provider offers a managed Kubernetes service (EKS, GKE, AKS), and the ecosystem of tools around Kubernetes is massive.

## Architecture

Kubernetes has two types of nodes: the control plane (master) and worker nodes.

### Control Plane

The control plane is the brain of the cluster. It makes decisions about scheduling, scaling, and self-healing. The control plane has four components:

**etcd** — A distributed key-value store that stores all cluster state. Every pod, service, configuration, and secret is stored in etcd. If etcd loses data, the cluster loses its state. etcd uses the Raft consensus algorithm for consistency. You need an odd number of etcd nodes (3, 5, or 7) for quorum.

**kube-apiserver** — The front door to the cluster. All communication with the cluster goes through the API server: kubectl commands, dashboard requests, controller updates, and kubelet heartbeats. The API server validates and processes requests, then writes the desired state to etcd.

**kube-scheduler** — Decides which node runs each pod. It considers resource requirements, node capacity, affinity/anti-affinity rules, taints and tolerations, and data locality. The scheduler does not run pods — it assigns them to nodes. The kubelet on each node then runs the pod.

**kube-controller-manager** — Runs control loops that reconcile desired state with actual state. If you request 3 replicas and only 2 are running, the controller creates a new one. If a pod fails, the controller replaces it. There are many controllers: deployment, replicaset, node, service, and more.

### Worker Nodes

Worker nodes run the actual workloads. Each worker node has three components:

**kubelet** — An agent that runs on each node. It communicates with the control plane, receives pod specifications, and manages the container runtime. The kubelet reports node status, pod status, and resource usage back to the control plane.

**kube-proxy** — Maintains network rules on each node. It handles service discovery, load balancing, and network address translation. When a pod connects to a Service, kube-proxy routes the traffic to one of the Service's backing pods.

**Container runtime** — The software that runs containers. Docker was the original runtime, but Kubernetes now supports containerd, CRI-O, and other runtimes that implement the Container Runtime Interface (CRI). Most Kubernetes distributions use containerd.

```
┌─────────────────────────────────────────┐
│            Control Plane                │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │  etcd   │  │ kube-    │  │ kube-  │ │
│  │         │  │ apiserver│  │schedulr│ │
│  └─────────┘  └──────────┘  └────────┘ │
│            ┌──────────────┐             │
│            │kube-controller│            │
│            │   manager    │            │
│            └──────────────┘             │
└─────────────────────────────────────────┘
                    │
┌───────────────────┼─────────────────────┐
│         Worker Node 1                  │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ kubelet  │  │kube-proxy│  │runtime│ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
│         Worker Node 2                  │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ kubelet  │  │kube-proxy│  │runtime│ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
```

## Pods

A Pod is the smallest deployable unit in Kubernetes. It is one or more containers that share network namespace, storage, and a lifecycle. Most pods run a single container, but sidecar patterns use multiple containers in one pod (e.g., the application container plus a log collection container).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
    version: v1
spec:
  containers:
    - name: app
      image: my-app:1.0
      ports:
        - containerPort: 3000
      resources:
        requests:
          memory: "128Mi"
          cpu: "250m"
        limits:
          memory: "256Mi"
          cpu: "500m"
```

You almost never create pods directly. You create Deployments, which manage pods for you. The Deployment controller creates ReplicaSets, which create and manage pods. This indirection provides features like rolling updates, rollback, and scaling.

## Deployments

A Deployment manages the desired state for a set of pods. You declare how many replicas you want, which image to use, and how to update them. The Deployment controller ensures the actual state matches the desired state.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:1.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

The `replicas: 3` field tells Kubernetes to keep 3 pods running at all times. If a pod crashes, the Deployment creates a new one. If a node dies, the pods on that node are rescheduled to other nodes.

The `strategy` field controls how updates happen. `RollingUpdate` with `maxSurge: 1` and `maxUnavailable: 1` means Kubernetes can create one extra pod during the update and can have one pod unavailable. This ensures zero downtime during deployments.

## Services

Pods are ephemeral. They can be created, destroyed, and moved between nodes at any time. Pods do not have stable IP addresses. Services provide a stable network endpoint for a set of pods.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

The Service with `type: ClusterIP` is accessible only within the cluster. Pods connect to `my-app-service:80`, and the Service load-balances across all pods with label `app: my-app`.

Service types:
- **ClusterIP** — Internal only (default)
- **NodePort** — Exposes the Service on each node's IP at a static port
- **LoadBalancer** — Provisions an external load balancer (cloud providers)
- **ExternalName** — Maps the Service to a DNS name

## Ingress

Ingress manages external access to Services, typically HTTP. It provides routing rules, SSL termination, and name-based virtual hosting.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
```

The Ingress routes traffic based on the host and path. `app.example.com/` goes to `my-app-service`, and `app.example.com/api` goes to `api-service`. The TLS section configures SSL termination with a certificate from cert-manager.

## ConfigMaps and Secrets

ConfigMaps store non-sensitive configuration. Secrets store sensitive data (passwords, tokens, keys). Both are mounted as files or environment variables in pods.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: production
  LOG_LEVEL: info
  config.json: |
    {
      "features": {
        "darkMode": true,
        "analytics": true
      }
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: c3VwZXJzZWNyZXQxMjM=  # base64 encoded
  JWT_SECRET: bWVnYXNlY3JldA==  # base64 encoded
```

In a pod spec, reference ConfigMaps and Secrets:

```yaml
spec:
  containers:
    - name: app
      envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
      volumeMounts:
        - name: config-volume
          mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: app-config
```

ConfigMaps and Secrets can be used as environment variables or mounted as files. File mounting is preferred for configuration that changes at runtime because the kubelet updates the mounted files without restarting the pod.

## PersistentVolumes and PersistentVolumeClaims

Pods are ephemeral, but databases need persistent storage. PersistentVolumes (PVs) represent storage in the cluster. PersistentVolumeClaims (PVCs) are requests for storage by pods.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: gp3
```

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
```

The `volumeClaimTemplates` in a StatefulSet creates a PVC for each pod. The PVC binds to a PV, which provides the actual storage. When the pod is rescheduled, the new pod gets the same PVC and PV, preserving the data.

## Resource Limits and Requests

Every container should specify resource requests and limits. Requests tell Kubernetes how much CPU and memory the container needs. Limits tell Kubernetes the maximum the container can use.

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "250m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

- `cpu: "250m"` means 250 millicores (0.25 CPU cores). A node with 4 cores can run 16 containers requesting 250m each.
- `memory: "128Mi"` means 128 mebibytes (134 MB). The container is guaranteed at least 128 MiB of memory.

The QoS (Quality of Service) class is determined by the relationship between requests and limits:
- **Guaranteed** — requests equal limits for all containers. These pods are never killed unless they exceed their limits.
- **Burstable** — requests less than limits. These pods get their requests guaranteed and can burst up to limits. They are killed before Guaranteed pods when resources are scarce.
- **BestEffort** — no requests or limits. These pods get whatever resources are left. They are killed first when resources are scarce.

Always set requests and limits. Without them, a single pod can consume all node resources, starving other pods.

## Liveness and Readiness Probes

Probes tell Kubernetes whether a container is healthy and ready to receive traffic.

**Liveness probe** — Is the container alive? If the liveness probe fails, Kubernetes restarts the container. Use liveness probes to detect deadlocks, infinite loops, and other conditions where the process is running but not functioning.

**Readiness probe** — Is the container ready to serve traffic? If the readiness probe fails, Kubernetes removes the pod from the Service's endpoints. The pod continues running but does not receive traffic. Use readiness probes to detect when a container is starting up, loading configuration, or warming caches.

```yaml
containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

Common probe mistakes:
- Using the same endpoint for both liveness and readiness. If the database is down, the readiness probe should fail (remove from traffic) but the liveness probe should pass (do not restart).
- Setting `initialDelaySeconds` too low. The container might not be ready in 5 seconds.
- Not having a health endpoint at all. Kubernetes needs a way to check if the application is functioning.

## Horizontal Pod Autoscaler

HPA automatically scales the number of pod replicas based on CPU usage, memory usage, or custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

This HPA scales from 2 to 10 replicas. When average CPU usage exceeds 70%, it adds pods. When it drops below 70%, it removes pods. The `scaleDown.stabilizationWindowSeconds: 300` prevents thrashing by requiring the metric to stay below the target for 5 minutes before scaling down.

The `behavior` section is critical. Without it, HPA can scale up and down rapidly, causing instability. The `scaleUp` policy limits how many pods can be added per minute. The `scaleDown` policy limits how many pods can be removed per minute.

## Real Story: Debugging a Pod That Keeps Crashing

A team deployed a Node.js application to Kubernetes. The pod started, ran for about 30 seconds, then restarted. This cycle repeated indefinitely. The pod never became ready, so the Service never received traffic, and users saw 502 errors.

The first step was checking the pod status:

```bash
kubectl get pods
# NAME                     READY   STATUS    RESTARTS   AGE
# my-app-7d8f9b6c4-x2k9m  0/1     Error     5          2m30s
```

The `RESTARTS` count of 5 confirmed the pod was crashing. The `STATUS` of `Error` (not `CrashLoopBackOff`) suggested the container was exiting with a non-zero exit code.

Check the logs:

```bash
kubectl logs my-app-7d8f9b6c4-x2k9m
# Error: Cannot find module './config/database'
#     at Function.Module._resolveFilename (internal/modules/cjs/loader.js:815:15)
#     at Function.Module._load (internal/modules/cjs/loader.js:662:27)
```

The error was clear: the application could not find `./config/database`. The Dockerfile copied the compiled JavaScript but missed the config directory. The Dockerfile was:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

The `COPY dist ./dist` copied only the compiled output. The application's `dist/index.js` referenced `./config/database`, which existed in the source directory but not in the compiled `dist` directory. The build process (TypeScript compilation) should have copied it, but the `tsconfig.json` was missing the `copyFiles` option.

The fix was to add the config directory to the Dockerfile:

```dockerfile
COPY dist ./dist
COPY config ./config
```

But this was a band-aid. The real fix was updating `tsconfig.json` to copy config files during compilation:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  }
}
```

And updating the build script to copy JSON files:

```json
{
  "scripts": {
    "build": "tsc && cp -r src/config dist/config"
  }
}
```

The lesson: when debugging pod crashes, start with `kubectl logs`. The error message usually tells you exactly what is wrong. Common causes are missing files, incorrect environment variables, and database connection failures. The Kubernetes events (`kubectl describe pod <name>`) also provide useful information about why a pod was evicted or restarted.

## Kubernetes Networking

Kubernetes networking follows a flat model: every pod gets its own IP address, and pods can communicate with each other directly without NAT. This is different from Docker networking, where containers on different networks are isolated.

Key networking concepts:

**Pod-to-pod:** Every pod can reach every other pod using its IP address. This is the foundation of service mesh and microservices communication. Network policies control which pods can communicate with each other.

**Service-to-pod:** Services provide stable DNS names and IP addresses for a set of pods. When a pod connects to `my-service`, Kubernetes load-balances across all pods with the matching label.

**Ingress-to-service:** Ingress resources route external HTTP traffic to Services. The ingress controller (usually nginx) handles SSL termination, path-based routing, and host-based routing.

**Network Policies:** Network policies control traffic flow between pods. By default, all pods can communicate with all other pods. Network policies restrict this:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-only-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 3000
```

This policy allows only pods with label `app: frontend` to connect to pods with label `app: backend` on port 3000. All other traffic is blocked.

## Kubernetes Storage

Kubernetes abstracts storage through PersistentVolumes (PVs) and PersistentVolumeClaims (PVCs). Storage classes define the types of storage available:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
reclaimPolicy: Retain
allowVolumeExpansion: true
```

The StorageClass `fast` uses AWS EBS gp3 volumes with encryption. When a PVC references this StorageClass, Kubernetes automatically creates an EBS volume and attaches it to the pod.

StatefulSets use `volumeClaimTemplates` to create a PVC for each pod. This ensures each pod gets its own storage, which is essential for databases that cannot share storage.

## Kubernetes Secrets Management

Kubernetes provides built-in Secrets for storing sensitive data, but they have limitations:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YXBwdXNlcg==  # base64 encoded
  password: c3VwZXJzZWNyZXQxMjM=  # base64 encoded
```

Base64 is not encryption. Anyone who can read the Secret can decode it. For better security, use one of these approaches:

**Sealed Secrets:** Encrypt secrets so they can be safely committed to version control. The Sealed Secrets controller decrypts them in the cluster.

**External Secrets Operator:** Fetch secrets from external vaults (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault) and sync them as Kubernetes Secrets.

**CSI Secret Store:** Mount secrets directly from external vaults into pods without storing them in Kubernetes.

For most teams, the External Secrets Operator provides the best balance of security and usability. Secrets are stored in a central vault, versioned, and audited. Kubernetes reads them from the vault on demand.

## Namespace Management

Namespaces partition a Kubernetes cluster into virtual clusters. They are useful for organizing resources by environment, team, or application:

```bash
# Create a namespace
kubectl create namespace production

# List namespaces
kubectl get namespaces

# Set default namespace for kubectl
kubectl config set-context --current --namespace=production

# List resources in a namespace
kubectl get pods -n production
```

Namespaces provide:
- **Resource isolation:** RBAC policies can be scoped to namespaces
- **Resource quotas:** Limit CPU, memory, and object counts per namespace
- **Network isolation:** Network policies can restrict traffic between namespaces
- **Organization:** Separate development, staging, and production resources

## kubectl Commands for Daily Operations

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get componentstatuses

# List resources
kubectl get pods -A                    # All namespaces
kubectl get pods -n production         # Specific namespace
kubectl get svc,deploy,ingress         # Multiple resource types
kubectl get pods -l app=my-app         # By label
kubectl get pods --field-selector status.phase=Running  # By field

# Inspect resources
kubectl describe pod my-pod-xyz
kubectl describe node worker-1
kubectl describe svc my-service

# View logs
kubectl logs my-pod-xyz               # Current logs
kubectl logs my-pod-xyz --previous     # Previous container logs
kubectl logs -f my-pod-xyz            # Follow logs (like tail -f)
kubectl logs -l app=my-app --all-containers  # Logs from all pods with label

# Execute commands
kubectl exec -it my-pod-xyz -- /bin/sh
kubectl exec -it my-pod-xyz -- cat /etc/config/app.json

# Apply and delete
kubectl apply -f deployment.yaml
kubectl delete -f deployment.yaml
kubectl delete pod my-pod-xyz --grace-period=0 --force

# Scale
kubectl scale deployment my-app --replicas=5
kubectl autoscale deployment my-app --min=2 --max=10 --cpu-percent=70

# Rollout management
kubectl rollout status deployment/my-app
kubectl rollout history deployment/my-app
kubectl rollout undo deployment/my-app                    # Rollback
kubectl rollout undo deployment/my-app --to-revision=3   # Rollback to specific revision

# Debugging
kubectl get events --sort-by='.lastTimestamp'
kubectl top pods                     # Resource usage
kubectl top nodes                    # Node resource usage
kubectl port-forward my-pod-xyz 3000:3000  # Forward port to local machine
kubectl port-forward svc/my-service 3000:80 # Forward to service
```

The most useful debugging pattern is:

1. `kubectl get pods` — see what is running
2. `kubectl describe pod <name>` — see events and conditions
3. `kubectl logs <name>` — see application output
4. `kubectl exec -it <name> -- /bin/sh` — inspect the container

These four commands solve 90% of Kubernetes debugging.

## Assessment

**Lab Task 1: Deploy a Multi-Tier Application (90 minutes)**

Deploy a three-tier application to a Kubernetes cluster:
1. PostgreSQL with PersistentVolumeClaim
2. Redis deployment and service
3. Node.js application with Deployment, Service, and Ingress
4. ConfigMap for application configuration
5. Secret for database password
6. Resource limits on all pods
7. Liveness and readiness probes

Document each manifest and explain why each resource is needed.

Grading criteria: All resources created and running (40%), probes configured correctly (15%), secrets and configmaps properly managed (15%), resource limits set (15%), documentation explains resource choices (15%).

**Lab Task 2: Scaling and Autoscaling (60 minutes)**

1. Manually scale the application to 5 replicas
2. Create an HPA that scales based on CPU usage
3. Generate load to trigger scaling
4. Observe the HPA adding and removing replicas
5. Document the scaling behavior and timing

Grading criteria: Manual scaling works (15%), HPA configured correctly (25%), scaling behavior observed and documented (30%), explanation of HPA mechanics (30%).

**Lab Task 3: Debugging Challenge (45 minutes)**

You are given a Kubernetes cluster with 5 broken deployments. Each has a different issue:
1. CrashLoopBackOff (wrong command)
2. ImagePullBackOff (wrong image name)
3. Pending pod (insufficient resources)
4. Service not routing traffic (wrong selector)
5. ConfigMap not mounted (wrong volume name)

Identify and fix each issue using kubectl debugging commands.

Grading criteria: All 5 issues identified (25%), all 5 fixed correctly (40%), debugging commands used correctly (20%), explanation of each issue (15%).

**Lab Task 4: Rolling Update and Rollback (45 minutes)**

1. Deploy version 1.0 of an application
2. Perform a rolling update to version 2.0
3. Observe the rollout status
4. Rollback to version 1.0
5. Document the rollout history and explain how Kubernetes manages rolling updates

Grading criteria: Deployment created correctly (20%), rolling update works (25%), rollback works (25%), documentation explains rollout mechanism (30%).

## Evidence

Kubernetes architecture is documented in the official Kubernetes documentation (kubernetes.io). The control plane components (etcd, kube-apiserver, kube-scheduler, kube-controller-manager) and worker node components (kubelet, kube-proxy, container runtime) are described in the Kubernetes architecture documentation.

Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, PersistentVolumes, and Horizontal Pod Autoscaler are core Kubernetes resources documented in the official API reference. The examples in this module use the stable API versions (v1, apps/v1, networking.k8s.io/v1, autoscaling/v2).

The debugging workflow (kubectl get, describe, logs, exec) is documented in the Kubernetes troubleshooting guide. The most common pod failure modes (CrashLoopBackOff, ImagePullBackOff, Pending) and their causes are documented in the Kubernetes troubleshooting documentation.

The HPA behavior configuration (stabilizationWindowSeconds, scaleUp/scaleDown policies) was introduced in Kubernetes 1.18 and is documented in the HPA documentation. The recommended practices for resource requests and limits, including QoS classes, are documented in the Kubernetes resource management documentation.