import type { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  options: string[];
  reg: UseFormRegisterReturn;
}

export default function Choice({ options, reg }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <label key={option} className="cursor-pointer">
          <input type="radio" value={option} className="peer sr-only" {...reg} />
          <span className="block rounded-lg bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 peer-checked:bg-teal-600 peer-checked:text-white peer-checked:ring-teal-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}