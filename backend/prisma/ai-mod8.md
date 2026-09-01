# Module 8: ML Infrastructure

## Infrastructure Is Not an Afterthought

The difference between a model that trains in a notebook and a model that trains in production is infrastructure. Notebook training assumes unlimited memory, infinite disk, a single machine, and no one else competing for resources. Production training faces memory constraints, disk bottlenecks, multi-tenant resource sharing, and the need to reproduce exact results across different machines. This module covers the infrastructure decisions that determine whether your ML system is a toy or a tool.

You will learn to manage GPU resources efficiently, orchestrate training across clusters, handle distributed file systems, and build infrastructure that scales from a single experiment to hundreds of concurrent training jobs.

## GPU Management: Making Every FLOP Count

GPU memory is the most expensive and scarce resource in ML. A single A100 has 80GB of memory. A modern language model can require hundreds of gigabytes. Even a modest fraud detection model with a large feature set can consume several gigabytes per training run. Managing GPU memory is not optionalit is survival.

```python
import torch
import subprocess

def get_gpu_info():
    result = subprocess.run(
        ['nvidia-smi', '--query-gpu=index,name,memory.total,memory.used,memory.free',
         '--format=csv,noheader,nounits'],
        capture_output=True, text=True
    )
    
    gpus = []
    for line in result.stdout.strip().split('\n'):
        idx, name, total, used, free = line.split(', ')
        gpus.append({
            'index': int(idx),
            'name': name,
            'total_mb': int(total),
            'used_mb': int(used),
            'free_mb': int(free),
        })
    
    return gpus

def select_gpu(preferred_gpu=0):
    gpus = get_gpu_info()
    
    # Try preferred GPU first
    if gpus[preferred_gpu]['free_mb'] > 4000:
        return preferred_gpu
    
    # Find GPU with most free memory
    best_gpu = max(gpus, key=lambda g: g['free_mb'])
    
    if best_gpu['free_mb'] < 2000:
        raise RuntimeError("No GPU with sufficient memory available")
    
    print(f"Preferred GPU {preferred_gpu} busy, using GPU {best_gpu['index']} "
          f"({best_gpu['free_mb']}MB free)")
    return best_gpu['index']

def estimate_model_memory(model, batch_size, input_dim):
    # Parameters memory
    param_memory = sum(
        p.numel() * p.element_size() for p in model.parameters()
    )
    
    # Gradient memory (same as parameters for most optimizers)
    gradient_memory = param_memory
    
    # Optimizer state (Adam stores 2x parameters)
    optimizer_memory = param_memory * 2
    
    # Activations (rough estimate)
    # Each layer stores activations proportional to batch_size * hidden_dim
    activation_memory = batch_size * input_dim * 4  # 4 bytes per float
    
    total = param_memory + gradient_memory + optimizer_memory + activation_memory
    
    return {
        'parameters_mb': param_memory / 1e6,
        'gradients_mb': gradient_memory / 1e6,
        'optimizer_mb': optimizer_memory / 1e6,
        'activations_mb': activation_memory / 1e6,
        'total_mb': total / 1e6,
    }

# Estimate memory for a model
model = torch.nn.Sequential(
    torch.nn.Linear(128, 512),
    torch.nn.ReLU(),
    torch.nn.Linear(512, 256),
    torch.nn.ReLU(),
    torch.nn.Linear(256, 2)
)

memory_estimate = estimate_model_memory(model, batch_size=256, input_dim=128)
print("Memory estimate:")
for key, value in memory_estimate.items():
    print(f"  {key}: {value:.1f}MB")
```

Mixed precision training reduces memory usage by roughly 40%. The memory savings come from storing activations in 16-bit instead of 32-bit. The model parameters and gradients are also smaller, but the optimizer still stores 32-bit copies for the weight update.

```python
def train_with_memory_optimization(
    model, train_loader, optimizer, criterion,
    max_memory_mb=None
):
    device = torch.device('cuda')
    model = model.to(device)
    
    # Enable mixed precision
    scaler = torch.cuda.amp.GradScaler()
    
    # Estimate memory usage
    gpus = get_gpu_info()
    available_memory = gpus[0]['free_mb']
    
    if max_memory_mb and max_memory_mb > available_memory:
        # Reduce batch size to fit in memory
        estimated_per_sample = memory_estimate['total_mb'] / 256
        safe_batch_size = int(available_memory * 0.8 / estimated_per_sample)
        print(f"Reducing batch size to {safe_batch_size} to fit in memory")
    
    model.train()
    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)
        
        optimizer.zero_grad()
        
        with torch.cuda.amp.autocast():
            output = model(data)
            loss = criterion(output, target)
        
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        scaler.step(optimizer)
        scaler.update()
        
        if batch_idx % 100 == 0:
            mem_used = torch.cuda.memory_allocated() / 1e6
            mem_cached = torch.cuda.memory_reserved() / 1e6
            print(f"Batch {batch_idx}, Loss: {loss.item():.4f}, "
                  f"GPU Memory: {mem_used:.0f}MB allocated, {mem_cached:.0f}MB cached")
```

## Multi-GPU Training with Data Parallelism

When a single GPU cannot handle your batch size or you want to speed up training, you distribute across multiple GPUs. Data parallelism is the simplest approach: each GPU holds a complete model copy and processes a different data slice.

```python
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
import os

class MultiGPUTrainer:
    def __init__(self, model, world_size, backend='nccl'):
        self.model = model
        self.world_size = world_size
        self.backend = backend
    
    def setup(self, rank):
        os.environ['MASTER_ADDR'] = 'localhost'
        os.environ['MASTER_PORT'] = '12355'
        
        dist.init_process_group(
            backend=self.backend,
            rank=rank,
            world_size=self.world_size
        )
        torch.cuda.set_device(rank)
    
    def cleanup(self):
        dist.destroy_process_group()
    
    def train_worker(self, rank, dataset, epochs=10):
        self.setup(rank)
        
        # Wrap model with DDP
        model = self.model.to(rank)
        model = DDP(model, device_ids=[rank])
        
        # Distributed sampler ensures each GPU gets different data
        sampler = DistributedSampler(
            dataset, 
            num_replicas=self.world_size,
            rank=rank,
            shuffle=True
        )
        
        dataloader = DataLoader(
            dataset, 
            batch_size=32, 
            sampler=sampler,
            num_workers=4,
            pin_memory=True
        )
        
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        criterion = torch.nn.CrossEntropyLoss()
        
        for epoch in range(epochs):
            sampler.set_epoch(epoch)  # Important for shuffling
            
            model.train()
            total_loss = 0
            
            for batch_idx, (data, target) in enumerate(dataloader):
                data, target = data.to(rank), target.to(rank)
                
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, target)
                loss.backward()
                
                # All-reduce gradients across GPUs
                optimizer.step()
                total_loss += loss.item()
            
            # Only print from rank 0
            if rank == 0:
                avg_loss = total_loss / len(dataloader)
                print(f"Epoch {epoch + 1}, Loss: {avg_loss:.4f}")
        
        # Save model from rank 0 only
        if rank == 0:
            torch.save(model.module.state_dict(), 'model_parallel.pt')
        
        self.cleanup()
    
    def launch(self, dataset, epochs=10):
        import torch.multiprocessing as mp
        
        mp.spawn(
            self.train_worker,
            args=(dataset, epochs),
            nprocs=self.world_size,
            join=True
        )

# Launch multi-GPU training
# torchrun --nproc_per_node=4 train_parallel.py
```

The `sampler.set_epoch(epoch)` call is critical. Without it, the sampler uses the same ordering every epoch, which reduces the randomness of mini-batch gradients and can degrade training quality. Each epoch needs a different shuffle order.

Gradient accumulation across GPUs happens automatically with DDP. Each GPU computes gradients on its local batch, then the gradients are averaged across all GPUs during the backward pass. The effective batch size is `local_batch_size * world_size`.

## Distributed File Systems

When training across multiple machines, you need shared access to data and model checkpoints. Network File System (NFS), Hadoop Distributed File System (HDFS), and cloud object storage (S3, GCS) each have different tradeoffs.

```python
import s3fs
import pandas as pd
from pathlib import Path

class DistributedStorage:
    def __init__(self, storage_type='local', **kwargs):
        self.storage_type = storage_type
        
        if storage_type == 's3':
            self.fs = s3fs.S3FileSystem(
                key=kwargs.get('access_key'),
                secret=kwargs.get('secret_key'),
                client_kwargs={'region_name': kwargs.get('region', 'us-east-1')}
            )
        elif storage_type == 'local':
            self.fs = None
    
    def read_parquet(self, path: str) -> pd.DataFrame:
        if self.storage_type == 'local':
            return pd.read_parquet(path)
        elif self.storage_type == 's3':
            with self.fs.open(path, 'rb') as f:
                return pd.read_parquet(f)
    
    def write_parquet(self, df: pd.DataFrame, path: str):
        if self.storage_type == 'local':
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            df.to_parquet(path, index=False)
        elif self.storage_type == 's3':
            with self.fs.open(path, 'wb') as f:
                df.to_parquet(f, index=False)
    
    def list_files(self, path: str) -> list:
        if self.storage_type == 'local':
            return [str(p) for p in Path(path).glob('*')]
        elif self.storage_type == 's3':
            return self.fs.ls(path)
    
    def checkpoint_model(self, model, path: str, metadata: dict):
        import torch
        import json
        
        # Save model
        model_path = f"{path}/model.pt"
        if self.storage_type == 'local':
            Path(model_path).parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), model_path)
        elif self.storage_type == 's3':
            buffer = io.BytesIO()
            torch.save(model.state_dict(), buffer)
            buffer.seek(0)
            with self.fs.open(model_path, 'wb') as f:
                f.write(buffer.read())
        
        # Save metadata
        meta_path = f"{path}/metadata.json"
        if self.storage_type == 'local':
            with open(meta_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        elif self.storage_type == 's3':
            with self.fs.open(meta_path, 'w') as f:
                json.dump(metadata, f, indent=2)

# Usage
storage = DistributedStorage(
    storage_type='s3',
    access_key='YOUR_KEY',
    secret_key='YOUR_SECRET',
    region='us-east-1'
)

df = storage.read_parquet('s3://my-bucket/training-data/features.parquet')
storage.checkpoint_model(model, 's3://my-bucket/checkpoints/run_1', {
    'epoch': 10,
    'metrics': {'loss': 0.23, 'accuracy': 0.94}
})
```

S3 and GCS are eventually consistent, which means a file written by one machine may not be immediately visible to another. This matters when you are saving checkpoints and loading them from a different machine. Always add a small delay or use explicit consistency checks after writes.

## Resource Scheduling with Kubernetes

Kubernetes orchestrates ML workloads across a cluster. It manages GPU allocation, memory limits, and job scheduling. For ML workloads, you need to define resource requests (what the job needs) and resource limits (what the job is allowed to use).

```yaml
# training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: fraud-detection-training
  namespace: ml-workloads
spec:
  parallelism: 4
  completions: 4
  template:
    spec:
      containers:
      - name: trainer
        image: registry.example.com/ml-trainer:latest
        command: ["python", "train.py"]
        args: ["--epochs", "50", "--batch-size", "256"]
        resources:
          requests:
            memory: "16Gi"
            cpu: "4"
            nvidia.com/gpu: "1"
          limits:
            memory: "32Gi"
            cpu: "8"
            nvidia.com/gpu: "1"
        volumeMounts:
        - name: training-data
          mountPath: /data/training
        - name: model-output
          mountPath: /data/output
        env:
        - name: CUDA_VISIBLE_DEVICES
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['nvidia.com/gpu.devices']
      volumes:
      - name: training-data
        persistentVolumeClaim:
          claimName: training-data-pvc
      - name: model-output
        persistentVolumeClaim:
          claimName: model-output-pvc
      nodeSelector:
        accelerator: nvidia-a100
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      restartPolicy: Never
  backoffLimit: 3
```

The `tolerations` section is necessary because GPU nodes have taints that prevent regular pods from being scheduled on them. Without the toleration, the training job would be stuck in pending state forever.

Resource requests and limits prevent resource contention. If one training job tries to use more than its GPU memory limit, it is killed by the OOM killer rather than corrupting another job's memory. This is important in multi-tenant clusters where multiple teams share GPU resources.

## Experiment Tracking Infrastructure

At scale, you need centralized experiment tracking. MLflow is the standard open-source solution. It provides a server that stores experiment data, model artifacts, and comparison dashboards.

```bash
# Start MLflow tracking server
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost/mlflow \
  --default-artifact-root s3://my-bucket/mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5000

# In your training script
export MLFLOW_TRACKING_URI=http://mlflow-server:5000

import mlflow

mlflow.set_experiment("fraud_detection")

with mlflow.start_run(run_name="production_run"):
    mlflow.log_params(params)
    mlflow.log_metrics(metrics)
    mlflow.sklearn.log_model(model, "model")
    mlflow.log_artifact("confusion_matrix.png")
```

The PostgreSQL backend provides durability and concurrent access. The S3 artifact store provides scalable storage for model files. This setup supports dozens of concurrent training runs without data loss.

## Infrastructure as Code

ML infrastructure should be reproducible. Terraform defines infrastructure declaratively, so you can recreate your entire cluster from scratch.

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# EKS cluster for ML workloads
resource "aws_eks_cluster" "ml_cluster" {
  name     = "ml-training-cluster"
  role_arn = aws_iam_role.eks_role.arn
  
  vpc_config {
    subnet_ids = aws_subnet.ml_subnets[*].id
  }
  
  enabled_cluster_log_types = ["api", "audit", "authenticator"]
}

# GPU node group
resource "aws_eks_node_group" "gpu_nodes" {
  cluster_name    = aws_eks_cluster.ml_cluster.name
  node_group_name = "gpu-nodes"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = aws_subnet.ml_subnets[*].id
  
  instance_types = ["p3.2xlarge"]
  
  scaling_config {
    desired_size = 4
    max_size     = 8
    min_size     = 2
  }
  
  labels = {
    accelerator = "nvidia-tesla-v100"
  }
  
  taint {
    key    = "nvidia.com/gpu"
    value  = "true"
    effect = "NO_SCHEDULE"
  }
}

# S3 bucket for training data
resource "aws_s3_bucket" "training_data" {
  bucket = "ml-training-data-${var.environment}"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# RDS for MLflow backend
resource "aws_db_instance" "mlflow_db" {
  identifier     = "mlflow-tracking"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.r5.large"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  
  db_name  = "mlflow"
  username = var.db_username
  password = var.db_password
  
  backup_retention_period = 7
  multi_az               = true
}

# Outputs
output "cluster_endpoint" {
  value = aws_eks_cluster.ml_cluster.endpoint
}

output "training_data_bucket" {
  value = aws_s3_bucket.training_data.id
}
```

## Cost Optimization

ML infrastructure is expensive. A single A100 costs roughly $3 per hour. A team of 10 running experiments can easily spend $10,000 per month on GPU compute. Cost optimization is not optionalit is a survival skill.

```python
class ResourceTracker:
    def __init__(self):
        self.jobs = []
        self.cost_per_gpu_hour = 3.0  # A100 on-demand
    
    def log_job(
        self, job_id: str, gpu_count: int, 
        start_time: datetime, end_time: datetime,
        metrics: dict
    ):
        duration_hours = (end_time - start_time).total_seconds() / 3600
        cost = duration_hours * gpu_count * self.cost_per_gpu_hour
        
        self.jobs.append({
            'job_id': job_id,
            'gpu_count': gpu_count,
            'duration_hours': duration_hours,
            'cost': cost,
            'metrics': metrics,
            'cost_per_metric': cost / metrics.get('f1', 0.01),
        })
    
    def summary(self):
        total_cost = sum(j['cost'] for j in self.jobs)
        total_gpu_hours = sum(
            j['duration_hours'] * j['gpu_count'] for j in self.jobs
        )
        
        cost_by_gpu = {}
        for j in self.jobs:
            key = f"{j['gpu_count']}x GPU"
            cost_by_gpu[key] = cost_by_gpu.get(key, 0) + j['cost']
        
        best_job = min(self.jobs, key=lambda j: j['cost_per_metric'])
        
        return {
            'total_cost': total_cost,
            'total_gpu_hours': total_gpu_hours,
            'cost_by_gpu_config': cost_by_gpu,
            'most_efficient_job': best_job['job_id'],
            'cost_per_f1': best_job['cost_per_metric'],
        }

tracker = ResourceTracker()

# Log training jobs
tracker.log_job(
    job_id='run_001', gpu_count=1,
    start_time=datetime(2024, 1, 1, 10, 0),
    end_time=datetime(2024, 1, 1, 12, 30),
    metrics={'f1': 0.85}
)

tracker.log_job(
    job_id='run_002', gpu_count=4,
    start_time=datetime(2024, 1, 1, 14, 0),
    end_time=datetime(2024, 1, 1, 15, 0),
    metrics={'f1': 0.87}
)

print(tracker.summary())
```

Spot instances reduce GPU costs by 60-80%. The risk is that the instance can be reclaimed at any time. Checkpointing mitigates this riskif a spot instance is reclaimed, you restart from the last checkpoint rather than from scratch.

## GPU Cluster Architecture

Production ML requires careful GPU cluster architecture. The architecture decisions you make determine whether your team can train models efficiently, share resources fairly, and scale to meet growing demand.

The basic building block is a GPU node: a machine with one or more GPUs connected to CPUs, memory, and storage via high-speed interconnects. A single node with 8 A100 GPUs can train most models. For larger models, you need multiple nodes connected via InfiniBand or high-speed Ethernet.

The inter-node communication bandwidth is the critical bottleneck for distributed training. NVLink connects GPUs within a node at 600 GB/s. InfiniBand connects nodes at 200-400 Gbps (25-50 GB/s). Cross-datacenter connections are even slower. Training across nodes is 10-20x slower than training within a node because of this bandwidth difference.

```python
class ClusterConfig:
    def __init__(self):
        self.nodes = []
        self.gpu_per_node = 8
        self.gpu_memory_gb = 80
        self.interconnect = 'nvlink'
        self.infiniband_bandwidth_gbps = 400
    
    def estimate_training_time(self, model_size_gb, dataset_size_gb, 
                                batch_size, effective_batch_size):
        # Compute time per batch (rough estimate)
        # Assume 1 TFLOPS per GB of model parameters
        flops_per_batch = model_size_gb * 1e12 * batch_size / effective_batch_size
        compute_time = flops_per_batch / 1e15  # Assuming 1 PFLOPS cluster
        
        # Communication time for gradient sync
        gradient_size_gb = model_size_gb
        n_gpus = len(self.nodes) * self.gpu_per_node
        
        if n_gpus <= self.gpu_per_node:
            # Single node: NVLink
            comm_time = gradient_size_gb / 600  # 600 GB/s NVLink
        else:
            # Multi-node: InfiniBand
            comm_time = gradient_size_gb / (self.infiniband_bandwidth_gbps / 8)
        
        total_time_per_batch = compute_time + comm_time
        batches_per_epoch = dataset_size_gb / (batch_size * 4)  # Assuming 4 bytes per feature
        
        return {
            'compute_time_per_batch': compute_time,
            'comm_time_per_batch': comm_time,
            'total_time_per_batch': total_time_per_batch,
            'batches_per_epoch': batches_per_epoch,
            'epoch_time': total_time_per_batch * batches_per_epoch,
        }
    
    def recommend_node_count(self, model_size_gb, target_epoch_time_hours):
        for n_nodes in range(1, 17):
            self.nodes = [{'id': i} for i in range(n_nodes)]
            result = self.estimate_training_time(
                model_size_gb, 100, 256, 256 * n_nodes * self.gpu_per_node
            )
            
            if result['epoch_time'] / 3600 <= target_epoch_time_hours:
                return n_nodes
        
        return None

config = ClusterConfig()
config.nodes = [{'id': i} for i in range(4)]  # 4 nodes

estimate = config.estimate_training_time(
    model_size_gb=2, dataset_size_gb=50, batch_size=256, 
    effective_batch_size=256 * 4 * 8
)

print(f"Compute time per batch: {estimate['compute_time_per_batch']:.4f}s")
print(f"Communication time per batch: {estimate['comm_time_per_batch']:.4f}s")
print(f"Epoch time: {estimate['epoch_time']/3600:.2f} hours")
```

The communication-to-compute ratio determines whether multi-node training is worthwhile. If communication time is 10x compute time, adding more nodes barely helps because most time is spent syncing gradients. If communication time is 10% of compute time, adding more nodes provides near-linear speedup. The ratio improves with larger batch sizes (more computation per communication round) and larger models (more computation relative to gradient size).

## Storage Architecture for ML

ML workloads have unique storage requirements. Training reads large datasets sequentially. Feature stores need low-latency random reads. Model artifacts need high-throughput writes. Checkpointing needs burst writes. These different access patterns conflict, and a single storage system cannot optimize for all of them.

The solution is a tiered storage architecture. Hot storage (SSD or NVMe) holds the current training dataset and feature store. Warm storage (HDD or object storage) holds historical data and model artifacts. Cold storage (tape or glacier) holds archived data and old model versions.

```python
class StorageTier:
    def __init__(self, name: str, iops: int, throughput_mbps: int, 
                cost_per_gb_month: float, latency_ms: float):
        self.name = name
        self.iops = iops
        self.throughput_mbps = throughput_mbps
        self.cost_per_gb_month = cost_per_gb_month
        self.latency_ms = latency_ms

class StorageArchitecture:
    def __init__(self):
        self.tiers = {
            'hot': StorageTier('NVMe SSD', iops=1000000, throughput_mbps=7000,
                              cost_per_gb_month=0.20, latency_ms=0.1),
            'warm': StorageTier('HDD', iops=200, throughput_mbps=200,
                              cost_per_gb_month=0.02, latency_ms=5),
            'cold': StorageTier('Object Storage', iops=50, throughput_mbps=100,
                              cost_per_gb_month=0.004, latency_ms=50),
        }
        self.data_layout = {}
    
    def optimize_layout(self, access_patterns: dict):
        for dataset, pattern in access_patterns.items():
            if pattern['iops'] > 10000 or pattern['latency_ms'] < 1:
                tier = 'hot'
            elif pattern['iops'] > 1000 or pattern['latency_ms'] < 10:
                tier = 'warm'
            else:
                tier = 'cold'
            
            self.data_layout[dataset] = {
                'tier': tier,
                'size_gb': pattern['size_gb'],
                'monthly_cost': pattern['size_gb'] * self.tiers[tier].cost_per_gb_month,
            }
        
        return self.data_layout
    
    def estimate_monthly_cost(self) -> float:
        return sum(d['monthly_cost'] for d in self.data_layout.values())

storage = StorageArchitecture()
layout = storage.optimize_layout({
    'training_data': {'size_gb': 50, 'iops': 100000, 'latency_ms': 0.5},
    'feature_store': {'size_gb': 10, 'iops': 50000, 'latency_ms': 0.2},
    'model_artifacts': {'size_gb': 5, 'iops': 1000, 'latency_ms': 5},
    'audit_logs': {'size_gb': 100, 'iops': 100, 'latency_ms': 100},
})

print(f"Monthly storage cost: ${storage.estimate_monthly_cost():.2f}")
```

The training dataset goes on hot storage because training reads millions of rows sequentially and needs high throughput. The feature store goes on hot storage because serving requires low-latency reads. Model artifacts go on warm storage because they are read infrequently. Audit logs go on cold storage because they are rarely accessed.

## Networking for Distributed Training

Network topology affects distributed training performance. GPUs on the same node communicate via NVLink (600 GB/s). GPUs on different nodes communicate via InfiniBand (200-400 Gbps). The difference is 10-30x. Training across nodes is significantly slower than training within a node.

For optimal performance, use NCCL (NVIDIA Collective Communications Library) with InfiniBand. NCCL automatically detects the network topology and chooses the most efficient communication path. It supports ring all-reduce, tree all-reduce, and hierarchical all-reduce algorithms, choosing the best one based on the number of GPUs and network topology.

```python
def configure_distributed_training(world_size: int, nodes: list):
    import os
    
    # Set NCCL environment variables
    os.environ['NCCL_DEBUG'] = 'INFO'
    os.environ['NCCL_IB_DISABLE'] = '0'  # Enable InfiniBand
    os.environ['NCCL_NET_GDR_LEVEL'] = '5'  # GPU Direct RDMA
    
    # Set MASTER_ADDR and MASTER_PORT
    os.environ['MASTER_ADDR'] = nodes[0]['ip']
    os.environ['MASTER_PORT'] = '12355'
    
    # Configure topology-aware communication
    if world_size <= 8:
        # Single node: use NVLink
        os.environ['NCCL_SHM_DISABLE'] = '0'
    else:
        # Multi-node: use InfiniBand
        os.environ['NCCL_SHM_DISABLE'] = '1'
        os.environ['NCCL_SOCKET_IFNAME'] = 'ib0'
    
    print(f"Configured for {world_size} GPUs across {len(nodes)} nodes")
    print(f"Master: {os.environ['MASTER_ADDR']}:{os.environ['MASTER_PORT']}")

configure_distributed_training(
    world_size=32,
    nodes=[{'ip': f'10.0.0.{i}', 'gpus': 8} for i in range(4)]
)
```

GPU Direct RDMA allows GPUs to communicate directly across InfiniBand without involving the CPU. This reduces latency and increases throughput for inter-node communication. The `NCCL_NET_GDR_LEVEL=5` setting enables the highest level of GPU Direct RDMA.

Network topology awareness is critical for multi-node training. NCCL automatically detects whether GPUs are on the same node (NVLink), on different nodes in the same rack (switch), or on different racks (spine). It chooses the most efficient communication algorithm based on the topology. For 8 GPUs within a node, ring all-reduce is optimal. For 32 GPUs across 4 nodes, hierarchical all-reduce is better because it minimizes cross-rack traffic.

The practical impact is significant. A model that trains in 2 hours on a single node with 8 GPUs might take 6 hours across 4 nodes with 32 GPUs. The 4x GPU count does not produce 4x speedup because of communication overhead. Understanding this tradeoff is essential for capacity planning and cost estimation. Before committing to a multi-node training setup, measure the actual speedup on your specific model and dataset. The theoretical speedup rarely matches the practical speedup because of communication overhead, load imbalance, and straggler nodes. Start with a single node and scale up only when you have evidence that more GPUs will actually help.

## Assessment

### Lab Task 1: GPU Memory Management (Time: 60 minutes)

Build a GPU memory management system.

**Steps:**
1. Implement `get_gpu_info()` that queries nvidia-smi for GPU status.
2. Implement `estimate_model_memory()` that estimates memory requirements.
3. Implement `select_gpu()` that picks the GPU with the most free memory.
4. Build a training function that automatically adjusts batch size to fit in GPU memory.
5. Add memory monitoring that logs usage during training.

**Grading Criteria:**
- GPU info correctly queries all available GPUs (15 points)
- Memory estimation is accurate within 20% (15 points)
- GPU selection picks the best available GPU (10 points)
- Batch size auto-adjustment prevents OOM errors (20 points)
- Memory monitoring logs usage at regular intervals (15 points)
- Training completes without memory errors on different GPU configs (15 points)
- Code handles the case where no GPUs are available (10 points)

### Lab Task 2: Multi-GPU Training (Time: 90 minutes)

Implement distributed training across multiple GPUs.

**Steps:**
1. Write a training script that uses `DistributedDataParallel`.
2. Implement `DistributedSampler` for data loading.
3. Add gradient averaging across GPUs.
4. Implement checkpointing that saves from rank 0 only.
5. Measure speedup from 1 GPU to 2 GPUs to 4 GPUs.

**Grading Criteria:**
- DDP setup with proper process group initialization (15 points)
- Data is distributed without overlap across GPUs (15 points)
- Gradients are correctly averaged across GPUs (15 points)
- Checkpointing works correctly from rank 0 (15 points)
- Speedup measurements are accurate (15 points)
- Training converges to same loss as single-GPU training (15 points)
- Code handles GPU failure gracefully (10 points)

### Lab Task 3: Infrastructure Setup (Time: 75 minutes)

Set up ML infrastructure using containers and orchestration.

**Steps:**
1. Write a Dockerfile for the training environment.
2. Define a Kubernetes Job spec for training.
3. Add resource requests and limits for GPU and memory.
4. Implement a health check for the training job.
5. Add logging that captures training metrics.

**Grading Criteria:**
- Dockerfile builds and runs successfully (15 points)
- Kubernetes Job spec is syntactically correct (15 points)
- Resource limits prevent OOM kills and GPU contention (15 points)
- Health check detects hung training jobs (15 points)
- Logging captures key training metrics (15 points)
- Job completes successfully on a real cluster (15 points)
- Documentation explains the deployment process (10 points)

## Evidence

- `gpu_manager.py`: GPU memory management with auto-adjustment and monitoring
- `multi_gpu_trainer.py`: DDP training implementation with distributed sampling
- `distributed_storage.py`: Storage abstraction for local and S3 backends
- `k8s_training_job.yaml`: Kubernetes Job definition for training
- `Dockerfile.training`: Container definition for the training environment
- `resource_tracker.py`: Cost tracking and optimization module
- `infrastructure.tf`: Terraform configuration for ML infrastructure
- `benchmark_results.csv`: GPU scaling benchmarks from 1 to 4 GPUs
