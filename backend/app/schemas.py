from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Gender = Literal["Male", "Female", "Other"]
Health = Literal["Good", "Poor"]
FormType = Literal["general", "overweight"]


class PatientCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    patient_id: str = Field(min_length=1, max_length=30)
    registration_date: date
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    date_of_birth: date
    gender: Gender

    @field_validator("date_of_birth")
    @classmethod
    def dob_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v


class PatientOut(PatientCreate):
    model_config = ConfigDict(from_attributes=True)


class PatientListItem(BaseModel):
    patient_id: str
    name: str
    age: int
    bmi: float | None
    bmi_status: str | None
    last_visit_date: date | None


class VitalsCreate(BaseModel):
    visit_date: date
    height_cm: float = Field(gt=50, le=260)
    weight_kg: float = Field(gt=2, le=400)

    # all-or-nothing group, only needed for the risk prediction
    systolic_bp: int | None = Field(default=None, ge=60, le=250)
    diastolic_bp: int | None = Field(default=None, ge=30, le=150)
    blood_sugar: float | None = Field(default=None, ge=1, le=30)
    body_temp_c: float | None = Field(default=None, ge=30, le=45)
    heart_rate: int | None = Field(default=None, ge=30, le=220)

    @model_validator(mode="after")
    def risk_fields_together(self):
        group = [
            self.systolic_bp,
            self.diastolic_bp,
            self.blood_sugar,
            self.body_temp_c,
            self.heart_rate,
        ]
        if any(v is not None for v in group) and any(v is None for v in group):
            raise ValueError(
                "Provide all of blood pressure, blood sugar, temperature and "
                "heart rate, or none of them"
            )
        return self


class VitalsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: str
    visit_date: date
    height_cm: float
    weight_kg: float
    bmi: float
    bmi_status: str
    next_form: FormType
    risk_level: str | None


class VisitFormCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    form_type: FormType
    visit_date: date
    general_health: Health
    answer: bool
    comments: str = Field(min_length=1)


class VisitFormOut(VisitFormCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: str


class RiskRequest(BaseModel):
    age: int = Field(ge=10, le=70)
    systolic_bp: int = Field(ge=60, le=250)
    diastolic_bp: int = Field(ge=30, le=150)
    blood_sugar: float = Field(ge=1, le=30)
    body_temp_c: float = Field(ge=30, le=45)
    heart_rate: int = Field(ge=30, le=220)


class RiskResponse(BaseModel):
    risk_level: Literal["Low Risk", "Mid Risk", "High Risk"]