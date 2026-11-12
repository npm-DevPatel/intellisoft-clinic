from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "model.pkl"
FEATURES = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate"]

_model = None


def _load():
    global _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    return _model


def predict(
    age: int,
    systolic_bp: int,
    diastolic_bp: int,
    blood_sugar: float,
    body_temp_c: float,
    heart_rate: int,
) -> str | None:
    """Returns "Low Risk", "Mid Risk" or "High Risk", or None if no model is trained yet."""
    model = _load()
    if model is None:
        return None

    # the training data records temperature in Fahrenheit
    temp_f = body_temp_c * 9 / 5 + 32
    row = pd.DataFrame(
        [[age, systolic_bp, diastolic_bp, blood_sugar, temp_f, heart_rate]],
        columns=FEATURES,
    )
    return str(model.predict(row)[0]).title()