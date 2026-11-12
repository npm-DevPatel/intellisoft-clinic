import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

PATIENT = {
    "patient_id": "P001",
    "registration_date": "2026-11-01",
    "first_name": "Amina",
    "last_name": "Otieno",
    "date_of_birth": "1995-03-10",
    "gender": "Female",
}


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def vitals(date="2026-11-05", height=170, weight=70):
    return {"visit_date": date, "height_cm": height, "weight_kg": weight}


def form(form_type, date="2026-11-05"):
    return {
        "form_type": form_type,
        "visit_date": date,
        "general_health": "Good",
        "answer": False,
        "comments": "No concerns",
    }


def test_patient_can_only_register_once(client):
    assert client.post("/patients", json=PATIENT).status_code == 201
    assert client.post("/patients", json=PATIENT).status_code == 409


def test_vitals_routes_to_general_form(client):
    client.post("/patients", json=PATIENT)
    res = client.post("/patients/P001/vitals", json=vitals(weight=70))
    assert res.status_code == 201
    body = res.json()
    assert body["bmi"] == 24.2
    assert body["bmi_status"] == "Normal"
    assert body["next_form"] == "general"


def test_vitals_routes_to_overweight_form(client):
    client.post("/patients", json=PATIENT)
    body = client.post("/patients/P001/vitals", json=vitals(weight=90)).json()
    assert body["bmi_status"] == "Overweight"
    assert body["next_form"] == "overweight"


def test_one_vitals_record_per_date(client):
    client.post("/patients", json=PATIENT)
    client.post("/patients/P001/vitals", json=vitals())
    assert client.post("/patients/P001/vitals", json=vitals()).status_code == 409
    assert (
        client.post("/patients/P001/vitals", json=vitals(date="2026-11-06")).status_code
        == 201
    )


def test_wrong_form_for_bmi_is_rejected(client):
    client.post("/patients", json=PATIENT)
    client.post("/patients/P001/vitals", json=vitals(weight=70))
    res = client.post("/patients/P001/visit-forms", json=form("overweight"))
    assert res.status_code == 422


def test_form_needs_vitals_first(client):
    client.post("/patients", json=PATIENT)
    res = client.post("/patients/P001/visit-forms", json=form("general"))
    assert res.status_code == 422


def test_form_submitted_once_per_date(client):
    client.post("/patients", json=PATIENT)
    client.post("/patients/P001/vitals", json=vitals(weight=70))
    assert client.post("/patients/P001/visit-forms", json=form("general")).status_code == 201
    assert client.post("/patients/P001/visit-forms", json=form("general")).status_code == 409


def test_partial_risk_fields_are_rejected(client):
    client.post("/patients", json=PATIENT)
    res = client.post("/patients/P001/vitals", json={**vitals(), "systolic_bp": 120})
    assert res.status_code == 422


def test_patient_list_and_date_filter(client):
    client.post("/patients", json=PATIENT)
    client.post("/patients", json={**PATIENT, "patient_id": "P002", "first_name": "Brian"})
    client.post("/patients/P001/vitals", json=vitals(date="2026-11-05", weight=70))
    client.post("/patients/P002/vitals", json=vitals(date="2026-11-06", weight=90))

    everyone = client.get("/patients").json()
    assert [p["bmi_status"] for p in everyone] == ["Normal", "Overweight"]

    one_day = client.get("/patients", params={"visit_date": "2026-11-06"}).json()
    assert [p["name"] for p in one_day] == ["Brian Otieno"]