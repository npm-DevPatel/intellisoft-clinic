from datetime import date

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    registration_date: Mapped[date]
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    date_of_birth: Mapped[date]
    gender: Mapped[str] = mapped_column(String(10))

    vitals: Mapped[list["Vitals"]] = relationship(
        back_populates="patient", order_by="Vitals.visit_date"
    )
    visit_forms: Mapped[list["VisitForm"]] = relationship(back_populates="patient")


class Vitals(Base):
    __tablename__ = "vitals"
    __table_args__ = (UniqueConstraint("patient_id", "visit_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[str] = mapped_column(
        ForeignKey("patients.patient_id"), index=True
    )
    visit_date: Mapped[date]
    height_cm: Mapped[float]
    weight_kg: Mapped[float]
    bmi: Mapped[float]

    # optional, used for the risk model
    systolic_bp: Mapped[int | None]
    diastolic_bp: Mapped[int | None]
    blood_sugar: Mapped[float | None]
    body_temp_c: Mapped[float | None]
    heart_rate: Mapped[int | None]
    risk_level: Mapped[str | None] = mapped_column(String(20))

    patient: Mapped[Patient] = relationship(back_populates="vitals")


class VisitForm(Base):
    __tablename__ = "visit_forms"
    __table_args__ = (UniqueConstraint("patient_id", "form_type", "visit_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[str] = mapped_column(
        ForeignKey("patients.patient_id"), index=True
    )
    form_type: Mapped[str] = mapped_column(String(20))  # "general" or "overweight"
    visit_date: Mapped[date]
    general_health: Mapped[str] = mapped_column(String(10))
    # overweight form: ever been on a diet; general form: currently using drugs
    answer: Mapped[bool]
    comments: Mapped[str] = mapped_column(Text)

    patient: Mapped[Patient] = relationship(back_populates="visit_forms")