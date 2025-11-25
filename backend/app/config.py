from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List


PROJECT_ROOT = Path(os.getenv("COGNIVIZ_BACKEND_ROOT", Path(__file__).resolve().parents[2]))
MODELS_DIR = PROJECT_ROOT / "backend" / "models"
DEFAULT_FEATURE_ORDER = [
    "form_hesitation_index",
    "form_efficiency",
    "form_error_rate",
    "zip_code_struggle",
    "decision_uncertainty",
    "exploration_breadth",
    "rapid_hovers",
    "filter_optimization_score",
    "scheduling_difficulty",
    "constraint_violation_rate",
    "budget_management_stress",
    "drag_attempts",
    "multitasking_load",
    "recovery_efficiency",
    "mouse_entropy_avg",
    "idle_time_ratio",
    "action_density",
]


def load_feature_order(path: Path | None = None) -> List[str]:
    candidate = path or MODELS_DIR / "feature_order.json"
    if candidate.exists():
        try:
            with candidate.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, list) and all(isinstance(item, str) for item in data):
                return data
        except json.JSONDecodeError:
            pass
    return DEFAULT_FEATURE_ORDER


@dataclass
class Settings:
    model_path: Path = MODELS_DIR / "random_forest.pkl"
    scaler_path: Path = MODELS_DIR / "scaler.pkl"
    feature_order_path: Path = MODELS_DIR / "feature_order.json"
    allow_mock_model: bool = True
    prediction_history_size: int = 200


settings = Settings()
FEATURE_ORDER = load_feature_order(settings.feature_order_path)
