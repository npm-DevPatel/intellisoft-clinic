from app.services.bmi import bmi_status, calculate_bmi, next_form


def test_calculate_bmi():
    assert calculate_bmi(170, 70) == 24.2


def test_status_boundaries():
    assert bmi_status(18.4) == "Underweight"
    assert bmi_status(18.5) == "Normal"
    assert bmi_status(24.9) == "Normal"
    assert bmi_status(25) == "Overweight"


def test_routing():
    assert next_form(25) == "general"
    assert next_form(25.1) == "overweight"