from fastapi import APIRouter, HTTPException

from ..schemas import RiskRequest, RiskResponse
from ..services.risk_model import predict

router = APIRouter(tags=["risk"])


@router.post("/predict-risk", response_model=RiskResponse)
def predict_risk(data: RiskRequest):
    result = predict(**data.model_dump())
    if result is None:
        raise HTTPException(503, "Risk model is not available. Train it first.")
    return RiskResponse(risk_level=result)