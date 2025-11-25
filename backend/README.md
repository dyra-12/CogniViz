# CogniViz Inference Service

FastAPI microservice that accepts aggregated telemetry features and returns cognitive load predictions via REST (`POST /predict`) or WebSocket streaming (`/ws/metrics`).

## Features
- Loads the trained RandomForest model, scaler, and `FEATURE_ORDER` from `backend/models`.
- Falls back to a heuristic mock model when artifacts are missing (useful for local dev).
- Provides SHAP-based explanations (TreeExplainer when available, heuristic otherwise).
- Supports both JSON requests and streaming telemetry frames.

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Place your artifacts inside `backend/models/` as described in `backend/models/README.md`.

## Running the API
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open http://localhost:8000/docs for interactive API exploration.

## Example REST Request
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "schemaVersion": 1,
    "features": {
      "scheduling_difficulty": 0.45,
      "constraint_violation_rate": 0.1,
      "idle_time_ratio": 0.12
    }
  }'
```

## WebSocket Streaming
Connect to `ws://localhost:8000/ws/metrics` and send the same payload shape as JSON strings:
```json
{
  "id": 1,
  "type": "metrics",
  "protocolVersion": 1,
  "features": {
    "schemaVersion": 1,
    "features": { ... }
  }
}
```
Each message receives a `{"type": "prediction", "payload": ...}` response with load class, probabilities, SHAP contributions, and explanatory text.
