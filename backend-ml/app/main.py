"""
ChurnGuard - FastAPI inference service
Phase 1, Step 4

Run with: uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(title="ChurnGuard ML Service")

# Allow the React frontend (and Express, if it calls this directly)
# to reach this API during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

model = joblib.load(os.path.join(MODEL_DIR, "churn_model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
feature_columns = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))
model_type = joblib.load(os.path.join(MODEL_DIR, "model_type.pkl"))


class CustomerInput(BaseModel):
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float


def preprocess_single(customer: CustomerInput) -> pd.DataFrame:
    """
    Turns one customer's raw field values into the exact same
    one-hot-encoded shape the model was trained on.

    This is the training-serving skew risk mentioned earlier: if this
    logic ever drifts from data_prep.py's encode_features(), predictions
    silently become wrong without erroring - so pd.get_dummies followed
    by reindex() to the saved training columns is the safeguard. Any
    category the model never saw in training becomes all-zeros across
    its dummy columns, and any expected column missing from this single
    row also gets filled with 0 by reindex.
    """
    df = pd.DataFrame([customer.model_dump()])
    df_encoded = pd.get_dummies(df)
    df_encoded = df_encoded.reindex(columns=feature_columns, fill_value=0)
    return df_encoded


@app.get("/")
def root():
    return {"status": "ok", "model_type": model_type}


@app.post("/predict")
def predict(customer: CustomerInput):
    try:
        X = preprocess_single(customer)
        if scaler is not None:
            X = scaler.transform(X)
        proba = model.predict_proba(X)[0][1]
        prediction = int(proba >= 0.5)
        return {
            "churn_probability": round(float(proba), 4),
            "prediction": "Churn" if prediction == 1 else "No Churn",
            "risk_level": (
                "High" if proba >= 0.6 else "Medium" if proba >= 0.3 else "Low"
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
