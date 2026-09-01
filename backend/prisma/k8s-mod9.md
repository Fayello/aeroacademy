# Module 9 — Disaster Recovery

Disasters happen. etcd corruption, node failures, accidental deletions, data center outages. The question isn't whether your cluster will fail — it's whether you can recover. This module covers etcd backup and restore, cluster backup strategies, control plane recovery, and the practical work of recovering from etcd corruption.

## Why Disaster Recovery Matters

Kubernetes clusters are distributed systems with multiple failure points:

- **etcd corruption**: The single source of truth becomes inconsistent.
- **Control plane failure**: API server, scheduler, or controller manager goes down.
- **Node failure**: Worker nodes lose power, disk, or network.
- **Accidental deletion**: Someone runs `kubectl delete namespace production`.
- **Data center outage**: Complete loss of a physical location.
- **Ransomware**: Encrypted etcd data.

Without backups, these scenarios mean data loss. With proper backup and recovery procedures, you can restore the cluster to a known good state.

## etcd Backup

etcd is the only state store in your cluster. Backing up etcd means backing up everything — all objects, all namespaces, all configurations.

### Manual Backup

```bash
# Full etcd snapshot
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

# Verify the snapshot
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot-20240115-143022.db \
  --write-out=table
```

Output:

```
+----------+----------+------------+------------+
| DB SIZE  | REVISIONS | DB VERSION | IS SANDBOX |
+----------+----------+------------+------------+
| 4.2 MB   | 1234567  | 3.5.12     | false      |
+----------+----------+------------+------------+
```

### Automated Backup

Create a CronJob that runs daily:

```yaml
# etcd-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          nodeSelector:
            node-role.kubernetes.io/control-plane: ""
          tolerations:
          - key: node-role.kubernetes.io/control-plane
            effect: NoSchedule
          containers:
          - name: etcd-backup
            image: registry.k8s.io/etcd:3.5.12-0
            command:
            - /bin/sh
            - -c
            - |
              BACKUP_FILE="/backup/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db"
              
              etcdctl snapshot save "$BACKUP_FILE" \
                --endpoints=https://127.0.0.1:2379 \
                --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
                --key=/etc/kubernetes/pki/etcd/healthcheck-client.key
              
              # Verify backup
              etcdctl snapshot status "$BACKUP_FILE" --write-out=table
              
              # Delete backups older than 7 days
              find /backup -name "etcd-snapshot-*.db" -mtime +7 -delete
              
              echo "Backup completed: $BACKUP_FILE"
            volumeMounts:
            - name: backup
              mountPath: /backup
            - name: etcd-certs
              mountPath: /etc/kubernetes/pki/etcd
              readOnly: true
            - name: k8s-certs
              mountPath: /etc/kubernetes/pki
              readOnly: true
          volumes:
          - name: backup
            hostPath:
              path: /var/backups/etcd
              type: DirectoryOrCreate
          - name: etcd-certs
            hostPath:
              path: /etc/kubernetes/pki/etcd
          - name: k8s-certs
            hostPath:
              path: /etc/kubernetes/pki
          restartPolicy: OnFailure
```

### Backup Storage

Store backups in multiple locations:

```bash
# Local backup
cp /backup/etcd-snapshot.db /var/backups/etcd/

# Remote backup (S3)
aws s3 cp /backup/etcd-snapshot.db s3://my-cluster-backups/etcd/

# GCS backup
gsutil cp /backup/etcd-snapshot.db gs://my-cluster-backups/etcd/

# Azure backup
az storage blob upload \
  --account-name mybackups \
  --container-name etcd \
  --name etcd-snapshot.db \
  --file /backup/etcd-snapshot.db
```

### Backup Verification

Always verify backups before you need them:

```bash
# Check backup integrity
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot.db --write-out=table

# Restore to a temporary directory (dry run)
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/tmp/etcd-restore \
  --name=etcd-restore-test

# Verify restored data
ls -la /tmp/etcd-restore/

# Clean up
rm -rf /tmp/etcd-restore
```

## etcd Restore

### Full Restore

If etcd is corrupted or destroyed, restore from a backup:

**Step 1: Stop the API server**

```bash
# On the control plane node, stop the API server
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Wait for API server to stop
crictl ps | grep kube-apiserver
```

**Step 2: Stop etcd**

```bash
# Stop etcd
systemctl stop etcd

# Or if running as static pod
crictl stopp $(crictl pods --name etcd -q)
```

**Step 3: Backup current etcd data (if any)**

```bash
# Move existing data out of the way
mv /var/lib/etcd /var/lib/etcd.bak
```

**Step 4: Restore etcd**

```bash
# Restore from snapshot
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/var/lib/etcd \
  --name=<etcd-member-name> \
  --initial-cluster=<etcd-member-name>=https://<etcd-ip>:2380 \
  --initial-advertise-peer-urls=https://<etcd-ip>:2380 \
  --advertise-client-urls=https://<etcd-ip>:2379 \
  --listen-client-urls=https://<etcd-ip>:2379
```

**Step 5: Start etcd**

```bash
# Start etcd
systemctl start etcd

# Or if running as static pod
mv /etc/kubernetes/manifests/etcd.yaml.bak /etc/kubernetes/manifests/etcd.yaml
```

**Step 6: Start API server**

```bash
# Move API server manifest back
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Wait for API server to start
crictl ps | grep kube-apiserver
```

**Step 7: Verify restoration**

```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Verify data integrity
kubectl get deployments --all-namespaces
kubectl get services --all-namespaces
kubectl get secrets --all-namespaces
```

### Restore to Different Cluster

You can restore an etcd snapshot to a different cluster (for migration or testing):

```bash
# Restore with different cluster name
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
  --data-dir=/var/lib/etcd \
  --name=new-cluster-member \
  --initial-cluster=new-cluster-member=https://new-ip:2380 \
  --initial-advertise-peer-urls=https://new-ip:2380 \
  --advertise-client-urls=https://new-ip:2379 \
  --listen-client-urls=https://new-ip:2379
```

## Cluster Backup Strategies

### Control Plane Backup

Back up all control plane components:

```bash
# Backup API server certificates
tar czf /backup/k8s-certs-$(date +%Y%m%d).tar.gz /etc/kubernetes/pki/

# Backup API server configuration
tar czf /backup/k8s-config-$(date +%Y%m%d).tar.gz \
  /etc/kubernetes/manifests/ \
  /etc/kubernetes/*.conf \
  /etc/kubernetes/audit-policy.yaml \
  /etc/kubernetes/encryption-config.yaml

# Backup kubelet configuration
tar czf /backup/kubelet-config-$(date +%Y%m%d).tar.gz /var/lib/kubelet/
```

### Full Cluster Backup Script

```bash
#!/bin/bash
# backup-cluster.sh

BACKUP_DIR="/backup/cluster-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=== Backing up etcd ==="
ETCDCTL_API=3 etcdctl snapshot save "$BACKUP_DIR/etcd-snapshot.db" \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

echo "=== Backing up certificates ==="
tar czf "$BACKUP_DIR/k8s-certs.tar.gz" /etc/kubernetes/pki/

echo "=== Backing up configuration ==="
tar czf "$BACKUP_DIR/k8s-config.tar.gz" \
  /etc/kubernetes/manifests/ \
  /etc/kubernetes/*.conf \
  /etc/kubernetes/audit-policy.yaml \
  /etc/kubernetes/encryption-config.yaml

echo "=== Backing up Kubernetes resources ==="
kubectl get deployments --all-namespaces -o yaml > "$BACKUP_DIR/deployments.yaml"
kubectl get services --all-namespaces -o yaml > "$BACKUP_DIR/services.yaml"
kubectl get configmaps --all-namespaces -o yaml > "$BACKUP_DIR/configmaps.yaml"
kubectl get secrets --all-namespaces -o yaml > "$BACKUP_DIR/secrets.yaml"
kubectl get ingress --all-namespaces -o yaml > "$BACKUP_DIR/ingresses.yaml"
kubectl get networkpolicies --all-namespaces -o yaml > "$BACKUP_DIR/networkpolicies.yaml"
kubectl get persistentvolumeclaims --all-namespaces -o yaml > "$BACKUP_DIR/pvcs.yaml"
kubectl get roles --all-namespaces -o yaml > "$BACKUP_DIR/roles.yaml"
kubectl get rolebindings --all-namespaces -o yaml > "$BACKUP_DIR/rolebindings.yaml"
kubectl get clusterroles -o yaml > "$BACKUP_DIR/clusterroles.yaml"
kubectl get clusterrolebindings -o yaml > "$BACKUP_DIR/clusterrolebindings.yaml"

echo "=== Verifying backup ==="
ETCDCTL_API=3 etcdctl snapshot status "$BACKUP_DIR/etcd-snapshot.db" --write-out=table

echo "=== Backup complete: $BACKUP_DIR ==="
ls -lh "$BACKUP_DIR"
```

### Automate with CronJob

```yaml
# cluster-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cluster-backup
  namespace: kube-system
spec:
  schedule: "0 1 * * *"  # Daily at 1 AM
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          nodeSelector:
            node-role.kubernetes.io/control-plane: ""
          tolerations:
          - key: node-role.kubernetes.io/control-plane
            effect: NoSchedule
          containers:
          - name: backup
            image: registry.k8s.io/kubectl:v1.29.0
            command:
            - /bin/sh
            - -c
            - |
              BACKUP_DIR="/backup/cluster-$(date +%Y%m%d-%H%M%S)"
              mkdir -p "$BACKUP_DIR"
              
              # etcd backup
              etcdctl snapshot save "$BACKUP_DIR/etcd-snapshot.db" \
                --endpoints=https://127.0.0.1:2379 \
                --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
                --key=/etc/kubernetes/pki/etcd/healthcheck-client.key
              
              # Kubernetes resources
              kubectl get deployments --all-namespaces -o yaml > "$BACKUP_DIR/deployments.yaml"
              kubectl get services --all-namespaces -o yaml > "$BACKUP_DIR/services.yaml"
              kubectl get secrets --all-namespaces -o yaml > "$BACKUP_DIR/secrets.yaml"
              
              # Cleanup old backups
              find /backup -maxdepth 1 -name "cluster-*" -mtime +7 -exec rm -rf {} \;
              
              echo "Backup complete: $BACKUP_DIR"
            volumeMounts:
            - name: backup
              mountPath: /backup
            - name: etcd-certs
              mountPath: /etc/kubernetes/pki/etcd
              readOnly: true
            - name: k8s-certs
              mountPath: /etc/kubernetes/pki
              readOnly: true
          volumes:
          - name: backup
            hostPath:
              path: /var/backups/cluster
              type: DirectoryOrCreate
          - name: etcd-certs
            hostPath:
              path: /etc/kubernetes/pki/etcd
          - name: k8s-certs
            hostPath:
              path: /etc/kubernetes/pki
          restartPolicy: OnFailure
```

## Control Plane Recovery

### Single Control Plane Node Recovery

If one control plane node fails and you have a single control plane cluster:

**Scenario: etcd data loss**

```bash
# 1. Stop API server
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# 2. Stop etcd
systemctl stop etcd

# 3. Backup corrupted data
mv /var/lib/etcd /var/lib/etcd.corrupted

# 4. Restore from backup
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot-latest.db \
  --data-dir=/var/lib/etcd

# 5. Start etcd
systemctl start etcd

# 6. Start API server
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# 7. Wait and verify
sleep 30
kubectl get nodes
kubectl get pods --all-namespaces
```

### Multi-Control Plane Recovery

If you have multiple control plane nodes and one fails:

**Scenario: Control plane node completely lost**

```bash
# 1. On surviving control plane nodes, check cluster health
kubectl get nodes
kubectl -n kube-system get pods

# 2. Remove the failed node from the cluster
kubectl delete node <failed-node-name>

# 3. On a surviving control plane node, generate new join command
kubeadm token create --print-join-command --certificate-key $(kubeadm init phase upload-certs --upload-certs 2>/dev/null | tail -1)

# 4. On the new control plane node, run join command
kubeadm join <api-server>:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --control-plane \
  --certificate-key <cert-key>

# 5. Verify new node is ready
kubectl get nodes
```

### Complete Cluster Recovery

If all control plane nodes are lost:

**Step 1: Provision new control plane node**

```bash
# Install prerequisites
# (containerd, kubeadm, kubelet, kubectl - same as initial setup)

# Restore etcd
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot-latest.db \
  --data-dir=/var/lib/etcd

# Initialize cluster with restored etcd
kubeadm init \
  --control-plane-endpoint="k8s.example.com:6443" \
  --upload-certs

# Set up kubectl
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml
```

**Step 2: Verify state**

```bash
# Check all resources are restored
kubectl get deployments --all-namespaces
kubectl get services --all-namespaces
kubectl get pods --all-namespaces
kubectl get secrets --all-namespaces
```

**Step 3: Rejoin worker nodes**

```bash
# Get join command
kubeadm token create --print-join-command

# On each worker node
kubeadm join <api-server>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# Verify
kubectl get nodes
```

## Real Scenario: Recovering from etcd Corruption

### The Scenario

Your production cluster's etcd database becomes corrupted. The API server can't read or write data. Pods are running but you can't manage them. You have a backup from 6 hours ago.

### Step 1: Assess the Damage

```bash
# Check etcd health
ETCDCTL_API=3 etcdctl endpoint health \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

# Expected output: "cluster is unhealthy"
```

### Step 2: Stop the API Server

```bash
# Move API server manifest
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Wait for API server to stop
crictl ps | grep kube-apiserver
# Should be empty
```

### Step 3: Stop etcd

```bash
# Stop etcd
systemctl stop etcd

# Verify it's stopped
systemctl status etcd
```

### Step 4: Backup Corrupted Data

```bash
# Move corrupted data out of the way
mv /var/lib/etcd /var/lib/etcd.corrupted

# Keep it for analysis
tar czf /backup/etcd-corrupted-$(date +%Y%m%d).tar.gz /var/lib/etcd.corrupted
```

### Step 5: Find the Latest Valid Backup

```bash
# List backups
ls -lh /backup/etcd-snapshot-*.db

# Check latest backup
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snapshot-latest.db --write-out=table
```

### Step 6: Restore etcd

```bash
# Restore from latest backup
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot-latest.db \
  --data-dir=/var/lib/etcd \
  --name=<etcd-member-name> \
  --initial-cluster=<etcd-member-name>=https://<etcd-ip>:2380 \
  --initial-advertise-peer-urls=https://<etcd-ip>:2380 \
  --advertise-client-urls=https://<etcd-ip>:2379 \
  --listen-client-urls=https://<etcd-ip>:2379
```

### Step 7: Start etcd

```bash
# Start etcd
systemctl start etcd

# Verify etcd health
ETCDCTL_API=3 etcdctl endpoint health \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key
```

### Step 8: Start API Server

```bash
# Move API server manifest back
mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Wait for API server to start
sleep 30
crictl ps | grep kube-apiserver
```

### Step 9: Verify Restoration

```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Check critical resources
kubectl get deployments -n production
kubectl get services -n production
kubectl get secrets -n production

# Check what changed since the backup
# (resources created in the last 6 hours are lost)
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -50
```

### Step 10: Document and Prevent

```bash
# Create incident report
cat <<EOF > /backup/incident-report-$(date +%Y%m%d).md
# Incident Report: etcd Corruption

## Date: $(date)
## Duration: ~2 hours
## Impact: Cluster management unavailable
## Root Cause: etcd data corruption (investigation ongoing)

## Recovery Steps
1. Stopped API server
2. Stopped etcd
3. Backed up corrupted data
4. Restored from backup (6 hours old)
5. Verified cluster health

## Data Loss
- 6 hours of changes lost
- Estimated affected resources: [list]

## Prevention
- Increase backup frequency to every hour
- Add etcd monitoring for disk and memory
- Enable etcd compaction and defragmentation
EOF
```

## Monitoring etcd Health

```bash
# etcd metrics
ETCDCTL_API=3 etcdctl endpoint status \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  --write-out=table

# etcd alarms
ETCDCTL_API=3 etcdctl alarm list \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

# etcd member list
ETCDCTL_API=3 etcdctl member list \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  --write-out=table

# etcd defragmentation (periodic maintenance)
ETCDCTL_API=3 etcdctl defrag \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key

# etcd compaction
ETCDCTL_API=3 etcdctl compact $(ETCDCTL_API=3 etcdctl endpoint status --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key --write-out=json | jq -r '.header.revision')
```

## Assessment

### Lab 1 — etcd Backup (30 minutes)

1. Create a manual etcd snapshot and verify it.
2. Write a backup script that automates daily backups.
3. Create a CronJob for automated backups.
4. Store backups in multiple locations.
5. Verify a backup by restoring to a temporary directory.

**Grading**: 10 points. 2 points per task. Full credit for correct backup creation, automation, and verification.

### Lab 2 — etcd Restore (45 minutes)

1. Simulate etcd corruption (stop etcd, corrupt data).
2. Restore etcd from backup.
3. Verify all resources are restored.
4. Calculate what data was lost (time between backup and corruption).
5. Write a runbook for etcd recovery.

**Grading**: 15 points. 3 points per task. Full credit for successful restoration, accurate data loss assessment, and comprehensive runbook.

### Lab 3 — Full Cluster Recovery (45 minutes)

1. Create a complete cluster backup (etcd + certificates + resources).
2. Destroy the control plane node.
3. Provision a new control plane node and restore from backup.
4. Rejoin worker nodes.
5. Verify the cluster is fully operational.

**Grading**: 15 points. 3 points per task. Full credit for successful cluster recovery and verification.

## Evidence

Submit the following as proof of completion:

1. etcd snapshot and verification output
2. Backup scripts and CronJob configurations
3. Restore procedure steps and outputs
4. Cluster backup and recovery procedure
5. Incident report and prevention recommendations
