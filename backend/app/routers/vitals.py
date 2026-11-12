from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Patient, Vitals
from ..schemas import VitalsCreate, VitalsOut
from ..services.age import calculate_age
from ..services.bmi import bmi_status, calculate_bmi, next_form
from ..services.risk_model import predict

router = APIRouter(prefix="/patients/{patient_id}/vitals", tags=["vitals"])


@router.post("", response_model=VitalsOut, status_code=201)
def record_vitals(patient_id: str, data: VitalsCreate, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    if data.visit_date < patient.date_of_birth:
        raise HTTPException(422, "Visit date is before the patient's date of birth")

    bmi = calculate_bmi(data.height_cm, data.weight_kg)

    risk = None
    if data.systolic_bp is not None:
        risk = predict(
            age=calculate_age(patient.date_of_birth, data.visit_date),
            systolic_bp=data.systolic_bp,
            diastolic_bp=data.diastolic_bp,
            blood_sugar=data.blood_sugar,
            body_temp_c=data.body_temp_c,
            heart_rate=data.heart_rate,
        )

    record = Vitals(
        patient_id=patient_id, **data.model_dump(), bmi=bmi, risk_level=risk
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Vitals already recorded for this patient on that date")
    db.refresh(record)

    return VitalsOut(
        id=record.id,
        patient_id=record.patient_id,
        visit_date=record.visit_date,
        height_cm=record.height_cm,
        weight_kg=record.weight_kg,
        bmi=record.bmi,
        bmi_status=bmi_status(record.bmi),
        next_form=next_form(record.bmi),
        risk_level=record.risk_level,
    )