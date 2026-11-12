import type { BmiStatus } from "../types";

export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiStatus(bmi: number): BmiStatus {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  return "Overweight";
}