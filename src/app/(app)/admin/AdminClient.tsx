"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, PageHeader, Button } from "@/components/ui";
import { PROPERTIES, CHANNELS, formatILS } from "@/lib/utils";
import { Plus, Trash2, Save, Download, Search, ArrowUpDown } from "lucide-react";
import { saveBooking, type BookingInput } from "../bookings/actions";
import { saveIncome, type IncomeInput } from "../income/actions";
import { saveExpense, type ExpenseInput } from "../expenses/actions";

type Tab = "bookings" | "income" | "expenses";

type BookingRow = BookingInput & { id: number };
type IncomeRow = IncomeInput & { id: number };
type ExpenseRow = ExpenseInput & { id: number };

type DraftBooking = Omit<BookingInput, "id"> & { _key: string };
type DraftIncome = Omit<IncomeInput, "id"> & { _key: string };
type DraftExpense = Omit<ExpenseInput, "id"> & { _key: string };

const cellInput =
  "w-full px-2 py-1.5 text-sm rounded-md bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--fg)] focus:border-[var(--fg)]";

function newKey() {
  return Math.random().toString(36).slice(2);
}

function downloadCsv(filename: string, columns: string[], rows: Array<Record<string, unknown>>) {
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    columns.join(","),
    ...rows.map((r) => columns.map((c) => escape(r[c])).join(",")),
  ].join("\n");
  const bom = "﻿"; // Excel-friendly UTF-8
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminClient({
  initialBookings,
  initialIncome,
  initialExpenses,
  incomeCategories,
  expenseCategories,
}: {
  initialBookings: BookingRow[];
  initialIncome: IncomeRow[];
  initialExpenses: ExpenseRow[];
  incomeCategories: string[];
  expenseCategories: string[];
}) {
  const [tab, setTab] = useState<Tab>("bookings");

  return (
    <div>
      <PageHeader title="Admin" />

      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {(
          [
            ["bookings", "Bookings", initialBookings.length],
            ["income", "Income", initialIncome.length],
            ["expenses", "Expenses", initialExpenses.length],
          ] as const
        ).map(([key, label, count]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition " +
                (active
                  ? "border-[var(--fg)] text-[var(--fg)]"
                  : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]")
              }
            >
              {label}{" "}
              <span className="ml-1 text-xs text-[var(--fg-muted)] font-normal">{count}</span>
            </button>
          );
        })}
      </div>

      {tab === "bookings" && <BookingsTable rows={initialBookings} />}
      {tab === "income" && <IncomeTable rows={initialIncome} categories={incomeCategories} />}
      {tab === "expenses" && (
        <ExpensesTable rows={initialExpenses} categories={expenseCategories} />
      )}
    </div>
  );
}

function BookingsTable({ rows }: { rows: BookingRow[] }) {
  const [drafts, setDrafts] = useState<DraftBooking[]>([]);
  const [saving, startSaving] = useTransition();
  const [msg, setMsg] = useState<string>("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sort, setSort] = useState("check_in_desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (propertyFilter !== "all" && r.property !== propertyFilter) return false;
      if (channelFilter !== "all" && (r.channel || "") !== channelFilter) return false;
      if (!q) return true;
      const hay = [r.booking, r.details, r.property, r.channel].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
    const cmp: Record<string, (a: BookingRow, b: BookingRow) => number> = {
      check_in_asc: (a, b) => a.check_in.localeCompare(b.check_in),
      check_in_desc: (a, b) => b.check_in.localeCompare(a.check_in),
      income_asc: (a, b) => Number(a.income ?? 0) - Number(b.income ?? 0),
      income_desc: (a, b) => Number(b.income ?? 0) - Number(a.income ?? 0),
      booked_desc: (a, b) => (b.booking_date || "").localeCompare(a.booking_date || ""),
    };
    out = [...out].sort(cmp[sort] || cmp.check_in_desc);
    return out;
  }, [rows, search, propertyFilter, channelFilter, sort]);

  function addDraft() {
    setDrafts((d) => [
      ...d,
      {
        _key: newKey(),
        check_in: "",
        check_out: "",
        booking: "",
        guests: null,
        property: PROPERTIES[0],
        channel: CHANNELS[0],
        rental_period: null,
        income: null,
        details: "",
        booking_date: "",
      },
    ]);
  }

  function updateDraft(key: string, patch: Partial<DraftBooking>) {
    setDrafts((d) => d.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }

  function removeDraft(key: string) {
    setDrafts((d) => d.filter((r) => r._key !== key));
  }

  function saveAll() {
    const valid = drafts.filter((d) => d.check_in && d.check_out && d.property);
    if (valid.length === 0) {
      setMsg("Fill check-in, check-out and property for each row.");
      return;
    }
    setMsg("");
    startSaving(async () => {
      for (const d of valid) {
        const { _key, ...rest } = d;
        void _key;
        await saveBooking(rest);
      }
      setMsg(`Saved ${valid.length} booking${valid.length > 1 ? "s" : ""}.`);
      setDrafts([]);
      window.location.reload();
    });
  }

  return (
    <Card>
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search guest, details..."
        selects={[
          {
            value: propertyFilter,
            onChange: setPropertyFilter,
            options: [{ value: "all", label: "All properties" }, ...PROPERTIES.map((p) => ({ value: p, label: p }))],
          },
          {
            value: channelFilter,
            onChange: setChannelFilter,
            options: [{ value: "all", label: "All channels" }, ...CHANNELS.map((c) => ({ value: c, label: c }))],
          },
          {
            value: sort,
            onChange: setSort,
            options: [
              { value: "check_in_desc", label: "Newest check-in" },
              { value: "check_in_asc", label: "Oldest check-in" },
              { value: "income_desc", label: "Highest income" },
              { value: "income_asc", label: "Lowest income" },
              { value: "booked_desc", label: "Recently booked" },
            ],
            icon: "sort",
          },
        ]}
        resultCount={filtered.length}
      />
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--fg-muted)]">
          <tr>
            <th className="px-3 py-3 text-left font-semibold">Check-in</th>
            <th className="px-3 py-3 text-left font-semibold">Check-out</th>
            <th className="px-3 py-3 text-left font-semibold">Guest</th>
            <th className="px-3 py-3 text-left font-semibold">Property</th>
            <th className="px-3 py-3 text-left font-semibold">Channel</th>
            <th className="px-3 py-3 text-right font-semibold">Guests</th>
            <th className="px-3 py-3 text-right font-semibold">Income</th>
            <th className="px-3 py-3 text-left font-semibold">Booked on</th>
            <th className="px-3 py-3 text-left font-semibold">Details</th>
            <th className="px-3 py-3 w-8" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)] text-[var(--fg)]">
              <td className="px-3 py-2 whitespace-nowrap">{r.check_in}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.check_out}</td>
              <td className="px-3 py-2 max-w-[180px] truncate">{r.booking}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.property}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.channel}</td>
              <td className="px-3 py-2 text-right tabular-nums">{r.guests ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.income != null ? formatILS(Number(r.income), { decimals: 0 }) : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{r.booking_date || "—"}</td>
              <td className="px-3 py-2 max-w-[220px] truncate text-[var(--fg-muted)]">
                {r.details || ""}
              </td>
              <td />
            </tr>
          ))}
          {drafts.map((d) => (
            <tr key={d._key} className="border-t border-[var(--border)] bg-[var(--brand-soft)]/30">
              <td className="px-2 py-1.5">
                <input type="date" className={cellInput} value={d.check_in}
                  onChange={(e) => updateDraft(d._key, { check_in: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <input type="date" className={cellInput} value={d.check_out}
                  onChange={(e) => updateDraft(d._key, { check_out: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} value={d.booking ?? ""}
                  onChange={(e) => updateDraft(d._key, { booking: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <select className={cellInput} value={d.property}
                  onChange={(e) => updateDraft(d._key, { property: e.target.value })}>
                  {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <select className={cellInput} value={d.channel ?? ""}
                  onChange={(e) => updateDraft(d._key, { channel: e.target.value })}>
                  {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input type="number" className={cellInput + " text-right"} value={d.guests ?? ""}
                  onChange={(e) => updateDraft(d._key, { guests: e.target.value ? Number(e.target.value) : null })} />
              </td>
              <td className="px-2 py-1.5">
                <input type="number" className={cellInput + " text-right"} value={d.income ?? ""}
                  onChange={(e) => updateDraft(d._key, { income: e.target.value ? Number(e.target.value) : null })} />
              </td>
              <td className="px-2 py-1.5">
                <input type="date" className={cellInput} value={d.booking_date ?? ""}
                  onChange={(e) => updateDraft(d._key, { booking_date: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} value={d.details ?? ""}
                  onChange={(e) => updateDraft(d._key, { details: e.target.value })} />
              </td>
              <td className="px-1">
                <button onClick={() => removeDraft(d._key)} className="h-7 w-7 grid place-items-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Toolbar
        msg={msg}
        onAdd={addDraft}
        onSave={saveAll}
        onExport={() =>
          downloadCsv(
            "bookings.csv",
            ["check_in", "check_out", "booking", "property", "channel", "guests", "income", "booking_date", "details"],
            filtered
          )
        }
        saving={saving}
        draftCount={drafts.length}
      />
    </Card>
  );
}

function IncomeTable({ rows, categories }: { rows: IncomeRow[]; categories: string[] }) {
  const [drafts, setDrafts] = useState<DraftIncome[]>([]);
  const [saving, startSaving] = useTransition();
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");

  const filtered = useMemo(
    () => filterAndSort(rows, { search, propertyFilter, categoryFilter, sort }),
    [rows, search, propertyFilter, categoryFilter, sort]
  );

  function addDraft() {
    setDrafts((d) => [
      ...d,
      { _key: newKey(), date: "", property: PROPERTIES[0], category: "", amount: 0, details: "" },
    ]);
  }
  function updateDraft(key: string, patch: Partial<DraftIncome>) {
    setDrafts((d) => d.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function removeDraft(key: string) {
    setDrafts((d) => d.filter((r) => r._key !== key));
  }
  function saveAll() {
    const valid = drafts.filter((d) => d.date && d.property && d.amount);
    if (!valid.length) {
      setMsg("Fill date, property and amount.");
      return;
    }
    setMsg("");
    startSaving(async () => {
      for (const d of valid) {
        const { _key, ...rest } = d;
        void _key;
        await saveIncome(rest);
      }
      setMsg(`Saved ${valid.length} income row${valid.length > 1 ? "s" : ""}.`);
      setDrafts([]);
      window.location.reload();
    });
  }

  return (
    <Card>
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search details, category..."
        selects={[
          {
            value: propertyFilter,
            onChange: setPropertyFilter,
            options: [{ value: "all", label: "All properties" }, ...PROPERTIES.map((p) => ({ value: p, label: p }))],
          },
          {
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))],
          },
          {
            value: sort,
            onChange: setSort,
            options: [
              { value: "date_desc", label: "Newest" },
              { value: "date_asc", label: "Oldest" },
              { value: "amount_desc", label: "Highest amount" },
              { value: "amount_asc", label: "Lowest amount" },
            ],
            icon: "sort",
          },
        ]}
        resultCount={filtered.length}
      />
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--fg-muted)]">
          <tr>
            <th className="px-3 py-3 text-left font-semibold">Date</th>
            <th className="px-3 py-3 text-left font-semibold">Property</th>
            <th className="px-3 py-3 text-left font-semibold">Category</th>
            <th className="px-3 py-3 text-right font-semibold">Amount</th>
            <th className="px-3 py-3 text-left font-semibold">Details</th>
            <th className="px-3 py-3 w-8" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)] text-[var(--fg)]">
              <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.property}</td>
              <td className="px-3 py-2">{r.category || "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatILS(Number(r.amount), { decimals: 0 })}</td>
              <td className="px-3 py-2 max-w-[260px] truncate text-[var(--fg-muted)]">{r.details || ""}</td>
              <td />
            </tr>
          ))}
          {drafts.map((d) => (
            <tr key={d._key} className="border-t border-[var(--border)] bg-[var(--brand-soft)]/30">
              <td className="px-2 py-1.5">
                <input type="date" className={cellInput} value={d.date}
                  onChange={(e) => updateDraft(d._key, { date: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <select className={cellInput} value={d.property}
                  onChange={(e) => updateDraft(d._key, { property: e.target.value })}>
                  {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} list="income-cats" value={d.category ?? ""}
                  onChange={(e) => updateDraft(d._key, { category: e.target.value })} />
                <datalist id="income-cats">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </td>
              <td className="px-2 py-1.5">
                <input type="number" className={cellInput + " text-right"} value={d.amount}
                  onChange={(e) => updateDraft(d._key, { amount: Number(e.target.value) })} />
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} value={d.details ?? ""}
                  onChange={(e) => updateDraft(d._key, { details: e.target.value })} />
              </td>
              <td className="px-1">
                <button onClick={() => removeDraft(d._key)} className="h-7 w-7 grid place-items-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Toolbar
        msg={msg}
        onAdd={addDraft}
        onSave={saveAll}
        onExport={() =>
          downloadCsv("income.csv", ["date", "property", "category", "amount", "details"], filtered)
        }
        saving={saving}
        draftCount={drafts.length}
      />
    </Card>
  );
}

function ExpensesTable({ rows, categories }: { rows: ExpenseRow[]; categories: string[] }) {
  const [drafts, setDrafts] = useState<DraftExpense[]>([]);
  const [saving, startSaving] = useTransition();
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");

  const filtered = useMemo(
    () => filterAndSort(rows, { search, propertyFilter, categoryFilter, sort }),
    [rows, search, propertyFilter, categoryFilter, sort]
  );

  function addDraft() {
    setDrafts((d) => [
      ...d,
      { _key: newKey(), date: "", property: PROPERTIES[0], category: "", amount: 0, details: "" },
    ]);
  }
  function updateDraft(key: string, patch: Partial<DraftExpense>) {
    setDrafts((d) => d.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function removeDraft(key: string) {
    setDrafts((d) => d.filter((r) => r._key !== key));
  }
  function saveAll() {
    const valid = drafts.filter((d) => d.date && d.property && d.amount);
    if (!valid.length) {
      setMsg("Fill date, property and amount.");
      return;
    }
    setMsg("");
    startSaving(async () => {
      for (const d of valid) {
        const { _key, ...rest } = d;
        void _key;
        await saveExpense(rest);
      }
      setMsg(`Saved ${valid.length} expense row${valid.length > 1 ? "s" : ""}.`);
      setDrafts([]);
      window.location.reload();
    });
  }

  return (
    <Card>
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search details, category..."
        selects={[
          {
            value: propertyFilter,
            onChange: setPropertyFilter,
            options: [{ value: "all", label: "All properties" }, ...PROPERTIES.map((p) => ({ value: p, label: p }))],
          },
          {
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))],
          },
          {
            value: sort,
            onChange: setSort,
            options: [
              { value: "date_desc", label: "Newest" },
              { value: "date_asc", label: "Oldest" },
              { value: "amount_desc", label: "Highest amount" },
              { value: "amount_asc", label: "Lowest amount" },
            ],
            icon: "sort",
          },
        ]}
        resultCount={filtered.length}
      />
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--fg-muted)]">
          <tr>
            <th className="px-3 py-3 text-left font-semibold">Date</th>
            <th className="px-3 py-3 text-left font-semibold">Property</th>
            <th className="px-3 py-3 text-left font-semibold">Category</th>
            <th className="px-3 py-3 text-right font-semibold">Amount</th>
            <th className="px-3 py-3 text-left font-semibold">Details</th>
            <th className="px-3 py-3 w-8" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)] text-[var(--fg)]">
              <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.property}</td>
              <td className="px-3 py-2">{r.category || "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatILS(Number(r.amount), { decimals: 0 })}</td>
              <td className="px-3 py-2 max-w-[260px] truncate text-[var(--fg-muted)]">{r.details || ""}</td>
              <td />
            </tr>
          ))}
          {drafts.map((d) => (
            <tr key={d._key} className="border-t border-[var(--border)] bg-[var(--brand-soft)]/30">
              <td className="px-2 py-1.5">
                <input type="date" className={cellInput} value={d.date}
                  onChange={(e) => updateDraft(d._key, { date: e.target.value })} />
              </td>
              <td className="px-2 py-1.5">
                <select className={cellInput} value={d.property}
                  onChange={(e) => updateDraft(d._key, { property: e.target.value })}>
                  {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} list="expense-cats" value={d.category ?? ""}
                  onChange={(e) => updateDraft(d._key, { category: e.target.value })} />
                <datalist id="expense-cats">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </td>
              <td className="px-2 py-1.5">
                <input type="number" className={cellInput + " text-right"} value={d.amount}
                  onChange={(e) => updateDraft(d._key, { amount: Number(e.target.value) })} />
              </td>
              <td className="px-2 py-1.5">
                <input className={cellInput} value={d.details ?? ""}
                  onChange={(e) => updateDraft(d._key, { details: e.target.value })} />
              </td>
              <td className="px-1">
                <button onClick={() => removeDraft(d._key)} className="h-7 w-7 grid place-items-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Toolbar
        msg={msg}
        onAdd={addDraft}
        onSave={saveAll}
        onExport={() =>
          downloadCsv("expenses.csv", ["date", "property", "category", "amount", "details"], filtered)
        }
        saving={saving}
        draftCount={drafts.length}
      />
    </Card>
  );
}

function Toolbar({
  msg,
  onAdd,
  onSave,
  onExport,
  saving,
  draftCount,
}: {
  msg: string;
  onAdd: () => void;
  onSave: () => void;
  onExport?: () => void;
  saving: boolean;
  draftCount: number;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex-wrap">
      <Button variant="secondary" onClick={onAdd}>
        <Plus className="h-4 w-4 inline mr-1" /> Add row
      </Button>
      <Button onClick={onSave} disabled={saving || draftCount === 0}>
        <Save className="h-4 w-4 inline mr-1" />
        {saving ? "Saving..." : `Save ${draftCount || ""}`.trim()}
      </Button>
      {onExport && (
        <Button variant="ghost" onClick={onExport}>
          <Download className="h-4 w-4 inline mr-1" /> Export CSV
        </Button>
      )}
      {msg && <span className="text-sm text-[var(--fg-muted)]">{msg}</span>}
    </div>
  );
}

type SelectSpec = {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: "sort";
};

function FilterBar({
  search,
  onSearch,
  searchPlaceholder,
  selects,
  resultCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  selects: SelectSpec[];
  resultCount: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--fg)] focus:border-[var(--fg)]"
        />
      </div>
      {selects.map((s, i) => (
        <div key={i} className="relative">
          {s.icon === "sort" && (
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)] pointer-events-none" />
          )}
          <select
            value={s.value}
            onChange={(e) => s.onChange(e.target.value)}
            className={
              "py-1.5 pr-7 text-sm rounded-md bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--fg)] " +
              (s.icon === "sort" ? "pl-7" : "pl-3")
            }
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <span className="text-xs text-[var(--fg-muted)] ml-auto">{resultCount} rows</span>
    </div>
  );
}

type SimpleRow = { date: string; property: string; category?: string | null; amount: number; details?: string | null };
function filterAndSort<T extends SimpleRow>(
  rows: T[],
  opts: { search: string; propertyFilter: string; categoryFilter: string; sort: string }
): T[] {
  const q = opts.search.trim().toLowerCase();
  let out = rows.filter((r) => {
    if (opts.propertyFilter !== "all" && r.property !== opts.propertyFilter) return false;
    if (opts.categoryFilter !== "all" && (r.category || "") !== opts.categoryFilter) return false;
    if (!q) return true;
    const hay = [r.details, r.category, r.property].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
  const cmp: Record<string, (a: T, b: T) => number> = {
    date_asc: (a, b) => a.date.localeCompare(b.date),
    date_desc: (a, b) => b.date.localeCompare(a.date),
    amount_asc: (a, b) => Number(a.amount) - Number(b.amount),
    amount_desc: (a, b) => Number(b.amount) - Number(a.amount),
  };
  out = [...out].sort(cmp[opts.sort] || cmp.date_desc);
  return out;
}
