# Module 1 — Kubernetes Architecture

## What You'll Actually Do

You'll deploy a minimal Kubernetes cluster from scratch, inspect every component, and understand how the control plane communicates with worker nodes. This isn't theory — you'll be SSHing into machines and watching packets flow.

## Core Concepts

### The Control Plane

The control plane is the brain of your cluster. It runs on dedicated nodes (or a single node for dev) and consists of:

- **kube-apiserver**: The front door. Every kubectl command, every API call goes through here. It validates and processes requests, then stores state.
- **etcd**: The source of truth. A distributed key-value store that holds all cluster state. Without etcd, you have nothing.
- **kube-scheduler**: Decides which node runs a new pod. It watches for unscheduled pods and assigns them based on resources, taints, tolerations, and affinity rules.
- **kube-controller-manager**: Runs reconciliation loops. If you set 3 replicas and one dies, this controller creates a new one.

### The Worker Node

Each worker node runs:

- **kubelet**: The node agent. It watches the API server for pods assigned to its node, then tells the container runtime to create/stop containers.
- **Container Runtime**: Docker, containerd, or CRI-O. The actual engine that runs containers.
- **kube-proxy**: Maintains network rules. It handles service networking, load balancing across pods, and iptables/IPVS rules.

### etcd Deep Dive

etcd is the most critical component. Lose it, lose the cluster.

```
# Check etcd health
ETCDCTL_API=3 etcdctl endpoint health \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# List all keys
ETCDCTL_API=3 etcdctl get / --prefix --keys-only | head -20

# Backup etcd
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### kubelet Communication

The kubelet uses a watch mechanism — it doesn't poll. When the API server has new work for a node, the kubelet gets notified instantly.

```bash
# See what kubelet is doing
journalctl -u kubelet -f --no-pager | head -50

# Check kubelet config
cat /var/lib/kubelet/config.yaml

# View node status
kubectl get nodes -o wide
kubectl describe node <node-name>
```

### API Server Request Flow

```
Client → API Server → Authentication → Authorization → Admission → etcd
         (TLS)       (certs/tokens)   (RBAC)         (webhooks)   (store)
```

Every request goes through this pipeline. Skip a step, and your request gets rejected.

## Hands-On Lab

### Setup

You'll need two VMs: one for the control plane, one for a worker. Use Ubuntu 22.04 with at least 2GB RAM each.

### Task 1: Bootstrap the Control Plane

```bash
# On the control plane node
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fab

# Install containerd
sudo apt-get update && sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd

# Install kubeadm, kubelet, kubectl
sudo apt-get install -y apt-transport-https ca-certificates curl
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl

# Initialize the cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Set up kubeconfig
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### Task 2: Inspect the Cluster

```bash
# List all system pods
kubectl get pods -n kube-system

# Check component statuses
kubectl get componentstatuses

# View etcd member list
ETCDCTL_API=3 etcdctl member list \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Watch API server logs
journalctl -u kube-apiserver -f --no-pager
```

### Task 3: Join a Worker Node

```bash
# On the control plane, get the join command
kubeadm token create --print-join-command

# On the worker node, run the join command
sudo kubeadm join <control-plane-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# Back on control plane, verify
kubectl get nodes
```

### Task 4: Deploy a Test Pod and Trace Its Path

```bash
# Create a simple nginx pod
kubectl run nginx --image=nginx --port=80

# Watch it get scheduled
kubectl get pods -w

# Check which node it landed on
kubectl get pods -o wide

# Inspect the pod details
kubectl describe pod nginx

# Exec into the pod and verify networking
kubectl exec -it nginx -- curl localhost:80
```

## Assessment

**Lab Task**: Deploy a 2-node Kubernetes cluster from scratch. Install all components manually (no kops, no EKS). Document each step with screenshots or command output.

**Time**: 60 minutes

**Grading** (100 points):
- Control plane boots successfully (25 pts)
- Worker node joins and shows Ready status (25 pts)
- System pods running in kube-system namespace (20 pts)
- etcd backup created and verified (15 pts)
- Test pod deployed, scheduled, and reachable (15 pts)

## Evidence

Save the following to your evidence folder:
1. `cluster-nodes.txt` — output of `kubectl get nodes -o wide`
2. `system-pods.txt` — output of `kubectl get pods -n kube-system -o wide`
3. `etcd-backup.db` — your etcd snapshot file
4. `pod-description.txt` — output of `kubectl describe pod nginx`
5. `join-command.txt` — the kubeadm join command you used (redact tokens)
