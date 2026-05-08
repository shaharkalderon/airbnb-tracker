"use client";
import { useState, useTransition, useMemo } from "react";
import { Button, Input, Select, Label, Modal, PageHeader, EmptyState } from "@/components/ui";
import { PROPERTIES, CHANNELS, formatILS, nightsBetween } from "@/lib/utils";
import { Plus, Pencil, Trash2, User, MapPin, Calendar as CalIcon, Search, X } from "lucide-react";
import { saveBooking, deleteBooking, type BookingInput } from "./actions";

type Booking = BookingInput & { id: number };

export default function BookingsClient({ initial }: { initial: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== "all" && b.property !== filter) return false;
      if (!q) return true;
      const hay = [b.booking, b.property, b.channel, b.details]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, filter, query]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const grouped = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    for (const b of filtered) {
      const ci = new Date(b.check_in);
      ci.setHours(0, 0, 0, 0);
      if (ci.getTime() >= today.getTime()) upcoming.push(b);
      else past.push(b);
    }
    return { upcoming, past };
  }, [filtered, today]);

  function openNew() {
    setEditing({
      id: 0,
      check_in: "",
      check_out: "",
      booking: "",
      guests: null,
      property: PROPERTIES[0],
      channel: "Airbnb",
      rental_period: null,
      income: null,
      details: "",
      booking_date: "",
    });
    setOpen(true);
  }

  function openEdit(b: Booking) {
    setEditing(b);
    setOpen(true);
  }

  async function onSave(input: BookingInput) {
    await saveBooking(input);
    const r = await fetch("/api/bookings", { cache: "no-store" });
    setBookings(await r.json());
    setOpen(false);
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this booking?")) return;
    startTransition(async () => {
      await deleteBooking(id);
      setBookings((bs) => bs.filter((b) => b.id !== id));
    });
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        right={
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 text-[var(--fg-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guests, channel…"
                className="pl-9 pr-9 py-2.5 rounded-full border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)] focus:border-transparent text-sm w-64 bg-[var(--surface)]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full hover:bg-[var(--bg)] text-[var(--fg-muted)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
              <option value="all">All Properties</option>
              {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Button onClick={openNew}><Plus className="h-4 w-4 inline mr-1" /> Add Booking</Button>
          </div>
        }
      />

      {query && (
        <div className="text-sm text-[var(--fg-muted)] mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </div>
      )}

      {grouped.upcoming.length === 0 && grouped.past.length === 0 ? (
        <EmptyState message="No bookings yet." />
      ) : (
        <>
          {grouped.upcoming.length > 0 && (
            <Section title="Upcoming" count={grouped.upcoming.length}>
              {grouped.upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} onEdit={openEdit} onDelete={onDelete} />
              ))}
            </Section>
          )}
          {grouped.past.length > 0 && (
            <Section title="Past" count={grouped.past.length} muted>
              {grouped.past.map((b) => (
                <BookingCard key={b.id} booking={b} onEdit={openEdit} onDelete={onDelete} muted />
              ))}
            </Section>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Edit Booking" : "New Booking"}>
        {editing && <BookingForm initial={editing} onSubmit={onSave} />}
      </Modal>
    </div>
  );
}

function Section({ title, count, muted, children }: { title: string; count: number; muted?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className={`text-xl font-bold ${muted ? "text-[var(--fg-muted)]" : "text-[var(--fg)]"}`}>{title}</h2>
        <span className="text-sm text-[var(--fg-muted)]">· {count}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function BookingCard({ booking, onEdit, onDelete, muted }: { booking: BookingInput & { id: number }; onEdit: (b: BookingInput & { id: number }) => void; onDelete: (id: number) => void; muted?: boolean }) {
  const nights = nightsBetween(booking.check_in, booking.check_out);
  const perNight = booking.income && nights > 0 ? Number(booking.income) / nights : null;
  const channelColors: Record<string, string> = {
    Airbnb: "bg-[var(--brand-soft)] text-[#FF385C]",
    Private: "bg-[var(--teal-soft)] text-[var(--teal)]",
    Other: "bg-[var(--bg)] text-[var(--fg-muted)]",
  };
  const ch = booking.channel || "Other";
  return (
    <div className={`group bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 hover:shadow-md transition ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-[#222222] grid place-items-center text-white flex-shrink-0">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-[var(--fg)] truncate">{booking.booking || "Guest"}</div>
              <div className="text-xs text-[var(--fg-muted)] mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {booking.property}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onEdit(booking)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] opacity-0 group-hover:opacity-100 transition">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(booking.id)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--brand-soft)] text-[var(--fg-muted)] hover:text-[var(--brand)] opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-3 text-sm text-[var(--fg)]">
            <CalIcon className="h-4 w-4 text-[var(--fg-muted)] mt-0.5 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-medium tabular-nums">{booking.check_in}</span>
              <span className="font-medium tabular-nums">{booking.check_out}</span>
            </div>
            <span className="text-[var(--fg-muted)] ml-auto whitespace-nowrap">{nights} night{nights !== 1 ? "s" : ""}</span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${channelColors[ch]}`}>{ch}</span>
              {booking.guests && (
                <span className="text-xs text-[var(--fg-muted)]">{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[var(--fg)] tabular-nums">{formatILS(booking.income)}</div>
              {perNight != null && (
                <div className="text-xs text-[var(--fg-muted)] tabular-nums">{formatILS(perNight, { decimals: 0 })}/night</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingForm({ initial, onSubmit }: { initial: BookingInput; onSubmit: (b: BookingInput) => Promise<void> }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof BookingInput>(k: K, v: BookingInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(form); }
    finally { setSaving(false); }
  }

  const auto = form.check_in && form.check_out ? nightsBetween(form.check_in, form.check_out) : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Check In</Label><Input type="date" required value={form.check_in} onChange={(e) => set("check_in", e.target.value)} /></div>
        <div><Label>Check Out</Label><Input type="date" required value={form.check_out} onChange={(e) => set("check_out", e.target.value)} /></div>
      </div>
      <div><Label>Booking (Guest Name)</Label><Input value={form.booking ?? ""} onChange={(e) => set("booking", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Guests</Label><Input type="number" value={form.guests ?? ""} onChange={(e) => set("guests", e.target.value ? Number(e.target.value) : null)} /></div>
        <div><Label>Rental Period {auto !== null && <span className="text-[var(--fg-muted)] font-normal normal-case tracking-normal">(auto: {auto})</span>}</Label><Input type="number" value={form.rental_period ?? ""} onChange={(e) => set("rental_period", e.target.value ? Number(e.target.value) : null)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Property</Label>
          <Select value={form.property} onChange={(e) => set("property", e.target.value)}>
            {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div><Label>Channel</Label>
          <Select value={form.channel ?? ""} onChange={(e) => set("channel", e.target.value)}>
            <option value="">—</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Income (₪)</Label><Input type="number" step="0.01" value={form.income ?? ""} onChange={(e) => set("income", e.target.value ? Number(e.target.value) : null)} /></div>
        <div><Label>Booking Date</Label><Input type="date" value={form.booking_date ?? ""} onChange={(e) => set("booking_date", e.target.value)} /></div>
      </div>
      <div><Label>Details</Label><Input value={form.details ?? ""} onChange={(e) => set("details", e.target.value)} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
