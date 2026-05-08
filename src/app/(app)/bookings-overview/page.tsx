import { Card, StatCard, PageHeader, Donut } from "@/components/ui";
import YearPicker from "@/components/YearPicker";
import { fetchAllForYear, fetchAllYears, aggregateByMonthProperty } from "@/lib/aggregations";
import { formatILSCompact, MONTHS, formatILS, nightsBetween } from "@/lib/utils";
import BookingsBars from "./BookingsBars";
import { DollarSign, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const allYears = await fetchAllYears();
  const year = Number(sp.year) || allYears[allYears.length - 1] || new Date().getFullYear();
  const { bookings } = await fetchAllForYear(year);

  const monthly = aggregateByMonthProperty(
    bookings.map((b) => ({ ...b, income: b.income })),
    "income"
  );
  const annual = monthly.reduce((s, m) => s + m.Total, 0);
  const avgMonth = annual / 12;

  // occupancy: nights booked / 365 per property
  const propStats: Record<string, { nights: number; bookings: number; guests: number; income: number }> = {
    Marrakech: { nights: 0, bookings: 0, guests: 0, income: 0 },
    "The Red Sea": { nights: 0, bookings: 0, guests: 0, income: 0 },
  };
  for (const b of bookings) {
    const key = b.property;
    if (!propStats[key]) continue;
    const n = nightsBetween(b.check_in, b.check_out);
    propStats[key].nights += n;
    propStats[key].bookings += 1;
    propStats[key].guests += b.guests ?? 0;
    propStats[key].income += Number(b.income ?? 0);
  }
  const totalNights = propStats.Marrakech.nights + propStats["The Red Sea"].nights;
  const occupancy = (totalNights / (365 * 2)) * 100;
  const occMar = (propStats.Marrakech.nights / 365) * 100;
  const occRed = (propStats["The Red Sea"].nights / 365) * 100;

  // by channel
  const byChannel: Record<string, number[]> = { Airbnb: Array(12).fill(0), Private: Array(12).fill(0), Other: Array(12).fill(0) };
  for (const b of bookings) {
    const ch = (b.channel as string) || "Other";
    if (!byChannel[ch]) byChannel[ch] = Array(12).fill(0);
    const m = new Date(b.check_in).getMonth();
    byChannel[ch][m] += Number(b.income ?? 0);
  }

  return (
    <div>
      <PageHeader title="Bookings Overview" year={<YearPicker year={year} years={allYears} />} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-3 grid gap-4">
          <StatCard icon={<DollarSign className="h-5 w-5" />} label="Annual Revenue" value={formatILSCompact(annual)} accent="brand" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg. Monthly Revenue" value={formatILSCompact(avgMonth)} accent="teal" />
        </div>
        <Card className="lg:col-span-6 p-4">
          <BookingsBars data={monthly} />
        </Card>
        <Card className="lg:col-span-3 p-4">
          <div className="flex items-center justify-around">
            <Donut value={occupancy} label="Occupancy" />
          </div>
          <div className="flex items-center justify-around mt-4">
            <Donut value={occMar} label="Marrakech" color="#FF385C" />
            <Donut value={occRed} label="The Red Sea" color="#717171" />
          </div>
        </Card>
      </div>

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Property</th>
              <th className="px-4 py-3 text-right">Bookings</th>
              <th className="px-4 py-3 text-right">No. of Guests</th>
              <th className="px-4 py-3 text-right">Nights Spent</th>
            </tr>
          </thead>
          <tbody>
            {(["Marrakech", "The Red Sea"] as const).map((p) => (
              <tr key={p} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p}</td>
                <td className="px-4 py-3 text-right">{propStats[p].bookings}</td>
                <td className="px-4 py-3 text-right">{propStats[p].guests}</td>
                <td className="px-4 py-3 text-right">{propStats[p].nights}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50/50 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right text-[#FF385C]">{propStats.Marrakech.bookings + propStats["The Red Sea"].bookings}</td>
              <td className="px-4 py-3 text-right text-[#FF385C]">{propStats.Marrakech.guests + propStats["The Red Sea"].guests}</td>
              <td className="px-4 py-3 text-right text-[#FF385C]">{totalNights}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <div className="px-4 py-3 font-medium border-b border-slate-100">Revenue by Property</div>
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
        <div className="px-4 py-3 font-medium border-b border-slate-100">Revenue by Channel</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Channel</th>
              {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-right">{m}</th>)}
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byChannel).map(([ch, arr]) => {
              const tot = arr.reduce((a, b) => a + b, 0);
              return (
                <tr key={ch} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{ch}</td>
                  {arr.map((v, i) => <td key={i} className="px-2 py-2 text-right tabular-nums">{v ? formatILSCompact(v) : "-"}</td>)}
                  <td className="px-4 py-2 text-right font-medium tabular-nums">{formatILS(tot, { decimals: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
