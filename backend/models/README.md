# Model Artifacts

Place the trained artifacts for the cognitive load classifier in this directory:

- `random_forest.pkl` – scikit-learn RandomForestClassifier (or compatible) saved via joblib/pickle.
- `scaler.pkl` – preprocessing scaler (e.g., StandardScaler) used during training.
- `feature_order.json` – JSON array listing feature names in the exact order expected by the model.
- `random_forest.json` (optional) – metadata file containing `{ "version": "v1.0.0" }` to expose model version.

During development you can omit these files and the backend will fall back to the built-in heuristic mock model (controlled by `allow_mock_model`).
