# Module 1: Kubernetes Architecture

When you SSH into a Kubernetes node for the first time, it looks like any other Linux machine. Packages installed, services running, network interfaces up. But beneath that familiar surface sits a distributed system that coordinates thousands of containers across dozens of machines without breaking a sweat. Understanding how Kubernetes works under the hood isn't academic: it's the difference between troubleshooting a production outage in minutes versus hours.

This module breaks down every component you'll encounter in a Kubernetes cluster, what each one does, how they talk to each other, and what happens when things go wrong.

## The Control Plane

The control plane is the brain of your cluster. It's where all the decisions are made: which pods run where, which nodes are healthy, what the desired state of the system looks like. In production, you run multiple control plane nodes for high availability. In a lab, a single node is fine.

### API Server (kube-apiserver)

The API server is the front door to your cluster. Every interaction: from a human running `kubectl get pods` to a kubelet reporting node status: goes through the API server. There is no backdoor. No component talks to etcd directly. Everything flows through this single chokepoint.

The API server is an HTTP/HTTPS server that exposes a RESTful API. When you run `kubectl apply -f deployment.yaml`, here's what actually happens:

1. Your kubeconfig file tells kubectl to send the YAML to the API server's `/api/v1/namespaces/default/deployments` endpoint.
2. The API server authenticates the request using the credentials in your kubeconfig (certificate, token, or OIDC).
3. The API server authorizes the request by checking RBAC policies.
4. The API server validates the YAML against the resource schema.
5. The API server runs any admission controllers (mutating or validating webhooks).
6. If everything passes, the object is serialized to JSON and stored in etcd.
7. The API server returns a response to kubectl.

That's a lot of steps for one `kubectl apply`. Each step can fail, and each failure produces a different error message. When you see `Error from server (Forbidden)`, that's an authorization failure. When you see `Error from server (BadRequest)`, that's a schema validation failure. Knowing which step failed saves you hours of debugging.

The API server also maintains watch connections. Controllers and schedulers don't poll the API server: they open long-lived HTTP connections and receive events whenever a resource changes. This is how Kubernetes reacts to changes in near-real-time without wasting resources on polling.

In a production cluster, you typically run the API server behind a load balancer. The standard setup is three API server instances behind an HAProxy or nginx load balancer, with keepalived managing the virtual IP. Here's what a minimal API server configuration looks like on a control plane node:

```yaml
# /etc/kubernetes/manifests/kube-apiserver.yaml (static pod)
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
    - --authorization-mode=Node,RBAC
    - --client-ca-file=/etc/kubernetes/pki/ca.crt
    - --enable-admission-plugins=NodeRestriction,PodSecurity
    - --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt
    - --etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt
    - --etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key
    - --etcd-servers=https://127.0.0.1:2379
    - --kubelet-client-certificate=/etc/kubernetes/pki/apiserver-kubelet-client.crt
    - --kubelet-client-key=/etc/kubernetes/pki/apiserver-kubelet-client.key
    - --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.crt
    - --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client.key
    - --request-timeout=300s
    - --service-account-key-file=/etc/kubernetes/pki/sa.pub
    - --service-cluster-ip-range=10.96.0.0/12
    - --tls-cert-file=/etc/kubernetes/pki/apiserver.crt
    - --tls-private-key-file=/etc/kubernetes/pki/apiserver.key
    volumeMounts:
    - mountPath: /etc/kubernetes/pki
      name: k8s-certs
      readOnly: true
    - mountPath: /etc/ssl/certs
      name: ca-certs
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
```

Notice the `--authorization-mode=Node,RBAC` flag. This means the API server uses two authorizers: the Node authorizer lets kubelets read pods and services assigned to their node, and RBAC handles everything else. The order matters: the first authorizer that grants access wins.

The `--enable-admission-plugins=NodeRestriction,PodSecurity` flag enables two critical plugins. NodeRestriction prevents kubelets from modifying nodes or pods they don't own. PodSecurity enforces pod security standards (which we cover in Module 2).

### etcd

etcd is the only state store in your cluster. Every object: pods, services, secrets, configmaps, RBAC roles: lives in etcd. If etcd dies and you have no backup, your cluster is gone. Not paused. Not degraded. Gone.

etcd is a distributed key-value store based on the Raft consensus algorithm. It requires a quorum to operate: with 3 etcd nodes, you can lose 1 and keep running. With 5 nodes, you can lose 2. Even-numbered clusters don't add availability (3 nodes is the same availability as 4 nodes), so always run an odd number.

In production, etcd runs on dedicated nodes (separate from the API server, scheduler, and controller manager). In a lab or small cluster, it runs on the same nodes as the control plane components. The kubeadm tool defaults to running etcd on the same nodes.

Here's how to check etcd health:

```bash
ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  endpoint health
```

The output shows the health of each etcd endpoint. If you see `is healthy`, you're good. If you see `failed to dial`, the etcd process on that node is down or unreachable.

etcd stores data in a BoltDB file on disk. The default location is `/var/lib/etcd/member/wal/`. Backing up etcd means copying this data. We cover backup and restore in Module 9, but the key point here is that etcd is your cluster's single source of truth. Treat it like a database: because that's exactly what it is.

Performance matters. etcd defaults to a 2GB database size with an 8GB quota backend. For most clusters, that's plenty. If you're running a massive cluster with thousands of nodes, you might need to tune these values. Slow disks are the number one cause of etcd performance problems. Use SSDs. Always.

### Scheduler (kube-scheduler)

The scheduler watches for pods that have no node assigned (their `spec.nodeName` field is empty) and assigns them to nodes. That's it. The scheduler doesn't create pods, move pods, or delete pods. It only makes scheduling decisions.

A scheduling decision involves two phases:

1. **Filtering**: The scheduler eliminates nodes that can't run the pod. Common filters include node selectors, taints and tolerations, resource requests, pod affinity/anti-affinity, and persistent volume constraints. If a pod requests 8GB of RAM and no node has 8GB free, it stays unscheduled.

2. **Scoring**: The scheduler ranks the remaining nodes. It considers resource utilization, data locality, inter-pod affinity, taint penalties, and custom scoring plugins. The node with the highest score wins.

If you've ever seen a pod stuck in `Pending` state, the scheduler couldn't find a suitable node. The most common reasons:

```bash
# Check why a pod is unschedulable
kubectl describe pod <pod-name> | grep -A 5 "Events"

# Typical output:
# Events:
#   Type    Reason   Age   Message
#   ----    ------   ----   -------
#   Warning FailedScheduling  30s  0/3 nodes are available: 
#     1 Insufficient cpu, 2 had taint {node-role.kubernetes.io/control-plane: }, 
#     pod has unaffordable nodeAffinity.
```

The scheduler runs as a static pod (like the API server and controller manager). Its configuration is in `/etc/kubernetes/manifests/kube-scheduler.yaml`. You can extend the scheduler with custom plugins, but for most workloads, the defaults work well.

### Controller Manager (kube-controller-manager)

The controller manager is actually a collection of controllers bundled into one process. Each controller is responsible for a specific resource type:

- **Deployment controller**: Watches Deployments and creates ReplicaSets.
- **ReplicaSet controller**: Watches ReplicaSets and creates Pods.
- **Node controller**: Monitors node health and handles node timeouts.
- **Service account controller**: Creates default service accounts for new namespaces.
- **Endpoint controller**: Populates Service endpoints based on matching pods.
- **Job controller**: Manages Job completions and cron scheduling.

Every controller follows the same pattern:

1. Observe the current state of the world (list resources via API server watches).
2. Compare current state to desired state (the spec field of the resource).
3. Take action to reconcile the difference (create, update, or delete resources).

This is the control loop pattern. It's the core of Kubernetes. When you delete a pod managed by a ReplicaSet, the ReplicaSet controller sees one pod short of the desired count and creates a replacement. When you scale a Deployment from 3 to 5, the Deployment controller updates the ReplicaSet, which updates the pod count, which triggers pod creation.

Here's a real-world scenario: you have a Deployment with 3 replicas. One pod crashes and gets evicted. Here's the timeline:

```
T+0s:   Pod crashes
T+0-30s: Kubelet detects crash, marks pod as failed
T+30-90s: Node controller marks pod as unschedulable
T+0-30s: ReplicaSet controller sees 2/3 pods running
T+1-5s:  ReplicaSet controller creates replacement pod
T+5-10s: Scheduler assigns new pod to a node
T+10-15s: Kubelet pulls image, starts container
T+15-30s: Readiness probe passes, pod becomes ready
```

Total downtime: typically 15-90 seconds. This is why health checks matter. Without a readiness probe, the new pod might receive traffic before it's ready.

### Cloud Controller Manager (cloud-controller-manager)

If you're running on AWS, GCP, Azure, or another cloud provider, the cloud controller manager handles cloud-specific operations: creating load balancers, provisioning persistent volumes, managing node labels from cloud metadata. It's separate from kube-controller-manager so cloud-specific logic doesn't bloat the core Kubernetes codebase.

On self-managed clusters, you don't need the cloud controller manager unless you're using cloud provider integrations.

## Node Components

Every node in your cluster: whether it's a control plane node or a worker node: runs these components.

### kubelet

kubelet is the agent that runs on every node. It's the thing that makes a machine a "Kubernetes node." Without kubelet, the machine is just a Linux server.

kubelet does three things:

1. **Registers the node**: When kubelet starts, it calls the API server to create a Node resource. The node's status includes capacity (CPU, memory, pods), conditions (Ready, MemoryPressure, DiskPressure), and system information.

2. **Manages pods**: kubelet receives pod specs from the API server (via the scheduler) and ensures containers are running and healthy. It uses the Container Runtime Interface (CRI) to communicate with the container runtime (containerd, CRI-O, or others).

3. **Reports status**: kubelet periodically checks container health, updates pod status, and reports node conditions back to the API server.

kubelet configuration lives in `/var/lib/kubelet/config.yaml`:

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 0s
    enabled: true
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
rotateCertificates: true
staticPodPath: /etc/kubernetes/manifests
```

Notice `evictionHard`. These thresholds tell kubelet when to evict pods to protect the node. If memory drops below 100Mi free, kubelet starts killing pods: starting with the lowest priority ones. Understanding these thresholds is critical for capacity planning.

kubelet also manages static pods. Static pods are defined in YAML files in `/etc/kubernetes/manifests/` and are always managed by kubelet, regardless of the API server. This is how the control plane bootstraps itself: the API server, etcd, scheduler, and controller manager all start as static pods.

### kube-proxy

kube-proxy is the network proxy that runs on every node. It maintains network rules that enable Service abstraction. When you create a Service with type ClusterIP, kube-proxy sets up iptables or IPVS rules that route traffic to the backend pods.

There are three proxy modes:

**iptables mode** (default): kube-proxy creates iptables rules for every Service and Endpoint. Traffic hitting the Service IP gets DNAT'd (Destination NAT) to a random backend pod. This mode has a limitation: for large numbers of Services, iptables performance degrades because it's a linear chain.

**IPVS mode**: kube-proxy uses IPVS (IP Virtual Server) for load balancing. IPVS is designed for high-performance load balancing and handles thousands of Services without performance degradation. Enable it with `--proxy-mode=ipvs`.

**nftables mode** (new in 1.29): Uses nftables instead of iptables. Better performance than iptables for large clusters.

Here's how to check kube-proxy mode and rules:

```bash
# Check proxy mode
kubectl -n kube-system get configmap kube-proxy -o yaml | grep mode

# Check iptables rules (if using iptables mode)
iptables -t nat -KUBERNETICS-PORTAL -L

# Check IPVS rules (if using IPVS mode)
ipvsadm -Ln
```

When a Service is created, kube-proxy adds rules. When a pod is created or deleted, kube-proxy updates the endpoint list in those rules. This is why Service changes aren't instant: kube-proxy needs time to update the rules on every node.

The kube-proxy DaemonSet runs one pod per node. You can see it:

```bash
kubectl -n kube-system get pods -l k8s-app=kube-proxy
```

## Container Runtime

Kubernetes doesn't run containers directly. It talks to a container runtime through the Container Runtime Interface (CRI). Historically, Docker was the default runtime. Since Kubernetes 1.24, Dockershim was removed. The recommended runtimes are now containerd and CRI-O.

### containerd

containerd is the industry-standard container runtime. It's what Docker uses under the hood, but without the Docker CLI and build features. Most managed Kubernetes services (EKS, GKE, AKS) use containerd.

containerd communicates with kubelet over a Unix socket: `/run/containerd/containerd.sock`. Here's how to check containerd status:

```bash
# Check containerd is running
systemctl status containerd

# List images
crictl images

# List containers
crictl ps

# Check containerd version
containerd --version
```

### CRI-O

CRI-O is a lightweight container runtime built specifically for Kubernetes. It implements only what Kubernetes needs (no Docker compatibility layers). OpenShift uses CRI-O by default.

CRI-O communicates over `/var/run/crio/crio.sock`. The commands are similar to containerd but use the `crictl` CLI.

### Choosing a Runtime

For new deployments, containerd is the safe choice. It's well-tested, widely supported, and the default in kubeadm. CRI-O is an excellent choice if you want a minimal runtime. The runtime doesn't affect which containers you can run: both support OCI images.

## Cluster Networking

Kubernetes networking follows four fundamental requirements:

1. **Every pod gets a unique IP address**. No NAT between pods.
2. **Pods on the same node can communicate directly** (via a virtual network interface).
3. **Pods on different nodes can communicate directly** (via the node network).
4. **Agents on a node can communicate with all pods on that node**.

These rules mean that from a pod's perspective, every other pod is on a flat network. There's no port mapping, no NAT, no proxying. A pod on node A can reach a pod on node B using its Pod IP directly.

The container network interface (CNI) plugin handles this. Popular CNI plugins include:

- **Calico**: Supports network policies, BGP routing, and VXLAN encapsulation. Widely used in production.
- **Cilium**: eBPF-based networking. High performance, supports network policies, observability, and encryption.
- **Flannel**: Simple overlay network. No network policy support. Good for small clusters.
- **Weave Net**: Mesh networking with encryption. Supports network policies.

Each CNI plugin assigns pod IPs differently. Some use a pod CIDR (each node gets a /24 block), others use a flat IP space. The `--pod-network-cidr` flag in kubeadm tells the CNI plugin what IP range to use for pods.

Here's how to check your CNI setup:

```bash
# Check CNI plugin
kubectl -n kube-system get pods | grep -E "calico|cilium|flannel|weave"

# Check pod CIDR
kubectl get nodes -o jsonpath='{.items[0].spec.podCIDR}'

# Check pod IPs
kubectl get pods -o wide

# Test pod-to-pod connectivity
kubectl exec <pod-a> -- ping <pod-b-ip>
```

## Real Scenario: Setting Up a Production Cluster

Let's walk through setting up a production-grade Kubernetes cluster using kubeadm on Ubuntu 22.04. We'll use three control plane nodes and three worker nodes.

### Prerequisites

All nodes (control plane and workers) need:

```bash
# Disable swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Load required kernel modules
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

# Set required sysctl params
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system

# Install containerd
sudo apt-get update
sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd

# Install kubeadm, kubelet, kubectl
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

### Initialize First Control Plane Node

```bash
sudo kubeadm init \
  --control-plane-endpoint="k8s.example.com:6443" \
  --upload-certs \
  --pod-network-cidr="10.244.0.0/16" \
  --service-cidr="10.96.0.0/12"
```

The `--control-plane-endpoint` is critical for HA. Use a DNS name (not an IP) so you can replace control plane nodes without reconfiguring everything. The `--upload-certs` flag encrypts control plane certificates and uploads them to etcd, so additional control plane nodes can join without manually copying files.

After initialization:

```bash
# Set up kubectl
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI (Calico example)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml

# Get join command for additional control plane nodes
kubeadm token create --print-join-command
```

### Join Additional Control Plane Nodes

Run the join command on each additional control plane node:

```bash
sudo kubeadm join k8s.example.com:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --control-plane \
  --certificate-key <cert-key>
```

### Join Worker Nodes

Run the join command on each worker node (without `--control-plane`):

```bash
sudo kubeadm join k8s.example.com:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>
```

### Verify the Cluster

```bash
kubectl get nodes
# NAME              STATUS   ROLES           AGE   VERSION
# k8s-cp-1          Ready    control-plane   5m    v1.29.0
# k8s-cp-2          Ready    control-plane   3m    v1.29.0
# k8s-cp-3          Ready    control-plane   2m    v1.29.0
# k8s-worker-1      Ready    <none>          1m    v1.29.0
# k8s-worker-2      Ready    <none>          1m    v1.29.0
# k8s-worker-3      Ready    <none>          1m    v1.29.0

kubectl -n kube-system get pods
# NAME                                      READY   STATUS    RESTARTS   AGE
# coredns-76f75df574-abc12                  1/1     Running   0          5m
# coredns-76f75df574-def34                  1/1     Running   0          5m
# etcd-k8s-cp-1                            1/1     Running   0          5m
# kube-apiserver-k8s-cp-1                  1/1     Running   0          5m
# kube-controller-manager-k8s-cp-1         1/1     Running   0          5m
# kube-proxy-abc12                         1/1     Running   0          5m
# kube-proxy-def34                         1/1     Running   0          5m
# kube-scheduler-k8s-cp-1                  1/1     Running   0          5m
```

### Label Worker Nodes

```bash
kubectl label node k8s-worker-1 node-role.kubernetes.io/worker=worker
kubectl label node k8s-worker-2 node-role.kubernetes.io/worker=worker
kubectl label node k8s-worker-3 node-role.kubernetes.io/worker=worker
```

### Deploy a Test Application

```yaml
# test-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "200m"
            memory: "256Mi"
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - nginx
              topologyKey: kubernetes.io/hostname
```

```bash
kubectl apply -f test-app.yaml
kubectl get pods -o wide
# NAME                    READY   STATUS    RESTARTS   AGE   IP           NODE
# nginx-abc123-def45      1/1     Running   0          30s   10.244.1.5  k8s-worker-1
# nginx-abc123-ghi78      1/1     Running   0          30s   10.244.2.3  k8s-worker-2
# nginx-abc123-jkl90      1/1     Running   0          30s   10.244.3.7  k8s-worker-3
```

Notice the pod anti-affinity rule: pods spread across different nodes. This is standard production practice. If a node dies, you lose one replica, not all three.

## Troubleshooting Common Issues

### Pod Stuck in Pending

```bash
kubectl describe pod <pod-name>
# Look at Events section for scheduler failures
# Common causes:
# - Insufficient resources (CPU/memory)
# - No matching node selector
# - Unsatisfied taint/toleration
# - PVC not bound
```

### Pod Stuck in CrashLoopBackOff

```bash
kubectl logs <pod-name> --previous
# Check container logs from the previous instance
# Common causes:
# - Application error on startup
# - Missing environment variable
# - Incorrect command/args
# - Failed readiness probe
```

### Node Not Ready

```bash
kubectl describe node <node-name>
# Check Conditions section:
# - MemoryPressure: node running low on memory
# - DiskPressure: node running low on disk
# - PIDPressure: too many processes
# - Ready=false: kubelet not responding

# Check kubelet logs
journalctl -u kubelet -f
```

### API Server Unreachable

```bash
# Check API server pod
crictl ps | grep kube-apiserver
crictl logs <apiserver-container-id>

# Check etcd
ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  endpoint health

# Check certificates
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout | grep -A 2 "Validity"
```

### DNS Resolution Failures

```bash
# Test DNS from a pod
kubectl run dns-test --image=busybox:1.36 --rm -it -- nslookup kubernetes.default

# Check CoreDNS pods
kubectl -n kube-system get pods -l k8s-app=kube-dns
kubectl -n kube-system logs -l k8s-app=kube-dns

# Check CoreDNS configmap
kubectl -n kube-system get configmap coredns -o yaml
```

## Key Takeaways

Kubernetes architecture is a collection of well-defined components, each with a specific job. The API server is the single gateway. etcd is the single source of truth. The scheduler assigns pods. The controller manager reconciles desired state. kubelet and kube-proxy run on every node. The container runtime executes containers.

Understanding this architecture means you can troubleshoot any issue by identifying which component is involved. A scheduling problem? Check the scheduler. A networking issue? Check kube-proxy and CNI. A state problem? Check etcd.

When you move to production, the architecture doesn't change: you just add more nodes, more redundancy, and more monitoring. The same components run, the same protocols are used, the same control loops operate. Mastering the architecture means mastering the platform.

## Assessment

### Lab 1: Cluster Inspection (30 minutes)

1. SSH into the provided lab cluster and run `kubectl get nodes -o wide`. Record the Kubernetes version, container runtime, and OS for each node.
2. List all static pod manifests on a control plane node (`/etc/kubernetes/manifests/`). Identify which component each manifest corresponds to.
3. Run `kubectl -n kube-system get pods -o wide` and map each pod to its component (API server, etcd, scheduler, controller manager, kube-proxy, CoreDNS, CNI).
4. Create a Deployment with 5 replicas. Watch the pods being scheduled across nodes. Explain why they landed where they did.
5. Delete one pod and observe the replacement being created. Record the time between deletion and the new pod becoming Ready.

**Grading**: 10 points. 2 points per task. Full credit for correct commands, accurate observations, and clear explanations.

### Lab 2: Troubleshooting Scenarios (45 minutes)

1. The instructor will break a pod (wrong image tag). Diagnose the issue using `kubectl describe`, `kubectl logs`, and `kubectl get events`. Write a fix.
2. A node will be cordoned and drained. Observe how pods are rescheduled. Record which controller handles the rescheduling.
3. Create a pod that requests more CPU than any node has. Observe the scheduling failure. Write the correct resource requests to make the pod schedulable.
4. Check etcd health and report the number of keys stored.
5. Examine kube-proxy mode and list the first 5 iptables or IPVS rules.

**Grading**: 15 points. 3 points per task. Full credit for accurate diagnosis, correct fixes, and clear explanations.

### Lab 3: Production Cluster Design (30 minutes)

1. Given a set of requirements (10 applications, 500 pods, 500GB storage, HA requirements), design a cluster layout: how many control plane nodes, how many worker nodes, what node sizes.
2. Write the kubeadm initialization command with appropriate flags for this cluster.
3. Write a pod spec that ensures anti-affinity across nodes and sets appropriate resource limits.
4. Document the networking choice and justify it based on the requirements.
5. Create a runbook for etcd backup with crontab entries and verification commands.

**Grading**: 15 points. 3 points per task. Full credit for realistic designs, correct commands, and practical justifications.

## Evidence

Submit the following as proof of completion:

1. Screenshots of `kubectl get nodes -o wide` showing cluster status
2. Output of `kubectl -n kube-system get pods -o wide` with component mapping
3. Screenshots of troubleshooting scenarios with diagnosis steps
4. The production cluster design document
5. The etcd backup runbook

All evidence should be timestamped and labeled with the module number and lab exercise.
