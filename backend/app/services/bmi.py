def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / height_m**2, 1)


def bmi_status(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal"
    return "Overweight"


def next_form(bmi: float) -> str:
    return "general" if bmi <= 25 else "overweight"