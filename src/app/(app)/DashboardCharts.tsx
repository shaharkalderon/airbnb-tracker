"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatILSCompact } from "@/lib/utils";

export default function DashboardCharts({
  type,
  monthly,
  yearly,
}: {
  type: "monthly" | "yearly";
  monthly?: { month: string; Income: number; Expenses: number }[];
  yearly?: { year: number; Income: number; Expenses: number }[];
}) {
  if (type === "monthly" && monthly) {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis tickFormatter={(v) => formatILSCompact(v)} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
          <Tooltip formatter={(v) => formatILSCompact(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="#FF385C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="#FFB4C4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "yearly" && yearly) {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={yearly}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis tickFormatter={(v) => formatILSCompact(v)} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
          <Tooltip formatter={(v) => formatILSCompact(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="#FF385C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="#FFB4C4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return null;
}
