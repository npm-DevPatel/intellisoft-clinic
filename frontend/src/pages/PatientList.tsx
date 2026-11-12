import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, ApiError } from "../api/client";
import BmiBadge from "../components/BmiBadge";
import { card, errorBox, input } from "../lib/styles";
import type { PatientListItem } from "../types";

export default function PatientList() {
  const location = useLocation();
  const saved = (location.state as { saved?: string } | null)?.saved;

  const [date, setDate] = useState("");
  const [patients, setPatients] = useState<PatientListItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .listPatients(date || undefined)
      .then((list) => {
        if (!active) return;
        setPatients(list);
        setError("");
      })
      .catch(
        (e) => active && setError(e instanceof ApiError ? e.message : "Something went wrong"),
      );
    return () => {
      active = false;
    };
  }, [date]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-slate-600">
            {date ? "Showing patients seen on the selected date." : "Showing each patient's latest visit."}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="filter" className="mb-1.5 block text-sm font-medium text-slate-700">
              Visit date
            </label>
            <input
              id="filter"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${input} w-auto`}
            />
          </div>
          {date && (
            <button
              type="button"
              onClick={() => setDate("")}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {saved && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          Assessment saved for {saved}.
        </p>
      )}
      {error && <p className={`${errorBox} mb-4`}>{error}</p>}

      <div className={`${card} overflow-hidden p-0 sm:p-0`}>
        {patients === null && !error ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : patients && patients.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600">
              {date ? "No patients were seen on this date." : "No patients registered yet."}
            </p>
            {!date && (
              <Link to="/register" className="mt-2 inline-block text-sm font-medium text-teal-700 underline">
                Register the first patient
              </Link>
            )}
          </div>
        ) : (
          patients && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Age</th>
                    <th className="px-5 py-3">Last BMI status</th>
                    <th className="px-5 py-3">Last visit</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.patient_id}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.patient_id}</p>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{p.age}</td>
                      <td className="px-5 py-3.5">
                        {p.bmi_status ? (
                          <span className="inline-flex items-center gap-2">
                            <BmiBadge status={p.bmi_status} />
                            <span className="text-slate-500 tabular-nums">{p.bmi}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">No vitals yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                        {p.last_visit_date ?? "–"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/patients/${encodeURIComponent(p.patient_id)}/vitals`}
                          className="font-medium whitespace-nowrap text-teal-700 hover:underline"
                        >
                          New visit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}