from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Patient, VisitForm, Vitals
from ..schemas import VisitFormCreate, VisitFormOut
from ..services.bmi import next_form

router = APIRouter(prefix="/patients/{patient_id}/visit-forms", tags=["visit forms"])


@router.post("", response_model=VisitFormOut, status_code=201)
def submit_form(patient_id: str, data: VisitFormCreate, db: Session = Depends(get_db)):
    if not db.get(Patient, patient_id):
        raise HTTPException(404, "Patient not found")

    vitals = db.scalar(
        select(Vitals).where(
            Vitals.patient_id == patient_id, Vitals.visit_date == data.visit_date
        )
    )
    if vitals is None:
        raise HTTPException(422, "Record vitals for this visit date first")

    expected = next_form(vitals.bmi)
    if data.form_type != expected:
        raise HTTPException(
            422, f"BMI is {vitals.bmi}, so the {expected} assessment form applies"
        )

    form = VisitForm(patient_id=patient_id, **data.model_dump())
    db.add(form)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This form was already submitted for that date")
    db.refresh(form)
    return form


@router.get("", response_model=list[VisitFormOut])
def list_forms(patient_id: str, db: Session = Depends(get_db)):
    if not db.get(Patient, patient_id):
        raise HTTPException(404, "Patient not found")
    return db.scalars(
        select(VisitForm)
        .where(VisitForm.patient_id == patient_id)
        .order_by(VisitForm.visit_date)
    ).all()