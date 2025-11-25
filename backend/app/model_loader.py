from __future__ import annotations

import json
import math
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence

import numpy as np

try:
    import joblib
except ImportError:  # pragma: no cover - optional
    joblib = None

from .config import FEATURE_ORDER, settings

CLASS_LABELS = ["Low", "Medium", "High"]


def _load_pickle(path: Path):
    if not path.exists():
        return None
    try:
        if joblib:
            return joblib.load(path)
        with path.open("rb") as fh:
            return pickle.load(fh)
    except Exception as exc:  # pragma: no cover - load failures shouldn't crash service startup
        print(f"[model_loader] Failed to load {path}: {exc}")
        return None


@dataclass
class FeaturePreprocessor:
    feature_order: Sequence[str]
    scaler: object | None = None

    def transform(self, features: dict[str, float]) -> np.ndarray:
        vector = np.array([float(features.get(name, 0.0)) for name in self.feature_order], dtype=float)
        if self.scaler is not None:
            try:
                vector = self.scaler.transform([vector])[0]
            except Exception as exc:
                print(f"[FeaturePreprocessor] scaler transform failed: {exc}")
        return vector


class MockModel:
    version = "mock-heuristic"

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        probs = []
        for row in X:
            # simple heuristic: scheduling + constraint drive high load, idle ratio low drives medium.
            scheduling = float(row[FEATURE_ORDER.index("scheduling_difficulty")]) if "scheduling_difficulty" in FEATURE_ORDER else 0
            constraint = float(row[FEATURE_ORDER.index("constraint_violation_rate")]) if "constraint_violation_rate" in FEATURE_ORDER else 0
            idle = float(row[FEATURE_ORDER.index("idle_time_ratio")]) if "idle_time_ratio" in FEATURE_ORDER else 0
            high_score = min(1.0, scheduling * 0.6 + constraint * 0.4)
            medium_score = min(1.0, idle * 0.6 + 0.2)
            low_score = max(0.05, 1.0 - (high_score + medium_score))
            total = high_score + medium_score + low_score
            probs.append([low_score / total, medium_score / total, high_score / total])
        return np.array(probs)

    def predict(self, X: np.ndarray) -> np.ndarray:
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)


class ModelBundle:
    def __init__(self, model, preprocessor: FeaturePreprocessor):
        self.model = model
        self.preprocessor = preprocessor
        self.version = getattr(model, "version", "unknown")

    def predict(self, features: dict[str, float]):
        vector = self.preprocessor.transform(features)
        proba = self.model.predict_proba(np.array([vector]))[0]
        idx = int(np.argmax(proba))
        return vector, proba, CLASS_LABELS[idx]


def load_model_bundle() -> ModelBundle:
    scaler = _load_pickle(settings.scaler_path)
    model = _load_pickle(settings.model_path)

    if model is None:
        if not settings.allow_mock_model:
            raise RuntimeError("Model artifacts missing and mock model disabled.")
        model = MockModel()

    # expose version metadata if stored in JSON next to model
    version_file = settings.model_path.with_suffix(".json")
    if version_file.exists():
        try:
            with version_file.open("r", encoding="utf-8") as fh:
                metadata = json.load(fh)
            model.version = metadata.get("version", model.version)
        except json.JSONDecodeError:
            pass

    preprocessor = FeaturePreprocessor(feature_order=FEATURE_ORDER, scaler=scaler)
    return ModelBundle(model=model, preprocessor=preprocessor)
