# Module 8 — ML Infrastructure: GPUs, Clusters, Resource Management

## What You'll Actually Do

You'll set up and manage ML compute resources—GPU utilization, distributed clusters, and resource scheduling. Infrastructure is the foundation of ML at scale.

## Content

### GPU Utilization Monitoring

```python
import subprocess
import json
from datetime import datetime

def get_gpu_stats():
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=index,name,temperature.gpu,"
         "utilization.gpu,memory.used,memory.total",
         "--format=csv,noheader,nounits"],
        capture_output=True, text=True
    )

    gpus = []
    for line in result.stdout.strip().split("\n"):
        idx, name, temp, util, mem_used, mem_total = line.split(", ")
        gpus.append({
            "index": int(idx),
            "name": name.strip(),
            "temperature": int(temp),
            "utilization": int(util),
            "memory_used": int(mem_used),
            "memory_total": int(mem_total),
            "memory_percent": int(mem_used) / int(mem_total) * 100
        })
    return gpus

# Log GPU utilization during training
def monitor_training(func):
    def wrapper(*args, **kwargs):
        stats_log = []
        start = datetime.now()

        result = func(*args, **kwargs)

        stats = get_gpu_stats()
        stats_log.append({
            "timestamp": datetime.now().isoformat(),
            "gpus": stats
        })

        with open("gpu_stats.json", "w") as f:
            json.dump(stats_log, f, indent=2)

        return result
    return wrapper
```

### Docker Compose for ML Stack

```yaml
# docker-compose.ml.yml
version: "3.8"
services:
  training:
    build: ./training
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    volumes:
      - ./data:/data
      - ./models:/models
    environment:
      - CUDA_VISIBLE_DEVICES=0,1

  inference:
    build: ./inference
    ports:
      - "8080:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.12.0
    ports:
      - "5000:5000"
    volumes:
      - ./mlflow-data:/mlflow
    command: mlflow server --backend-store-uri sqlite:///mlflow/mlflow.db
```

### Resource Scheduling with Ray

```python
import ray

ray.init(num_cpus=8, num_gpus=2)

@ray.remote(num_cpus=2, num_gpus=0.5)
def train_fold(fold_data):
    model = RandomForestClassifier()
    model.fit(fold_data["X_train"], fold_data["y_train"])
    return model.score(fold_data["X_test"], fold_data["y_test"])

# Parallel cross-validation
folds = prepare_folds(X, y, n_splits=5)
futures = [train_fold.remote(fold) for fold in folds]
scores = ray.get(futures)
print(f"CV scores: {scores}")
```

### Kubernetes Resource Limits

```yaml
# k8s-training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: model-training
spec:
  template:
    spec:
      containers:
        - name: trainer
          image: myregistry/trainer:latest
          resources:
            requests:
              memory: "4Gi"
              cpu: "2"
              nvidia.com/gpu: "1"
            limits:
              memory: "8Gi"
              cpu: "4"
              nvidia.com/gpu: "2"
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: ml-data-pvc
      restartPolicy: Never
```

## Assessment

**Lab: Set Up ML Infrastructure**

Write a Docker Compose file that runs an ML training job with GPU access, an inference server, and an MLflow tracking server. Create a Ray script that parallelizes 5-fold cross-validation. Include GPU monitoring that logs utilization during the run.

- Time: 65 minutes
- Grading: Docker Compose correctness (30%), Ray parallelization (30%), GPU monitoring (25%), resource configuration (15%)

## Evidence

Upload your docker-compose file, Ray training script, GPU monitoring output, and a screenshot of running services.
