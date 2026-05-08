import { supabaseAdmin } from "./supabase/server";
import { MONTHS } from "./utils";

export type MonthlyByProperty = {
  month: string; // 'Jan'
  monthIndex: number;
  Marrakech: number;
  "The Red Sea": number;
  Total: number;
};

export async function fetchAllForYear(year: number) {
  const sb = supabaseAdmin();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [bookings, income, expenses] = await Promise.all([
    sb.from("bookings").select("*").gte("check_in", start).lte("check_in", end),
    sb.from("income").select("*").gte("date", start).lte("date", end),
    sb.from("expenses").select("*").gte("date", start).lte("date", end),
  ]);
  if (bookings.error) throw bookings.error;
  if (income.error) throw income.error;
  if (expenses.error) throw expenses.error;
  return {
    bookings: bookings.data ?? [],
    income: income.data ?? [],
    expenses: expenses.data ?? [],
  };
}

export async function fetchAllYears(): Promise<number[]> {
  const sb = supabaseAdmin();
  const { data: b } = await sb.from("bookings").select("check_in").order("check_in", { ascending: true }).limit(1);
  const { data: bMax } = await sb.from("bookings").select("check_in").order("check_in", { ascending: false }).limit(1);
  const { data: e } = await sb.from("expenses").select("date").order("date", { ascending: true }).limit(1);
  const { data: eMax } = await sb.from("expenses").select("date").order("date", { ascending: false }).limit(1);
  const min = Math.min(
    b?.[0]?.check_in ? new Date(b[0].check_in).getFullYear() : 9999,
    e?.[0]?.date ? new Date(e[0].date).getFullYear() : 9999
  );
  const max = Math.max(
    bMax?.[0]?.check_in ? new Date(bMax[0].check_in).getFullYear() : 0,
    eMax?.[0]?.date ? new Date(eMax[0].date).getFullYear() : 0,
    new Date().getFullYear()
  );
  if (min === 9999) return [new Date().getFullYear()];
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function emptyMonthlyByProperty(): MonthlyByProperty[] {
  return MONTHS.map((m, i) => ({ month: m, monthIndex: i, Marrakech: 0, "The Red Sea": 0, Total: 0 }));
}

export function aggregateByMonthProperty(rows: { date?: string; check_in?: string; property: string; amount?: number; income?: number | null }[], amountField: "amount" | "income") {
  const out = emptyMonthlyByProperty();
  for (const r of rows) {
    const dateStr = (r as { date?: string; check_in?: string }).date ?? (r as { check_in?: string }).check_in;
    if (!dateStr) continue;
    const m = new Date(dateStr).getMonth();
    const v = Number((r as Record<string, unknown>)[amountField] ?? 0);
    if (!out[m]) continue;
    if (r.property === "Marrakech") out[m].Marrakech += v;
    else if (r.property === "The Red Sea") out[m]["The Red Sea"] += v;
    out[m].Total += v;
  }
  return out;
}
