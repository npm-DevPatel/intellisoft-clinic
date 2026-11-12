import type {
  Patient,
  PatientInput,
  PatientListItem,
  VisitForm,
  VisitFormInput,
  VitalsInput,
  VitalsResult,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readDetail(body: unknown): string | null {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d: { msg?: string }) => (d.msg ?? "").replace(/^Value error, /, ""))
      .join(". ");
  }
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, readDetail(body) ?? "Something went wrong");
  }
  return res.json();
}

const id = (value: string) => encodeURIComponent(value);

export const api = {
  registerPatient: (data: PatientInput) =>
    request<Patient>("/patients", { method: "POST", body: JSON.stringify(data) }),

  getPatient: (patientId: string) => request<Patient>(`/patients/${id(patientId)}`),

  listPatients: (visitDate?: string) =>
    request<PatientListItem[]>(visitDate ? `/patients?visit_date=${visitDate}` : "/patients"),

  recordVitals: (patientId: string, data: VitalsInput) =>
    request<VitalsResult>(`/patients/${id(patientId)}/vitals`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitForm: (patientId: string, data: VisitFormInput) =>
    request<VisitForm>(`/patients/${id(patientId)}/visit-forms`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};