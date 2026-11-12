import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Patient } from "../types";

export function usePatient(patientId: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    api
      .getPatient(patientId)
      .then((p) => active && setPatient(p))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Something went wrong"),
      );
    return () => {
      active = false;
    };
  }, [patientId]);

  return { patient, error };
}