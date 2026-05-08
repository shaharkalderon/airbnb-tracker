import { Card, StatCard, PageHeader } from "@/components/ui";
import YearPicker from "@/components/YearPicker";
import { fetchAllForYear, fetchAllYears, aggregateByMonthProperty } from "@/lib/aggregations";
import { formatILSCompact, MONTHS } from "@/lib/utils";
import ExpensesCharts from "./ExpensesCharts";
import { CreditCard, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpensesOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const allYears = await fetchAllYears();
  const year = Number(sp.year) || allYears[allYears.length - 1] || new Date().getFullYear();
  const { expenses } = await fetchAllForYear(year);

  const monthly = aggregateByMonthProperty(expenses, "amount");
  const annual = monthly.reduce((s, m) => s + m.Total, 0);
  const avgMonth = annual / 12;

  // category breakdown
  const byCategory: Record<string, number[]> = {};
  for (const e of expenses) {
    const cat = e.category || "(no category)";
    if (!byCategory[cat]) byCategory[cat] = Array(12).fill(0);
    const m = new Date(e.date).getMonth();
    byCategory[cat][m] += Number(e.amount ?? 0);
  }
  const categoryRows = Object.entries(byCategory)
    .map(([cat, arr]) => ({ cat, arr, total: arr.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);

  // pie data
  const propTotals = (["Marrakech", "The Red Sea"] as const).map((p) => ({
    name: p,
    value: monthly.reduce((s, m) => s + m[p], 0),
  }));

  return (
    <div>
      <PageHeader title="Expenses Overview" year={<YearPicker year={year} years={allYears} />} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-3 grid gap-4">
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Annual Expenses" value={formatILSCompact(annual)} accent="brand" />
          <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Avg. Monthly Expenses" value={formatILSCompact(avgMonth)} accent="teal" />
        </div>
        <Card className="lg:col-span-6 p-4">
          <ExpensesCharts type="bar" data={monthly} />
        </Card>
        <Card className="lg:col-span-3 p-4 grid place-items-center">
          <ExpensesCharts type="pie" pie={propTotals} />
        </Card>
      </div>

      <Card className="mb-6 overflow-x-auto">
        <div className="px-4 py-3 font-medium border-b border-slate-100">Expenses by Property</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Property</th>
              {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-right">{m}</th>)}
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(["Marrakech", "The Red Sea"] as const).map((p) => (
              <tr key={p} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium whitespace-nowrap">{p}</td>
                {monthly.map((mm) => <td key={mm.month} className="px-2 py-2 text-right tabular-nums">{mm[p] ? formatILSCompact(mm[p]) : "-"}</td>)}
                <td className="px-4 py-2 text-right font-medium tabular-nums">{formatILSCompact(monthly.reduce((s, mm) => s + mm[p], 0))}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50/50 font-semibold text-[#FF385C]">
              <td className="px-4 py-2">Total</td>
              {monthly.map((mm) => <td key={mm.month} className="px-2 py-2 text-right tabular-nums">{mm.Total ? formatILSCompact(mm.Total) : "-"}</td>)}
              <td className="px-4 py-2 text-right tabular-nums">{formatILSCompact(annual)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <div className="px-4 py-3 font-medium border-b border-slate-100">Expenses by Category</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Category</th>
              {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-right">{m}</th>)}
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {categoryRows.map(({ cat, arr, total }) => (
              <tr key={cat} className="border-t border-slate-100">
                <td className="px-4 py-2 whitespace-nowrap">{cat}</td>
                {arr.map((v, i) => <td key={i} className="px-2 py-2 text-right tabular-nums">{v ? formatILSCompact(v) : "-"}</td>)}
                <td className="px-4 py-2 text-right font-medium tabular-nums">{formatILSCompact(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
