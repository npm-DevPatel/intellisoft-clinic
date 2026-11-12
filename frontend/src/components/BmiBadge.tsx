import type { BmiStatus } from "../types";

const styles: Record<BmiStatus, string> = {
  Underweight: "bg-sky-50 text-sky-700 ring-sky-200",
  Normal: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Overweight: "bg-amber-50 text-amber-800 ring-amber-200",
};

export default function BmiBadge({ status }: { status: BmiStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}