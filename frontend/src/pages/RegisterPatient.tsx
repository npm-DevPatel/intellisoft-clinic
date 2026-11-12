import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import Field from "../components/Field";
import { today } from "../lib/dates";
import { card, errorBox, input, primaryButton } from "../lib/styles";
import type { PatientInput } from "../types";

interface SubmitError {
  message: string;
  duplicateId?: string;
}

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [error, setError] = useState<SubmitError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientInput>({
    defaultValues: { registration_date: today() },
  });

  async function onSubmit(data: PatientInput) {
    setError(null);
    try {
      const patient = await api.registerPatient(data);
      navigate(`/patients/${encodeURIComponent(patient.patient_id)}/vitals`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError({
          message: e.message,
          duplicateId: e.status === 409 ? data.patient_id.trim() : undefined,
        });
      } else {
        setError({ message: "Something went wrong" });
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Register patient</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Add a new patient, then record their first visit.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={`${card} space-y-5`}>
        {error && (
          <div className={errorBox}>
            {error.message}
            {error.duplicateId && (
              <>
                {" "}
                <Link
                  to={`/patients/${encodeURIComponent(error.duplicateId)}/vitals`}
                  className="font-medium underline"
                >
                  Record a visit for this patient
                </Link>
              </>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Patient ID"
            htmlFor="patient_id"
            hint="Must be unique to this patient"
            error={errors.patient_id?.message}
          >
            <input
              id="patient_id"
              className={input}
              placeholder="e.g. P001"
              {...register("patient_id", {
                required: "Patient ID is required",
                maxLength: { value: 30, message: "Keep it under 30 characters" },
                validate: (v) => v.trim() !== "" || "Patient ID is required",
              })}
            />
          </Field>

          <Field
            label="Registration date"
            htmlFor="registration_date"
            error={errors.registration_date?.message}
          >
            <input
              id="registration_date"
              type="date"
              max={today()}
              className={input}
              {...register("registration_date", { required: "Registration date is required" })}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
            <input
              id="first_name"
              className={input}
              {...register("first_name", {
                required: "First name is required",
                validate: (v) => v.trim() !== "" || "First name is required",
              })}
            />
          </Field>

          <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
            <input
              id="last_name"
              className={input}
              {...register("last_name", {
                required: "Last name is required",
                validate: (v) => v.trim() !== "" || "Last name is required",
              })}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="date_of_birth" error={errors.date_of_birth?.message}>
            <input
              id="date_of_birth"
              type="date"
              max={today()}
              className={input}
              {...register("date_of_birth", {
                required: "Date of birth is required",
                validate: (v) => v <= today() || "Date of birth can't be in the future",
              })}
            />
          </Field>

          <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
            <select
              id="gender"
              className={input}
              defaultValue=""
              {...register("gender", { required: "Select a gender" })}
            >
              <option value="" disabled>
                Select
              </option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}