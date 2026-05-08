import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "./config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatILS(n: number | null | undefined, opts: { decimals?: number } = {}) {
  if (n == null || isNaN(Number(n))) return `${config.currencySymbol}0`;
  const decimals = opts.decimals ?? 2;
  return config.currencySymbol + Number(n).toLocaleString(config.currencyLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatILSCompact(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return `${config.currencySymbol}0`;
  return config.currencySymbol + Number(n).toLocaleString(config.currencyLocale, { maximumFractionDigits: 0 });
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

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  if (typeof d === "string") {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
