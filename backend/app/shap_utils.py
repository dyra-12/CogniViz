from __future__ import annotations

from typing import Dict, List, Sequence

import numpy as np

try:  # shap is optional; degrade gracefully if unavailable
    import shap  # type: ignore
except ImportError:  # pragma: no cover - fallback path
    shap = None


class SHAPProvider:
    def __init__(self, model, feature_order: Sequence[str]):
        self.feature_order = list(feature_order)
        self.enabled = shap is not None
        self.explainer = None
        if self.enabled:
            try:
                self.explainer = shap.TreeExplainer(model)
            except Exception as exc:
                print(f"[SHAP] TreeExplainer init failed, falling back to heuristic: {exc}")
                self.enabled = False

    def explain(self, vector: np.ndarray) -> List[Dict[str, float]]:
        if self.enabled and self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(vector.reshape(1, -1))
                # shap returns per-class array; use highest-probability class (last axis)
                if isinstance(shap_values, list):
                    shap_array = np.array(shap_values[-1][0])
                else:
                    shap_array = shap_values[0]
                return self._top_k(shap_array, vector)
            except Exception as exc:
                print(f"[SHAP] explanation failed: {exc}")
        return self._top_k(vector, vector)

    def _top_k(self, contributions: np.ndarray, values: np.ndarray, k: int = 5) -> List[Dict[str, float]]:
        indices = np.argsort(np.abs(contributions))[::-1][:k]
        return [
            {
                "feature": self.feature_order[i],
                "value": float(values[i]),
                "contribution": float(contributions[i]),
            }
            for i in indices
        ]
