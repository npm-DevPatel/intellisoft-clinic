import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RegisterPatient from "./pages/RegisterPatient";
import Vitals from "./pages/Vitals";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/register" replace />} />
          <Route path="register" element={<RegisterPatient />} />
          <Route path="patients/:patientId/vitals" element={<Vitals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}