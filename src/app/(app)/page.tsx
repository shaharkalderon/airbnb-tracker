import { Card, PageHeader } from "@/components/ui";
import YearPicker from "@/components/YearPicker";
import { fetchAllForYear, fetchAllYears, fetchAllTotals, aggregateByMonthProperty } from "@/lib/aggregations";
import { formatILSCompact, formatILS, MONTHS } from "@/lib/utils";
import DashboardCharts from "./DashboardCharts";
import UpcomingReservations from "./UpcomingReservations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const allYears = await fetchAllYears();
  const year = Number(sp.year) || allYears[allYears.length - 1] || new Date().getFullYear();
  const { bookings, income, expenses } = await fetchAllForYear(year);

  void bookings;
  const incomeMonthly = aggregateByMonthProperty(income, "amount");
  const totalIncomeMonthly = MONTHS.map((m, i) => ({
    month: m,
    Income: incomeMonthly[i].Total,
    Expenses: 0,
  }));
  const expensesMonthly = aggregateByMonthProperty(expenses, "amount");
  for (let i = 0; i < 12; i++) totalIncomeMonthly[i].Expenses = expensesMonthly[i].Total;

  const annualIncome = totalIncomeMonthly.reduce((s, m) => s + m.Income, 0);
  const annualExpenses = totalIncomeMonthly.reduce((s, m) => s + m.Expenses, 0);
  const profit = annualIncome - annualExpenses;
  const margin = annualIncome > 0 ? (profit / annualIncome) * 100 : 0;

  const prevYear = year - 1;
  const sb = supabaseAdmin();
  const todayISO = new Date().toISOString().slice(0, 10);

  // Cached all-time income/expenses (bucketed by year in memory) plus the
  // upcoming/ongoing bookings — all run in parallel.
  const [{ income: allInc, expenses: allExp }, { data: upcomingRaw }, { data: ongoingRaw }] =
    await Promise.all([
      fetchAllTotals(),
      sb
        .from("bookings")
        .select("*")
        .gt("check_in", todayISO)
        .order("check_in", { ascending: true })
        .limit(2),
      sb
        .from("bookings")
        .select("*")
        .lte("check_in", todayISO)
        .gt("check_out", todayISO)
        .order("check_in", { ascending: true }),
    ]);

  const totalsByYear = new Map<number, { Income: number; Expenses: number }>();
  for (const y of allYears) totalsByYear.set(y, { Income: 0, Expenses: 0 });
  const bucket = (rows: { amount?: number; date?: string }[] | null, key: "Income" | "Expenses") => {
    for (const r of rows ?? []) {
      if (!r.date) continue;
      const y = new Date(r.date).getFullYear();
      const t = totalsByYear.get(y);
      if (t) t[key] += Number(r.amount ?? 0);
    }
  };
  bucket(allInc, "Income");
  bucket(allExp, "Expenses");
  const yearTotals = allYears.map((y) => ({ year: y, ...totalsByYear.get(y)! }));

  const prev = yearTotals.find((y) => y.year === prevYear);
  const prevIncome = prev?.Income ?? 0;
  const incomeDelta = prevIncome > 0 ? ((annualIncome - prevIncome) / prevIncome) * 100 : null;

  const upcoming = upcomingRaw ?? [];
  const ongoing = ongoingRaw ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" year={<YearPicker year={year} years={allYears} />} />

      <UpcomingReservations bookings={upcoming} ongoing={ongoing} />

      <Card className="p-5 md:p-8 mb-6 overflow-hidden">
        <div className="text-xs text-[var(--fg-muted)] uppercase tracking-wider font-semibold">Annual Profit · {year}</div>
        <div className="flex items-baseline gap-4 mt-2 flex-wrap">
          <div className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight ${profit >= 0 ? "text-[var(--fg)]" : "text-[var(--danger)]"}`}>
            {profit < 0 ? "-" : ""}{formatILS(Math.abs(profit), { decimals: 0 })}
          </div>
          {annualIncome > 0 && (
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${margin >= 0 ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
              {margin >= 0 ? "+" : ""}{margin.toFixed(1)}% margin
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6 mt-8 max-w-md">
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Income</div>
            <div className="text-2xl font-bold text-[var(--success)] tabular-nums mt-1">{formatILSCompact(annualIncome)}</div>
            {incomeDelta != null && (
              <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${incomeDelta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {incomeDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {incomeDelta >= 0 ? "+" : ""}{incomeDelta.toFixed(0)}% vs {prevYear}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Expenses</div>
            <div className="text-2xl font-bold text-[var(--danger)] tabular-nums mt-1">{formatILSCompact(annualExpenses)}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <div className="text-sm font-semibold text-[var(--fg)] mb-1">Monthly breakdown</div>
          <div className="text-xs text-[var(--fg-muted)] mb-4">Income vs expenses, by month</div>
          <DashboardCharts type="monthly" monthly={totalIncomeMonthly} />
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold text-[var(--fg)] mb-1">Year over year</div>
          <div className="text-xs text-[var(--fg-muted)] mb-4">All-time comparison</div>
          <DashboardCharts type="yearly" yearly={yearTotals} />
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="font-semibold text-[var(--fg)]">Monthly P&amp;L · {year}</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Month</th>
              <th className="px-3 py-3 text-right font-semibold">Income</th>
              <th className="px-3 py-3 text-right font-semibold">Expenses</th>
              <th className="px-5 py-3 text-right font-semibold">Profit</th>
            </tr>
          </thead>
          <tbody>
            {totalIncomeMonthly.map((m, i) => {
              const p = m.Income - m.Expenses;
              return (
                <tr key={m.month} className="border-t border-[var(--border)]">
                  <td className="px-5 py-3 font-medium">{MONTHS[i]}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--success)]">{m.Income ? formatILSCompact(m.Income) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--danger)]">{m.Expenses ? formatILSCompact(m.Expenses) : "—"}</td>
                  <td className={`px-5 py-3 text-right tabular-nums font-semibold ${p >= 0 ? "text-[var(--fg)]" : "text-[var(--danger)]"}`}>{p ? (p < 0 ? "-" : "") + formatILSCompact(Math.abs(p)) : "—"}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-[#222222] bg-[var(--surface-2)] font-bold">
              <td className="px-5 py-3">Total</td>
              <td className="px-3 py-3 text-right tabular-nums text-[var(--success)]">{formatILSCompact(annualIncome)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-[var(--danger)]">{formatILSCompact(annualExpenses)}</td>
              <td className={`px-5 py-3 text-right tabular-nums ${profit >= 0 ? "text-[var(--fg)]" : "text-[var(--danger)]"}`}>{(profit < 0 ? "-" : "") + formatILSCompact(Math.abs(profit))}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
