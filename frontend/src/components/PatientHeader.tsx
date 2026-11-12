import type { Patient } from "../types";

export default function PatientHeader({ patient }: { patient: Patient }) {
  const initials = patient.first_name[0] + patient.last_name[0];

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
        {initials.toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-medium">
          {patient.first_name} {patient.last_name}
        </p>
        <p className="text-xs text-slate-500">ID {patient.patient_id}</p>
      </div>
    </div>
  );
}