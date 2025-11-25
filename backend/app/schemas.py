from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class FeaturePayload(BaseModel):
    schemaVersion: int = Field(1, ge=1)
    features: Dict[str, float]
    source: Optional[str] = None
    emittedAt: Optional[int] = None
    intervalMs: Optional[int] = Field(None, ge=1)


class MetricsPacket(BaseModel):
    id: Optional[int] = None
    type: str = Field("metrics")
    protocolVersion: int = Field(1, ge=1)
    sentAt: Optional[int] = None
    features: FeaturePayload


class PredictionProbabilities(BaseModel):
    Low: float
    Medium: float
    High: float


class ShapContribution(BaseModel):
    feature: str
    value: float
    contribution: float


class PredictionResponse(BaseModel):
    loadClass: str
    probabilities: PredictionProbabilities
    explanation: str
    shap: List[ShapContribution]
    receivedAt: int
    modelVersion: str


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
    mockMode: bool


class ErrorResponse(BaseModel):
    detail: str
