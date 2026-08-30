# Module 4 — Model Deployment: Serving, Inference Optimization

## What You'll Actually Do

You'll take a trained model and make it available as an API. You'll optimize inference latency so it actually works in production.

## Content

### Flask Model Server

```python
from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = np.array(data["features"]).reshape(1, -1)
    prediction = model.predict(features).tolist()
    probability = model.predict_proba(features).max().tolist()
    return jsonify({
        "prediction": prediction,
        "confidence": probability
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### FastAPI with Async Inference

```python
from fastapi import FastAPI
from pydantic import BaseModel
import onnxruntime as ort

app = FastAPI()
session = ort.InferenceSession("model.onnx")

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: int
    confidence: float

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    input_data = np.array(req.features, dtype=np.float32).reshape(1, -1)
    outputs = session.run(None, {"input": input_data})
    prediction = int(outputs[0][0])
    confidence = float(np.max(outputs[1]))
    return PredictResponse(prediction=prediction, confidence=confidence)
```

### Model Export with ONNX

```python
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [("input", FloatTensorType([None, X_train.shape[1]]))]
onnx_model = convert_sklearn(model, initial_types=initial_type)

with open("model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
```

### Quantization for Faster Inference

```python
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    "model.onnx",
    "model_quant.onnx",
    weight_type=QuantType.QInt8
)
```

### Batch Inference

```python
def predict_batch(model, data, batch_size=32):
    predictions = []
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        preds = model.predict(batch)
        predictions.extend(preds)
    return np.array(predictions)
```

## Assessment

**Lab: Deploy a Model as an API**

Train a model on any sklearn dataset, export it to ONNX, and build a FastAPI server with both single and batch prediction endpoints. Measure and report inference latency for 1, 10, 100, and 1000 predictions.

- Time: 55 minutes
- Grading: API correctness (30%), ONNX conversion (20%), batch endpoint (20%), latency measurements and analysis (30%)

## Evidence

Upload your FastAPI code, ONNX model file, and a latency comparison table showing single vs batch inference times.
