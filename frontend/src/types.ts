export type Gender = "Male" | "Female" | "Other";
export type Health = "Good" | "Poor";
export type FormType = "general" | "overweight";
export type BmiStatus = "Underweight" | "Normal" | "Overweight";
export type RiskLevel = "Low Risk" | "Mid Risk" | "High Risk";

export interface PatientInput {
  patient_id: string;
  registration_date: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
}
export type Patient = PatientInput;

export interface PatientListItem {
  patient_id: string;
  name: string;
  age: number;
  bmi: number | null;
  bmi_status: BmiStatus | null;
  last_visit_date: string | null;
}

export interface VitalsInput {
  visit_date: string;
  height_cm: number;
  weight_kg: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  blood_sugar?: number;
  body_temp_c?: number;
  heart_rate?: number;
}

export interface VitalsResult {
  id: number;
  patient_id: string;
  visit_date: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmi_status: BmiStatus;
  next_form: FormType;
  risk_level: RiskLevel | null;
}

export interface VisitFormInput {
  form_type: FormType;
  visit_date: string;
  general_health: Health;
  answer: boolean;
  comments: string;
}

export interface VisitForm extends VisitFormInput {
  id: number;
  patient_id: string;
}