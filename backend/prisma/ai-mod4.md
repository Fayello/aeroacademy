# Module 4: Model Deployment

## The Model Is Not the Product. The API Is.

A trained model is a file. It sits on disk, consuming no resources and producing no value. The moment you wrap it in an API and expose it to traffic, it becomes a service. And services have requirements that training notebooks do not: latency SLAs, availability targets, version management, and graceful degradation. This module covers how to deploy models using TF Serving, TorchServe, and custom APIs, how to optimize inference for latency and throughput, and how to handle the production realities that make deployment the hardest part of ML.

You will deploy a trained model as a REST API, set up batch prediction pipelines, implement model caching, and build a fallback mechanism for when the model service goes down. The focus is on making predictions available reliably, not on building the fanciest serving infrastructure.

The gap between "model works in notebook" and "model works in production" is enormous. In a notebook, you call `model.predict()` on a small batch and get results in seconds. In production, you must handle thousands of concurrent requests, each expecting a response in under 100ms. The model must load correctly, the preprocessing must be identical to training, and the system must recover gracefully from failures. This is engineering, not science.

## TensorFlow Serving: Production-Grade Model Serving

TensorFlow Serving is a battle-tested serving system used by Google, Twitter, and countless other organizations. It handles model versioning, batched inference, GPU sharing, and monitoring out of the box. The key advantage is that you export a TensorFlow model in the SavedModel format, and TF Serving loads it with zero code changes.

The SavedModel format bundles the model architecture, weights, and computation graph into a single directory. TF Serving watches this directory and automatically loads new versions when they appear. This hot-swapping capability means you can deploy new models without restarting the server, achieving zero-downtime deployments.

```python
import tensorflow as tf
from tensorflow import keras

def build_model(input_dim, num_classes):
    model = keras.Sequential([
        keras.layers.Dense(128, activation='relu', input_shape=(input_dim,)),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    return model

model = build_model(128, 2)
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(X_train, y_train, epochs=10, validation_split=0.2)

export_path = 'models/saved_model/1'
model.save(export_path)
print(f"Model exported to {export_path}")
```

The `1` in the export path is the version number. TF Serving automatically loads the latest version and serves it. When you export a new version to `models/saved_model/2`, TF Serving hot-swaps to the new model with zero downtime. This is model versioning without any custom code.

```bash
docker run -p 8501:8501 \
  --mount type=bind,source=$(pwd)/models/saved_model,target=/models/saved_model \
  -e MODEL_NAME=saved_model \
  tensorflow/serving:latest

curl -X POST http://localhost:8501/v1/models/saved_model:predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [[0.1, 0.2, 0.3, ...]]}'
```

TF Serving supports batching out of the box. If multiple requests arrive simultaneously, it batches them into a single GPU operation, which is more efficient than processing each request individually. The batch timeout controls how long to wait for a full batch before processing whatever is available. This is the latency-throughput tradeoff: larger batches are more efficient but add latency.

For production, you should configure the REST API port (8501) and the gRPC port (8500). gRPC is faster than REST for internal service communication because it uses binary serialization and HTTP/2 multiplexing. REST is better for external clients because it is easier to debug and does not require protobuf definitions.

## TorchServe: PyTorch Model Serving

TorchServe is the PyTorch equivalent of TF Serving. It uses a custom handler that defines how to preprocess input, run inference, and postprocess output. This gives you full control over the serving logic, which is necessary when your model requires custom preprocessing.

The handler architecture separates concerns cleanly. The `initialize` method loads the model once when the server starts. The `preprocess` method converts raw input into tensors. The `inference` method runs the model. The `postprocess` method converts tensors back into human-readable output. This separation makes each step testable independently.

```python
import torch
import torch.nn as nn
import json
from ts.torch_handler.base_handler import BaseHandler

class FraudHandler(BaseHandler):
    def initialize(self, context):
        self.manifest = context.manifest
        model_dir = context.system_properties.get("model_store")
        self.model = self._load_model(model_dir)
        self.model.eval()
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.model.to(self.device)
    
    def _load_model(self, model_dir):
        model = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 2)
        )
        checkpoint = torch.load(f"{model_dir}/model.pt", map_location="cpu")
        model.load_state_dict(checkpoint)
        return model
    
    def preprocess(self, data):
        input_data = data[0].get("data") or data[0].get("body")
        if isinstance(input_data, str):
            input_data = json.loads(input_data)
        tensor = torch.tensor(input_data["features"], dtype=torch.float32)
        return tensor.to(self.device)
    
    def inference(self, tensor):
        with torch.no_grad():
            output = self.model(tensor)
        return output
    
    def postprocess(self, output):
        probabilities = torch.softmax(output, dim=1)
        predictions = torch.argmax(probabilities, dim=1)
        return [
            {
                "prediction": pred.item(),
                "probability": prob[pred].item(),
                "all_probabilities": prob.tolist()
            }
            for pred, prob in zip(predictions, probabilities)
        ]
```

The handler separates preprocessing, inference, and postprocessing into distinct steps. This makes it easy to test each step independently and to modify preprocessing without changing the model. The `preprocess` method handles multiple input formats (JSON string, bytes, etc.), which is necessary when different clients send data in different formats.

## Custom Serving with FastAPI

Sometimes TF Serving and TorchServe are overkill. If you have a simple model and need tight control over the API contract, a custom FastAPI service is faster to implement and easier to debug. You control the exact request format, error handling, logging, and monitoring.

The advantage of FastAPI is that it generates OpenAPI documentation automatically. Clients can see exactly what endpoints are available, what parameters they accept, and what responses they return. This reduces integration friction and eliminates the need for separate API documentation.

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import numpy as np
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fraud Detection API", version="1.0.0")

class PredictionRequest(BaseModel):
    features: List[float]
    request_id: Optional[str] = None
    
    @validator('features')
    def validate_features(cls, v):
        if len(v) != 128:
            raise ValueError(f"Expected 128 features, got {len(v)}")
        if any(np.isnan(v)):
            raise ValueError("Features contain NaN values")
        return v

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    latency_ms: float
    model_version: str

class ModelManager:
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None
        self.model_version = None
        self._load_model()
    
    def _load_model(self):
        checkpoint = torch.load(self.model_path, map_location='cpu')
        self.model = self._build_model()
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        self.model_version = checkpoint.get('version', 'unknown')
        logger.info(f"Loaded model version: {self.model_version}")
    
    def _build_model(self):
        return nn.Sequential(
            nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 2)
        )
    
    def reload(self):
        self._load_model()
        return self.model_version

model_manager = ModelManager('models/current/model.pt')

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    start_time = time.time()
    try:
        import torch
        tensor = torch.tensor(request.features, dtype=torch.float32)
        tensor = tensor.unsqueeze(0)
        with torch.no_grad():
            output = model_manager.model(tensor)
            probabilities = torch.softmax(output, dim=1)
            prediction = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][prediction].item()
        latency = (time.time() - start_time) * 1000
        return PredictionResponse(
            prediction=prediction, probability=confidence,
            latency_ms=latency, model_version=model_manager.model_version
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reload")
async def reload_model():
    new_version = model_manager.reload()
    return {"status": "reloaded", "version": new_version}

@app.get("/health")
async def health():
    return {"status": "healthy", "model_version": model_manager.model_version}
```

The health endpoint is critical. Load balancers and orchestration systems use it to determine whether to route traffic to this instance. If the model fails to load, the health endpoint returns a failure status, and the orchestrator stops sending traffic until the instance recovers. Without a health check, traffic continues flowing to broken instances, causing cascading failures.

The `/reload` endpoint enables zero-downtime model updates. When a new model is ready, you call `/reload` and the server loads the new version without restarting. This is simpler than TF Serving's automatic versioning but gives you more control over when the switch happens.

## Inference Optimization

Production inference has two constraints: latency and throughput. Latency is how long a single prediction takes. Throughput is how many predictions per second the system can handle. These constraints often conflictbatching improves throughput but increases latency.

Model quantization reduces the precision of model weights from 32-bit floats to 8-bit integers. This reduces model size by 4x and speeds up inference on CPUs and GPUs that support integer arithmetic. The accuracy loss is typically 1-2%, which is acceptable for most applications. The speedup comes from two sources: less memory bandwidth (reading 8-bit values is faster than 32-bit) and specialized integer arithmetic units on modern processors.

```python
import torch.quantization as quant

def quantize_model(model, calibration_data):
    model.eval()
    quantized_model = quant.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    
    import time
    start = time.time()
    for _ in range(1000):
        with torch.no_grad():
            model(calibration_data)
    original_time = time.time() - start
    
    start = time.time()
    for _ in range(1000):
        with torch.no_grad():
            quantized_model(calibration_data)
    quantized_time = time.time() - start
    
    print(f"Original: {original_time:.3f}s")
    print(f"Quantized: {quantized_time:.3f}s")
    print(f"Speedup: {original_time / quantized_time:.2f}x")
    
    return quantized_model

quantized = quantize_model(model, X_test[:100])
torch.save(quantized.state_dict(), 'models/quantized_model.pt')
```

ONNX Runtime is another optimization layer. It takes models exported in ONNX format and applies graph optimizations, operator fusion, and hardware-specific optimizations. Operator fusion combines multiple operations into a single kernel, reducing memory access and improving cache utilization. ONNX supports both PyTorch and TensorFlow models.

```python
import onnxruntime as ort
import numpy as np

def export_to_onnx(model, input_shape, output_path):
    import torch
    dummy_input = torch.randn(1, *input_shape)
    torch.onnx.export(
        model, dummy_input, output_path,
        opset_version=13,
        input_names=['features'],
        output_names=['predictions'],
        dynamic_axes={
            'features': {0: 'batch_size'},
            'predictions': {0: 'batch_size'}
        }
    )

def benchmark_onnx(output_path, test_data, num_runs=1000):
    session = ort.InferenceSession(output_path)
    start = time.time()
    for _ in range(num_runs):
        session.run(None, {'features': test_data.numpy().astype(np.float32)})
    elapsed = time.time() - start
    print(f"ONNX Runtime: {elapsed:.3f}s for {num_runs} inferences")
    print(f"Average latency: {elapsed / num_runs * 1000:.2f}ms")
    return elapsed

export_to_onnx(model, (128,), 'models/model.onnx')
benchmark_onnx('models/model.onnx', X_test[:100])
```

## Batch Prediction Pipelines

Not all predictions need real-time responses. If you are scoring millions of records for a weekly report, batch prediction is more efficient. It processes data in large chunks, maximizes GPU utilization, and writes results to a database or file system.

Batch prediction is fundamentally different from online serving. Online serving optimizes for latencyeach request must complete quickly. Batch prediction optimizes for throughputprocess as many records as possible per second. This means larger batch sizes, more aggressive parallelization, and less concern about individual record latency.

```python
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import torch

class BatchPredictor:
    def __init__(self, model, batch_size=1024, device='cuda'):
        self.model = model
        self.batch_size = batch_size
        self.device = device
        self.model.to(device)
        self.model.eval()
    
    def predict_batch(self, features: np.ndarray) -> np.ndarray:
        all_predictions = []
        all_probabilities = []
        
        for i in range(0, len(features), self.batch_size):
            batch = features[i:i + self.batch_size]
            tensor = torch.tensor(batch, dtype=torch.float32).to(self.device)
            with torch.no_grad():
                output = self.model(tensor)
                probabilities = torch.softmax(output, dim=1)
                predictions = torch.argmax(probabilities, dim=1)
            all_predictions.extend(predictions.cpu().numpy())
            all_probabilities.extend(probabilities.cpu().numpy()[:, 1])
        
        return np.array(all_predictions), np.array(all_probabilities)
    
    def run_batch_job(self, input_path: str, output_path: str, chunk_size: int = 100000):
        start_time = datetime.utcnow()
        print(f"Starting batch prediction at {start_time}")
        
        results = []
        total_rows = 0
        
        for chunk in pd.read_csv(input_path, chunksize=chunk_size):
            features = chunk.drop(
                columns=['transaction_id', 'timestamp'], errors='ignore'
            ).values.astype(np.float32)
            predictions, probabilities = self.predict_batch(features)
            chunk['prediction'] = predictions
            chunk['fraud_probability'] = probabilities
            results.append(chunk)
            total_rows += len(chunk)
            print(f"Processed {total_rows:,} rows")
        
        result_df = pd.concat(results, ignore_index=True)
        output_file = Path(output_path)
        output_file.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        result_df.to_parquet(output_file / f'predictions_{timestamp}.parquet', index=False)
        
        summary = {
            'total_rows': total_rows,
            'fraud_predictions': int(result_df['prediction'].sum()),
            'avg_fraud_probability': float(result_df['fraud_probability'].mean()),
            'completion_time': datetime.utcnow().isoformat(),
            'duration_seconds': (datetime.utcnow() - start_time).total_seconds()
        }
        
        import json
        with open(output_file / 'batch_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"Batch prediction complete: {summary}")
        return result_df

predictor = BatchPredictor(model, batch_size=2048, device='cuda')
results = predictor.run_batch_job('data/transactions.csv', 'output/predictions')
```

The chunked processing is essential for large datasets. Loading a 10GB CSV into memory will crash most machines. Processing it in 100K-row chunks keeps memory usage bounded while maintaining good throughput. The Parquet output format is columnar, which is more efficient for analytical queries than CSV.

## Model Fallback and Circuit Breakers

When your model service goes down, you need a fallback. The simplest fallback is the previous model version. If the new model crashes, fall back to the old one. If all model versions fail, fall back to a heuristic. The circuit breaker pattern prevents cascading failures by stopping requests to a failing service and allowing it to recover.

```python
import time
from functools import wraps

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60.0, expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'closed'
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == 'open':
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = 'half-open'
                else:
                    raise CircuitBreakerOpenError("Circuit breaker is open")
            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except self.expected_exception as e:
                self._on_failure()
                raise
        return wrapper
    
    def _on_success(self):
        self.failure_count = 0
        self.state = 'closed'
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = 'open'

class CircuitBreakerOpenError(Exception):
    pass

class ModelService:
    def __init__(self, models, fallback_heuristic):
        self.models = models
        self.current_version = 'v2'
        self.fallback_heuristic = fallback_heuristic
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
    
    @CircuitBreaker(failure_threshold=3, recovery_timeout=30)
    def predict(self, features):
        model = self.models[self.current_version]
        return model.predict(features)
    
    def predict_with_fallback(self, features):
        try:
            return self.predict(features)
        except CircuitBreakerOpenError:
            return self.fallback_heuristic(features)

service = ModelService(
    models={'v1': model_v1, 'v2': model_v2},
    fallback_heuristic=lambda f: 1 if f[0] > 0.8 else 0
)
```

The circuit breaker transitions through three states. Closed means the service is healthy and requests pass through. Open means the service has failed too many times and requests are rejected immediately without hitting the service. Half-open means the circuit breaker allows a single test request through. If it succeeds, the circuit closes. If it fails, it opens again. This pattern prevents both cascading failures and thundering herds when the service recovers.

## Containerization for Consistent Deployment

Docker ensures your model runs in the same environment in production as it did during development. The Dockerfile captures all dependencies, system libraries, and configuration. Without containers, the "it works on my machine" problem causes countless production incidents.

```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY models/ /app/models/
COPY src/ /app/src/
ENV MODEL_PATH=/app/models/current/model.pt
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

The health check is essential for orchestration. Kubernetes and Docker Swarm use health checks to determine whether a container is ready to receive traffic. Without it, traffic is routed to containers that are still loading models, causing timeouts and errors. The `--start-period=5s` gives the container 5 seconds to start before health checks begin, preventing false negatives during model loading.

## Model Caching and Connection Pooling

In production, the same model is loaded by multiple worker processes. Loading a 2GB model into each worker wastes memory and slows startup. Model caching solves this by loading the model once in shared memory and having all workers access it.

```python
import mmap
import pickle
from multiprocessing import shared_memory
import numpy as np

class ModelCache:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.shm_name = None
        self.model = None
    
    def load_to_shared_memory(self):
        with open(self.model_path, 'rb') as f:
            model_bytes = f.read()
        
        # Create shared memory block
        self.shm = shared_memory.SharedMemory(
            create=True, size=len(model_bytes)
        )
        self.shm_name = self.shm.name
        
        # Copy model bytes to shared memory
        self.shm.buf[:len(model_bytes)] = model_bytes
        
        print(f"Model loaded to shared memory: {self.shm_name}")
        print(f"Shared memory size: {len(model_bytes) / 1e6:.1f}MB")
    
    def load_from_shared_memory(self):
        if self.shm_name is None:
            raise ValueError("No shared memory block found")
        
        existing_shm = shared_memory.SharedMemory(name=self.shm_name)
        model_bytes = bytes(existing_shm.buf)
        self.model = pickle.loads(model_bytes)
        existing_shm.close()
        
        return self.model
    
    def cleanup(self):
        if self.shm:
            self.shm.close()
            self.shm.unlink()

class ConnectionPool:
    def __init__(self, model_factory, max_connections: int = 10):
        self.model_factory = model_factory
        self.max_connections = max_connections
        self.available = []
        self.in_use = 0
        self.lock = threading.Lock()
    
    def get_model(self):
        with self.lock:
            if self.available:
                return self.available.pop()
            elif self.in_use < self.max_connections:
                self.in_use += 1
                return self.model_factory()
            else:
                raise RuntimeError("No available model instances")
    
    def return_model(self, model):
        with self.lock:
            self.available.append(model)
            self.in_use -= 1

# Usage
cache = ModelCache('models/fraud_detector.pt')
cache.load_to_shared_memory()

# In each worker process
model = cache.load_from_shared_memory()
```

Connection pooling is essential when your model service handles concurrent requests. Each request needs access to the model, but you cannot load the model into every thread. A connection pool maintains a fixed number of model instances and hands them out on request. When a request completes, the model instance is returned to the pool.

The pool size should match the number of concurrent inference operations your GPU can handle. For a single GPU, the pool size is typically 1-2 because GPU operations are serialized. For CPU inference, the pool size can be larger because CPU operations can run in parallel.

## Deployment Patterns: Blue-Green and Rolling Updates

Blue-green deployment maintains two identical production environments. The blue environment serves current traffic. When you deploy a new version, you deploy to the green environment, test it, and switch the load balancer from blue to green. If something goes wrong, you switch back to blue instantly.

Rolling update deployment gradually replaces old instances with new ones. You start one new instance, verify it is healthy, shut down one old instance, and repeat until all instances are updated. This uses less infrastructure than blue-green but takes longer and is harder to rollback.

```python
class BlueGreenDeployment:
    def __init__(self, load_balancer_config: dict):
        self.blue_env = {'status': 'active', 'version': 'v1.0.0', 'instances': []}
        self.green_env = {'status': 'inactive', 'version': None, 'instances': []}
        self.lb_config = load_balancer_config
    
    def deploy(self, new_version: str, instances: list):
        target = self.green_env if self.blue_env['status'] == 'active' else self.blue_env
        
        target['version'] = new_version
        target['instances'] = instances
        target['status'] = 'deploying'
        
        # Health check new instances
        healthy = all(self._health_check(inst) for inst in instances)
        
        if not healthy:
            target['status'] = 'failed'
            raise ValueError(f"Deployment of {new_version} failed health checks")
        
        # Switch traffic
        self._switch_traffic(target)
        
        # Update status
        if target == self.green_env:
            self.blue_env['status'] = 'inactive'
            self.green_env['status'] = 'active'
        else:
            self.green_env['status'] = 'inactive'
            self.blue_env['status'] = 'active'
        
        print(f"Deployed {new_version} successfully")
    
    def rollback(self):
        current = self.green_env if self.green_env['status'] == 'active' else self.blue_env
        previous = self.blue_env if self.green_env['status'] == 'active' else self.green_env
        
        if previous['version'] is None:
            raise ValueError("No previous version to rollback to")
        
        self._switch_traffic(previous)
        current['status'] = 'inactive'
        previous['status'] = 'active'
        
        print(f"Rolled back to {previous['version']}")
    
    def _health_check(self, instance: dict) -> bool:
        import requests
        try:
            resp = requests.get(f"http://{instance['host']}:{instance['port']}/health", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False
    
    def _switch_traffic(self, target: dict):
        print(f"Switching traffic to {target['version']}")
        # In production, this updates the load balancer configuration

class RollingUpdate:
    def __init__(self, instances: list, batch_size: int = 1):
        self.instances = instances
        self.batch_size = batch_size
    
    def deploy(self, new_version: str, health_check_fn):
        total = len(self.instances)
        updated = 0
        
        while updated < total:
            batch = self.instances[updated:updated + self.batch_size]
            
            for instance in batch:
                # Deploy new version to instance
                self._deploy_to_instance(instance, new_version)
                
                # Wait for health check
                if not health_check_fn(instance):
                    raise ValueError(f"Instance {instance} failed health check")
                
                updated += 1
                print(f"Updated {updated}/{total} instances")
            
            # Verify batch before proceeding
            if not self._verify_batch(batch):
                self._rollback_batch(batch)
                raise ValueError(f"Batch verification failed, rolled back")
    
    def _deploy_to_instance(self, instance, version):
        print(f"Deploying {version} to {instance}")
    
    def _verify_batch(self, batch):
        return True
    
    def _rollback_batch(self, batch):
        print(f"Rolling back batch: {batch}")
```

Blue-green deployment is safer because rollback is instantyou just switch the load balancer back. The downside is that you need double the infrastructure during deployment. Rolling updates use less infrastructure but rollback is slower because you need to redeploy the previous version to each instance.

## Load Testing and Capacity Planning

Before deploying to production, you must test how many requests your model service can handle. Load testing reveals the maximum throughput, the latency at different concurrency levels, and the failure point where the service becomes unstable.

```python
import asyncio
import aiohttp
import time
import statistics

class LoadTester:
    def __init__(self, url: str, num_requests: int, concurrency: int):
        self.url = url
        self.num_requests = num_requests
        self.concurrency = concurrency
        self.results = []
    
    async def send_request(self, session):
        payload = {"features": [0.1] * 128}
        
        start = time.time()
        async with session.post(self.url, json=payload) as response:
            await response.json()
            latency = (time.time() - start) * 1000
            self.results.append({
                'status': response.status,
                'latency_ms': latency
            })
    
    async def run(self):
        semaphore = asyncio.Semaphore(self.concurrency)
        
        async def bounded_request(session):
            async with semaphore:
                await self.send_request(session)
        
        async with aiohttp.ClientSession() as session:
            tasks = [bounded_request(session) for _ in range(self.num_requests)]
            await asyncio.gather(*tasks)
        
        return self.analyze()
    
    def analyze(self):
        latencies = [r['latency_ms'] for r in self.results]
        statuses = [r['status'] for r in self.results]
        
        return {
            'total_requests': len(self.results),
            'successful': sum(1 for s in statuses if s == 200),
            'failed': sum(1 for s in statuses if s != 200),
            'p50_latency': statistics.median(latencies),
            'p95_latency': sorted(latencies)[int(len(latencies) * 0.95)],
            'p99_latency': sorted(latencies)[int(len(latencies) * 0.99)],
            'avg_latency': statistics.mean(latencies),
            'throughput_rps': len(self.results) / (max(latencies) / 1000),
        }

tester = LoadTester(
    url='http://localhost:8000/predict',
    num_requests=1000,
    concurrency=50
)

results = asyncio.run(tester.run())
print(f"Throughput: {results['throughput_rps']:.0f} req/s")
print(f"P50: {results['p50_latency']:.1f}ms, P95: {results['p95_latency']:.1f}ms, P99: {results['p99_latency']:.1f}ms")
print(f"Success rate: {results['successful']}/{results['total_requests']}")
```

Capacity planning uses load test results to determine how many instances you need. If your service handles 500 req/s per instance and you expect 5000 req/s peak traffic, you need at least 10 instances. Add a 50% buffer for safety, giving you 15 instances. This calculation is the foundation of auto-scaling configuration.

## Assessment

### Lab Task 1: Deploy a Model with FastAPI (Time: 90 minutes)

Build a production-ready model serving API.

**Steps:**
1. Create a FastAPI application with a `/predict` endpoint.
2. Add input validation with Pydantic models.
3. Implement a `ModelManager` class that loads models and supports hot-reloading.
4. Add a `/health` endpoint that returns model version and status.
5. Add a `/reload` endpoint that loads a new model version without downtime.
6. Implement request logging with latency tracking.
7. Write a Dockerfile and build the container.

**Grading Criteria:**
- API accepts and validates input correctly (15 points)
- Model loading and prediction work end-to-end (20 points)
- Hot-reload loads new model without downtime (15 points)
- Health check returns correct status (10 points)
- Request logging captures latency and errors (10 points)
- Dockerfile builds and runs successfully (15 points)
- Code handles edge cases (empty input, wrong dimensions) (15 points)

### Lab Task 2: Optimize Inference (Time: 75 minutes)

Optimize a model for production inference using quantization and ONNX.

**Steps:**
1. Export a PyTorch model to ONNX format.
2. Benchmark PyTorch inference vs. ONNX Runtime inference.
3. Apply dynamic quantization to the PyTorch model.
4. Benchmark quantized vs. original model.
5. Create a comparison table with latency and throughput for all configurations.

**Grading Criteria:**
- ONNX export succeeds with correct input/output names (15 points)
- ONNX benchmarking measures latency and throughput (15 points)
- Quantization reduces model size by at least 50% (15 points)
- Quantized model accuracy degrades by less than 2% (15 points)
- Comparison table includes all four configurations (15 points)
- Speedup ratios are correctly calculated (15 points)
- Results are interpreted with recommendations (10 points)

### Lab Task 3: Build a Batch Prediction Pipeline (Time: 60 minutes)

Build a batch prediction pipeline that processes large datasets.

**Steps:**
1. Implement a `BatchPredictor` class that processes data in chunks.
2. Support configurable batch sizes.
3. Write predictions to Parquet with timestamps.
4. Generate a batch summary with statistics (total rows, fraud count, avg probability).
5. Handle the case where input data exceeds available memory.

**Grading Criteria:**
- Chunked processing handles datasets larger than memory (20 points)
- Batch size is configurable and affects performance (15 points)
- Output Parquet files are correctly formatted (15 points)
- Summary statistics are accurate and complete (15 points)
- Pipeline handles missing values in input data (15 points)
- Logging shows progress for each chunk (10 points)
- Output directory structure is organized by timestamp (10 points)

## Evidence

- `serving_api.py`: FastAPI serving application with model management and health checks
- `Dockerfile`: Container definition for the serving API
- `batch_predictor.py`: Batch prediction pipeline with chunked processing
- `onnx_export.py`: Script to export and benchmark ONNX models
- `quantize_model.py`: Model quantization script with before/after benchmarks
- `circuit_breaker.py`: Circuit breaker implementation for fault tolerance
- `benchmark_results.csv`: Comparison of inference latency across all configurations
