from __future__ import annotations

import asyncio
import json
import time
from typing import Dict

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import FEATURE_ORDER, settings
from .model_loader import CLASS_LABELS, ModelBundle, load_model_bundle
from .schemas import (
    ErrorResponse,
    FeaturePayload,
    HealthResponse,
    MetricsPacket,
    PredictionResponse,
    ShapContribution,
)
from .shap_utils import SHAPProvider

app = FastAPI(title="CogniViz Cognitive Load Inference", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"]
    ,
    allow_headers=["*"],
)


class PredictionService:
    def __init__(self) -> None:
        self.bundle: ModelBundle = load_model_bundle()
        self.shap = SHAPProvider(self.bundle.model, FEATURE_ORDER)

    def _build_response(self, probabilities, label: str, feature_vector) -> PredictionResponse:
        shap_values = self.shap.explain(feature_vector)
        explanation = self._explanation_from_shap(label, shap_values)
        probs_dict = {
            CLASS_LABELS[i]: float(probabilities[i])
            for i in range(len(probabilities))
        }
        return PredictionResponse(
            loadClass=label,
            probabilities=probs_dict,  # type: ignore[arg-type]
            explanation=explanation,
            shap=[ShapContribution(**item) for item in shap_values],
            receivedAt=int(time.time() * 1000),
            modelVersion=self.bundle.version,
        )

    def _explanation_from_shap(self, label: str, shap_values) -> str:
        if not shap_values:
            return f"Prediction leans {label.lower()} based on available metrics."
        top = shap_values[0]
        direction = "increasing" if top["contribution"] >= 0 else "reducing"
        return f"{label} load driven by {top['feature']} {direction} load."

    def predict_from_features(self, features: Dict[str, float]) -> PredictionResponse:
        vector, probabilities, label = self.bundle.predict(features)
        return self._build_response(probabilities, label, vector)

    def handle_metrics_packet(self, packet: MetricsPacket) -> PredictionResponse:
        return self.predict_from_features(packet.features.features)


service = PredictionService()


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        modelLoaded=service.bundle.model is not None,
        mockMode=service.bundle.version.startswith("mock"),
    )


@app.post("/predict", response_model=PredictionResponse, responses={400: {"model": ErrorResponse}})
def predict(payload: FeaturePayload):
    if not payload.features:
        raise HTTPException(status_code=400, detail="Missing features dictionary")
    return service.predict_from_features(payload.features)


@app.websocket("/ws/metrics")
async def metrics_websocket(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            message = await ws.receive_text()
            try:
                packet = MetricsPacket.model_validate_json(message)
            except Exception as exc:  # pragma: no cover - validation feedback
                await ws.send_json({"type": "error", "detail": str(exc)})
                continue
            prediction = service.handle_metrics_packet(packet)
            await ws.send_json({"type": "prediction", "payload": json.loads(prediction.model_dump_json())})
    except WebSocketDisconnect:
        return
    except Exception as exc:
        await ws.send_json({"type": "error", "detail": str(exc)})


@app.on_event("shutdown")
async def shutdown_event():
    # placeholder in case we need async cleanup later
    await asyncio.sleep(0)
