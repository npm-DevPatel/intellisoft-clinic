import { NavLink, Outlet } from "react-router-dom";

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:text-slate-900"
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight">
            IntelliSOFT <span className="text-teal-600">Clinic</span>
          </span>
          <nav className="flex gap-1">
            <NavLink to="/register" className={link}>
              Register
            </NavLink>
            <NavLink to="/patients" className={link}>
              Patients
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}