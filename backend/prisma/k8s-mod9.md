# Module 9 — Disaster Recovery

## What You'll Actually Do

You'll back up etcd, restore a cluster from backup, implement Velero for workload-level backups, and test disaster recovery procedures. This is about being able to recover when things go wrong — because they will.

## Core Concepts

### What Can Go Wrong

- **etcd corruption**: The most catastrophic failure. Lose etcd, lose the cluster.
- **Control plane failure**: API server down, scheduler stuck, controller manager dead.
- **Node failure**: Worker node dies, pods need rescheduling.
- **Namespace deletion**: Accidental `kubectl delete namespace production`.
- **Data loss**: PersistentVolume corruption or accidental deletion.

### etcd Backup Strategy

etcd is the single point of failure. Back it up frequently and test restores.

```bash
# Full etcd snapshot
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d-%H%M).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify the snapshot
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-20260101-0300.db --write-out=table

# Automate with cron
cat > /etc/cron.d/etcd-backup << 'EOF'
0 2 * * * root ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +\%Y\%m\%d-\%H\%M).db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key && find /backup -name "etcd-*.db" -mtime +7 -delete
EOF
```

### etcd Restore Process

```bash
# Stop the API server
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Wait for API server to stop
sleep 30

# Restore etcd
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-20260101-0300.db \
  --data-dir=/var/lib/etcd-restored \
  --name=<etcd-member-name> \
  --initial-cluster=<etcd-member-name>=https://<ip>:2380 \
  --initial-advertise-peer-urls=https://<ip>:2380 \
  --initial-cluster-token=etcd-cluster \
  --advertise-client-urls=https://<ip>:2379

# Update etcd manifest to use restored data
# Edit /etc/kubernetes/manifests/etcd.yaml
# Change --data-dir to /var/lib/etcd-restored

# Restart API server
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Verify cluster is healthy
kubectl get nodes
kubectl get pods -A
```

### Velero for Workload Backups

Velero backs up Kubernetes resources and PersistentVolume data. It works at the workload level, not the cluster level.

```bash
# Install Velero
curl -fsSL https://github.com/vmware-tanzu/velero/releases/download/v1.13.0/velero-v1.13.0-linux-amd64.tar.gz | tar xz
sudo mv velero-v1.13.0-linux-amd64/velero /usr/local/bin/

# Create a backup bucket (S3 or MinIO)
# For MinIO (local testing):
kubectl apply -f https://raw.githubusercontent.com/minio/operator/master/examples/minio-instance/minio.yaml

# Install Velero with MinIO backend
velero install \
  --provider aws \
  --bucket velero-backups \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --backup-location-config region=minio,s3ForcePathStyle=true,s3Url=http://minio.minio.svc:9000
```

```bash
# Create a backup
velero backup create full-backup --include-namespaces production

# Create a scheduled backup
velero schedule create daily-backup --schedule="0 2 * * *" --include-namespaces production

# List backups
velero backup get

# Restore from backup
velero restore create --from-backup full-backup
```

### Backup Verification

A backup you haven't tested is not a backup.

```bash
# Verify etcd backup integrity
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-20260101-0300.db --write-out=table

# Test Velero restore in a separate namespace
velero restore create --from-backup full-backup --namespace-mappings production:production-test

# Verify restored resources
kubectl get all -n production-test
```

### RTO and RPO

- **RPO (Recovery Point Objective)**: How much data you can afford to lose. If you back up every hour, RPO = 1 hour.
- **RTO (Recovery Time Objective)**: How long recovery takes. etcd restore = 10-30 minutes. Velero restore = minutes to hours depending on data.

## Hands-On Lab

### Task 1: Create and Verify etcd Backup

```bash
# Create backup directory
sudo mkdir -p /backup

# Take a snapshot
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-test.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify the snapshot
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-test.db --write-out=table

# Check file size and date
ls -lh /backup/etcd-test.db
```

### Task 2: Simulate Namespace Loss and Restore

```bash
# Create a test namespace with resources
kubectl create namespace disaster-test
kubectl create deployment nginx --image=nginx -n disaster-test
kubectl create service clusterip nginx --tcp=80:80 -n disaster-test
kubectl get all -n disaster-test

# Take backup before deletion
ETCDCTL_API=3 etcdctl snapshot save /backup/before-delete.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Delete the namespace
kubectl delete namespace disaster-test

# Verify it's gone
kubectl get namespace disaster-test

# Document the loss
echo "Namespace deleted at $(date)" > /backup/deletion-log.txt
```

### Task 3: Restore etcd from Backup

```bash
# Stop API server
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
sleep 30

# Verify API server is down
kubectl get nodes  # Should fail

# Restore etcd
sudo ETCDCTL_API=3 etcdctl snapshot restore /backup/before-delete.db \
  --data-dir=/var/lib/etcd-restored \
  --name=$(ETCDCTL_API=3 etcdctl member list --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key | grep -oP '(?<=, )[^,]+(?=,)' | head -1) \
  --initial-cluster-token=etcd-cluster

# Update etcd manifest (adjust data-dir)
sudo sed -i 's|--data-dir=/var/lib/etcd|--data-dir=/var/lib/etcd-restored|' /etc/kubernetes/manifests/etcd.yaml

# Restart API server
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
sleep 30

# Verify cluster is back
kubectl get nodes
kubectl get namespace disaster-test  # Should exist again
kubectl get all -n disaster-test
```

### Task 4: Deploy and Use Velero

```bash
# Install MinIO for local testing
kubectl create namespace minio
kubectl apply -n minio -f https://raw.githubusercontent.com/minio/operator/master/examples/minio-instance/minio.yaml

# Install Velero
velero install \
  --provider aws \
  --bucket velero-backups \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --backup-location-config region=minio,s3ForcePathStyle=true,s3Url=http://minio.minio.svc:9000

# Create a backup
velero backup create test-backup --include-namespaces default

# Check backup status
velero backup describe test-backup
velero backup logs test-backup

# Create resources, then restore
kubectl create deployment test --image=nginx
velero restore create --from-backup test-backup
```

### Task 5: Document Recovery Procedures

```bash
# Create a runbook
cat > disaster-recovery-runbook.md << 'EOF'
# Disaster Recovery Runbook

## etcd Recovery (Cluster Down)
1. SSH into control plane node
2. Check etcd health: ETCDCTL_API=3 etcdctl endpoint health
3. If etcd is corrupted:
   - Stop API server: mv kube-apiserver.yaml /tmp/
   - Restore: etcdctl snapshot restore <backup-file>
   - Update etcd manifest
   - Restart API server
4. Verify: kubectl get nodes

## Namespace Recovery (Accidental Deletion)
1. Check if Velero backup exists: velero backup get
2. Restore: velero restore create --from-backup <backup-name>
3. Verify resources: kubectl get all -n <namespace>

## Node Failure
1. Check node status: kubectl get nodes
2. Cordon node: kubectl cordon <node>
3. Drain node: kubectl drain <node> --ignore-daemonsets
4. Replace hardware
5. Uncordon: kubectl uncordon <node>
EOF
```

## Assessment

**Lab Task**: Create a complete disaster recovery plan: backup etcd, simulate a disaster (namespace deletion), restore from backup, and document the entire procedure with timing.

**Time**: 55 minutes

**Grading** (100 points):
- etcd backup created and verified (20 pts)
- Disaster simulated successfully (15 pts)
- Cluster restored from backup (25 pts)
- All resources recovered (20 pts)
- Recovery runbook documented with timing (20 pts)

## Evidence

Save the following to your evidence folder:
1. `etcd-backup-status.txt` — output of etcdctl snapshot status
2. `disaster-log.txt` — timeline of simulated disaster and recovery
3. `restoration-output.txt` — output of restore commands
4. `recovered-resources.txt` — kubectl output showing recovered resources
5. `disaster-recovery-runbook.md` — your recovery procedures document
