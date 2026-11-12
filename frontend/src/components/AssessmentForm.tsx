import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { today } from "../lib/dates";
import { card, errorBox, input, primaryButton } from "../lib/styles";
import { usePatient } from "../lib/usePatient";
import type { FormType, Health, VitalsResult } from "../types";
import BmiBadge from "./BmiBadge";
import Choice from "./Choice";
import Field from "./Field";
import PatientHeader from "./PatientHeader";

interface Values {
  visit_date: string;
  general_health: Health | "";
  answer: "Yes" | "No" | "";
  comments: string;
}

const copy = {
  general: {
    title: "General assessment",
    question: "Are you currently using any drugs?",
  },
  overweight: {
    title: "Overweight assessment",
    question: "Have you ever been on a diet to lose weight?",
  },
};

export default function AssessmentForm({ type }: { type: FormType }) {
  const { patientId = "" } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date") ?? today();
  const navigate = useNavigate();

  const { patient, error: patientError } = usePatient(patientId);
  const [vitals, setVitals] = useState<VitalsResult | null | undefined>(undefined);
  const [fetchError, setFetchError] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: { visit_date: date, general_health: "", answer: "", comments: "" },
  });

  useEffect(() => {
    let active = true;
    api
      .getVitals(patientId, date)
      .then((list) => active && setVitals(list[0] ?? null))
      .catch(
        (e) =>
          active && setFetchError(e instanceof ApiError ? e.message : "Something went wrong"),
      );
    return () => {
      active = false;
    };
  }, [patientId, date]);

  async function onSubmit(values: Values) {
    setServerError("");
    try {
      await api.submitForm(patientId, {
        form_type: type,
        visit_date: values.visit_date,
        general_health: values.general_health as Health,
        answer: values.answer === "Yes",
        comments: values.comments.trim(),
      });
      navigate("/patients", {
        state: { saved: `${patient?.first_name} ${patient?.last_name}` },
      });
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    }
  }

  const base = `/patients/${encodeURIComponent(patientId)}`;
  const loadError = patientError || fetchError;

  if (loadError) return <p className={`${errorBox} mx-auto max-w-xl`}>{loadError}</p>;
  if (!patient || vitals === undefined) return <p className="text-sm text-slate-500">Loading…</p>;

  if (vitals === null) {
    return (
      <Notice>
        No vitals have been recorded for {date}.{" "}
        <Link to={`${base}/vitals`} className="font-medium underline">
          Record vitals first
        </Link>
      </Notice>
    );
  }

  if (vitals.next_form !== type) {
    return (
      <Notice>
        BMI for this visit is {vitals.bmi}, so the {vitals.next_form} assessment applies.{" "}
        <Link to={`${base}/${vitals.next_form}?date=${date}`} className="font-medium underline">
          Go to the {vitals.next_form} form
        </Link>
      </Notice>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">{copy[type].title}</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">A few questions about this visit.</p>

      <PatientHeader patient={patient} />

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
        <span className="text-slate-600">
          BMI <span className="font-semibold text-slate-900 tabular-nums">{vitals.bmi}</span>
        </span>
        <BmiBadge status={vitals.bmi_status} />
        {vitals.risk_level && (
          <span className="text-slate-600">
            Risk screening: <span className="font-semibold text-slate-900">{vitals.risk_level}</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={`${card} space-y-5`}>
        {serverError && <p className={errorBox}>{serverError}</p>}

        <Field label="Visit date" htmlFor="visit_date">
          <input
            id="visit_date"
            type="date"
            readOnly
            className={`${input} bg-slate-50 text-slate-600`}
            {...register("visit_date", { required: true })}
          />
        </Field>

        <Field label="General health" error={errors.general_health?.message}>
          <Choice
            options={["Good", "Poor"]}
            reg={register("general_health", { required: "Select an option" })}
          />
        </Field>

        <Field label={copy[type].question} error={errors.answer?.message}>
          <Choice options={["Yes", "No"]} reg={register("answer", { required: "Select an option" })} />
        </Field>

        <Field label="Comments" htmlFor="comments" error={errors.comments?.message}>
          <textarea
            id="comments"
            rows={4}
            className={input}
            {...register("comments", {
              required: "Comments are required",
              validate: (v) => v.trim() !== "" || "Comments are required",
            })}
          />
        </Field>

        <button type="submit" disabled={isSubmitting} className={primaryButton}>
          {isSubmitting ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white px-5 py-4 text-sm text-slate-700 ring-1 ring-slate-200">
      {children}
    </div>
  );
}