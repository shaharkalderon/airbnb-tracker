"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { formatILSCompact } from "@/lib/utils";
import type { MonthlyByProperty } from "@/lib/aggregations";

const COLORS = ["#FF385C", "#FFB4C4"];

export default function ExpensesCharts({
  type,
  data,
  pie,
}: {
  type: "bar" | "pie";
  data?: MonthlyByProperty[];
  pie?: { name: string; value: number }[];
}) {
  if (type === "bar" && data) {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis tickFormatter={(v) => formatILSCompact(v)} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
          <Tooltip formatter={(v) => formatILSCompact(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Marrakech" fill="#FF385C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="The Red Sea" fill="#FFB4C4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie" && pie) {
    const tot = pie.reduce((s, p) => s + p.value, 0);
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={pie} dataKey="value" nameKey="name" outerRadius={70} label={({ value }) => tot && typeof value === "number" ? `${Math.round((value / tot) * 100)}%` : ""}>
            {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => formatILSCompact(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return null;
}
