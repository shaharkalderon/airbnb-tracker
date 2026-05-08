import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatILS(n: number | null | undefined, opts: { decimals?: number } = {}) {
  if (n == null || isNaN(Number(n))) return "₪0";
  const decimals = opts.decimals ?? 2;
  return "₪" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatILSCompact(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return "₪0";
  return "₪" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];
export const MONTHS_LONG = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const PROPERTIES = ["Marrakech", "The Red Sea"] as const;
export const CHANNELS = ["Airbnb", "Private", "Other"] as const;

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
