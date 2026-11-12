import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import GeneralAssessment from "./pages/GeneralAssessment";
import OverweightAssessment from "./pages/OverweightAssessment";
import PatientList from "./pages/PatientList";
import RegisterPatient from "./pages/RegisterPatient";
import Vitals from "./pages/Vitals";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/register" replace />} />
          <Route path="register" element={<RegisterPatient />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:patientId/vitals" element={<Vitals />} />
          <Route path="patients/:patientId/general" element={<GeneralAssessment />} />
          <Route path="patients/:patientId/overweight" element={<OverweightAssessment />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}