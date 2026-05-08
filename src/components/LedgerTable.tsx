"use client";
import { useState, useTransition, useMemo } from "react";
import { Card, Button, Input, Select, Label, Modal, PageHeader, EmptyState } from "@/components/ui";
import { PROPERTIES, formatILS, MONTHS_LONG } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Row = {
  id: number;
  date: string;
  property: string;
  category: string | null;
  amount: number;
  details: string | null;
};

type LedgerInput = Omit<Row, "id"> & { id?: number };

export default function LedgerTable({
  title,
  amountLabel,
  rows: initialRows,
  categories,
  onSave,
  onDelete,
  refetchUrl,
  amountColor = "indigo",
}: {
  title: string;
  amountLabel: string;
  rows: Row[];
  categories: string[];
  onSave: (i: LedgerInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  refetchUrl: string;
  amountColor?: "indigo" | "rose" | "emerald";
}) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<LedgerInput | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [, startTransition] = useTransition();

  const filtered = filter === "all" ? rows : rows.filter((r) => r.property === filter);

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: Row[]; total: number }>();
    for (const r of filtered) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
      if (!map.has(key)) map.set(key, { label, rows: [], total: 0 });
      const g = map.get(key)!;
      g.rows.push(r);
      g.total += Number(r.amount || 0);
    }
    return Array.from(map.values());
  }, [filtered]);

  function openNew() {
    setEditing({
      date: new Date().toISOString().slice(0, 10),
      property: PROPERTIES[0],
      category: categories[0] ?? "",
      amount: 0,
      details: "",
    });
    setOpen(true);
  }
  function openEdit(r: Row) {
    setEditing(r);
    setOpen(true);
  }
  async function save(input: LedgerInput) {
    await onSave(input);
    const r = await fetch(refetchUrl, { cache: "no-store" });
    setRows(await r.json());
    setOpen(false);
  }
  async function del(id: number) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      await onDelete(id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    });
  }

  const amountClass = { indigo: "text-[var(--fg)]", rose: "text-[var(--danger)]", emerald: "text-[var(--success)]" }[amountColor];
  const dotColor = { indigo: "#222222", rose: "#C13515", emerald: "#067647" }[amountColor];

  return (
    <div>
      <PageHeader
        title={title}
        right={
          <div className="flex gap-2">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
              <option value="all">All Properties</option>
              {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Button onClick={openNew}><Plus className="h-4 w-4 inline mr-1" /> Add</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Total</div>
          <div className={`text-3xl font-bold mt-1 tracking-tight ${amountClass}`}>{formatILS(total)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Entries</div>
          <div className="text-3xl font-bold mt-1 text-[var(--fg)] tracking-tight">{filtered.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Average</div>
          <div className="text-3xl font-bold mt-1 text-[var(--fg)] tracking-tight">{filtered.length ? formatILS(total / filtered.length, { decimals: 0 }) : "—"}</div>
        </Card>
      </div>

      {filtered.length === 0 ? <EmptyState message="No entries yet." /> : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <div key={g.label}>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-lg font-bold text-[var(--fg)]">{g.label}</h2>
                <span className="text-sm text-[var(--fg-muted)]">· {g.rows.length}</span>
                <span className={`text-sm ml-auto font-semibold tabular-nums ${amountClass}`}>{formatILS(g.total)}</span>
              </div>
              <Card className="divide-y divide-[var(--border)]">
                {g.rows.map((r) => (
                  <div key={r.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-2)] transition">
                    <div className="h-10 w-10 rounded-full grid place-items-center text-xs font-bold flex-shrink-0" style={{ background: dotColor + "15", color: dotColor }}>
                      {(r.category || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[var(--fg)] truncate">{r.category || "—"}</div>
                      <div className="text-xs text-[var(--fg-muted)] mt-0.5 truncate">
                        {r.property} · {r.date}{r.details ? ` · ${r.details}` : ""}
                      </div>
                    </div>
                    <div className={`text-base font-bold tabular-nums whitespace-nowrap ${amountClass}`}>{formatILS(r.amount)}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEdit(r)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(r.id)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--brand-soft)] text-[var(--fg-muted)] hover:text-[var(--brand)]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}>
        {editing && <RowForm initial={editing} categories={categories} onSubmit={save} amountLabel={amountLabel} />}
      </Modal>
    </div>
  );
}

function RowForm({ initial, categories, onSubmit, amountLabel }: { initial: LedgerInput; categories: string[]; onSubmit: (r: LedgerInput) => Promise<void>; amountLabel: string }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  function set<K extends keyof LedgerInput>(k: K, v: LedgerInput[K]) { setForm((f) => ({ ...f, [k]: v })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(form); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Date</Label><Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div><Label>{amountLabel}</Label><Input type="number" step="0.01" required value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} /></div>
      </div>
      <div><Label>Property</Label>
        <Select value={form.property} onChange={(e) => set("property", e.target.value)}>
          {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>
      <div><Label>Category</Label>
        <Select value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">—</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <div><Label>Details</Label><Input value={form.details ?? ""} onChange={(e) => set("details", e.target.value)} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
