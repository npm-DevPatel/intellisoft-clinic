import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import BmiBadge from "../components/BmiBadge";
import Field from "../components/Field";
import PatientHeader from "../components/PatientHeader";
import { bmiStatus, calculateBmi } from "../lib/bmi";
import { today } from "../lib/dates";
import { card, errorBox, input, primaryButton } from "../lib/styles";
import { usePatient } from "../lib/usePatient";

interface FormValues {
  visit_date: string;
  height_cm: string;
  weight_kg: string;
  systolic_bp: string;
  diastolic_bp: string;
  blood_sugar: string;
  body_temp_c: string;
  heart_rate: string;
}

const riskFields = [
  { name: "systolic_bp", label: "Systolic BP (mmHg)", min: 60, max: 250, whole: true },
  { name: "diastolic_bp", label: "Diastolic BP (mmHg)", min: 30, max: 150, whole: true },
  { name: "blood_sugar", label: "Blood sugar (mmol/L)", min: 1, max: 30, whole: false },
  { name: "body_temp_c", label: "Temperature (°C)", min: 30, max: 45, whole: false },
  { name: "heart_rate", label: "Heart rate (bpm)", min: 30, max: 220, whole: true },
] as const;

const check = (min: number, max: number, whole = false) => (v: string) => {
  if (v === "") return true;
  const n = Number(v);
  if (Number.isNaN(n) || n < min || n > max) {
    return `Enter a value between ${min} and ${max}`;
  }
  if (whole && !Number.isInteger(n)) return "Enter a whole number";
  return true;
};

const optional = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function Vitals() {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const { patient, error: loadError } = usePatient(patientId);
  const [serverError, setServerError] = useState("");
  const [riskError, setRiskError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      visit_date: today(),
      height_cm: "",
      weight_kg: "",
      systolic_bp: "",
      diastolic_bp: "",
      blood_sugar: "",
      body_temp_c: "",
      heart_rate: "",
    },
  });

  const [height, weight] = useWatch({ control, name: ["height_cm", "weight_kg"] });
  const bmi = calculateBmi(Number(height), Number(weight));

  async function onSubmit(values: FormValues) {
    setServerError("");
    setRiskError("");

    const filled = riskFields.filter((f) => values[f.name].trim() !== "");
    if (filled.length > 0 && filled.length < riskFields.length) {
      setRiskError("Fill in all five readings, or leave them all blank.");
      return;
    }

    try {
      const result = await api.recordVitals(patientId, {
        visit_date: values.visit_date,
        height_cm: Number(values.height_cm),
        weight_kg: Number(values.weight_kg),
        systolic_bp: optional(values.systolic_bp),
        diastolic_bp: optional(values.diastolic_bp),
        blood_sugar: optional(values.blood_sugar),
        body_temp_c: optional(values.body_temp_c),
        heart_rate: optional(values.heart_rate),
      });

      navigate(
        `/patients/${encodeURIComponent(patientId)}/${result.next_form}?date=${result.visit_date}`,
        {
          state: {
            bmi: result.bmi,
            bmiStatus: result.bmi_status,
            risk: result.risk_level,
          },
        },
      );
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className={errorBox}>{loadError}</p>
        <Link to="/register" className="text-sm font-medium text-teal-700 underline">
          Register a patient
        </Link>
      </div>
    );
  }

  if (!patient) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Vitals</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Record height and weight for this visit.
      </p>

      <PatientHeader patient={patient} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={`${card} space-y-5`}>
        {serverError && <p className={errorBox}>{serverError}</p>}

        <Field label="Visit date" htmlFor="visit_date" error={errors.visit_date?.message}>
          <input
            id="visit_date"
            type="date"
            max={today()}
            className={input}
            {...register("visit_date", { required: "Visit date is required" })}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Height (cm)" htmlFor="height_cm" error={errors.height_cm?.message}>
            <input
              id="height_cm"
              type="number"
              step="0.1"
              inputMode="decimal"
              className={input}
              {...register("height_cm", {
                required: "Height is required",
                validate: check(50, 260),
              })}
            />
          </Field>

          <Field label="Weight (kg)" htmlFor="weight_kg" error={errors.weight_kg?.message}>
            <input
              id="weight_kg"
              type="number"
              step="0.1"
              inputMode="decimal"
              className={input}
              {...register("weight_kg", {
                required: "Weight is required",
                validate: check(2, 400),
              })}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">BMI</p>
            <p className="text-2xl font-semibold tabular-nums">{bmi ?? "–"}</p>
          </div>
          {bmi !== null ? (
            <div className="text-right">
              <BmiBadge status={bmiStatus(bmi)} />
              <p className="mt-1 text-xs text-slate-500">
                Next: {bmi <= 25 ? "general" : "overweight"} assessment
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Enter height and weight</p>
          )}
        </div>

        <details className="rounded-xl ring-1 ring-slate-200">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
            Risk screening <span className="font-normal text-slate-500">(optional)</span>
          </summary>
          <div className="space-y-4 border-t border-slate-200 p-4">
            <p className="text-sm text-slate-600">
              Fill in all five readings to get a risk estimate from the model.
            </p>
            {riskError && <p className="text-sm text-red-600">{riskError}</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              {riskFields.map((f) => (
                <Field key={f.name} label={f.label} htmlFor={f.name} error={errors[f.name]?.message}>
                  <input
                    id={f.name}
                    type="number"
                    step={f.whole ? "1" : "0.1"}
                    inputMode="decimal"
                    className={input}
                    {...register(f.name, { validate: check(f.min, f.max, f.whole) })}
                  />
                </Field>
              ))}
            </div>
          </div>
        </details>

        <button type="submit" disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}