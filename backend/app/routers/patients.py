from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Patient
from ..schemas import PatientCreate, PatientListItem, PatientOut
from ..services.age import calculate_age
from ..services.bmi import bmi_status

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=201)
def register_patient(data: PatientCreate, db: Session = Depends(get_db)):
    if db.get(Patient, data.patient_id):
        raise HTTPException(409, "A patient with this ID is already registered")

    patient = Patient(**data.model_dump())
    db.add(patient)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A patient with this ID is already registered")
    return patient


@router.get("", response_model=list[PatientListItem])
def list_patients(visit_date: date | None = None, db: Session = Depends(get_db)):
    patients = db.scalars(
        select(Patient)
        .options(selectinload(Patient.vitals))
        .order_by(Patient.first_name, Patient.last_name)
    ).all()

    items = []
    for p in patients:
        if visit_date:
            record = next((v for v in p.vitals if v.visit_date == visit_date), None)
            if record is None:
                continue
        else:
            record = p.vitals[-1] if p.vitals else None

        items.append(
            PatientListItem(
                patient_id=p.patient_id,
                name=f"{p.first_name} {p.last_name}",
                age=calculate_age(p.date_of_birth),
                bmi=record.bmi if record else None,
                bmi_status=bmi_status(record.bmi) if record else None,
                last_visit_date=record.visit_date if record else None,
            )
        )
    return items


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient