"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { formatILS, nightsBetween } from "@/lib/utils";
import { MapPin, Calendar as CalIcon, Users, Tag, ChevronDown, Moon } from "lucide-react";

type Booking = {
  id: number;
  check_in: string;
  check_out: string;
  booking?: string | null;
  guests?: number | null;
  property: string;
  channel?: string | null;
  income?: number | null;
  details?: string | null;
  booking_date?: string | null;
};

function fmtDate(d: string | Date, opts: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString(undefined, opts);
}

function fmtDDMM(d: string | Date) {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function ReservationCard({ b, variant }: { b: Booking; variant: "upcoming" | "ongoing" }) {
  const [open, setOpen] = useState(false);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const ci = new Date(b.check_in);
  ci.setHours(0, 0, 0, 0);
  const co = new Date(b.check_out);
  co.setHours(0, 0, 0, 0);
  const nights = nightsBetween(b.check_in, b.check_out);

  let label: string;
  let tierClass: string;
  if (variant === "upcoming") {
    const daysLeft = daysBetween(startOfToday, ci);
    label = daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`;
    const tier: "green" | "yellow" | "red" =
      daysLeft <= 3 ? "green" : daysLeft <= 7 ? "yellow" : "red";
    tierClass = {
      green: "bg-[#E6F4EA] text-[#067647]",
      yellow: "bg-[#FEF3C7] text-[#B25E09]",
      red: "bg-[#FFE5EB] text-[var(--brand)]",
    }[tier];
  } else {
    // ongoing — days until check-out
    const daysToCheckout = daysBetween(startOfToday, co);
    label = daysToCheckout === 0 ? "Leaves today" : daysToCheckout === 1 ? "Leaves tmrw" : `${daysToCheckout}d left`;
    tierClass = "bg-[#E0F2FE] text-[#075985]"; // calm blue
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition"
      >
        <div className={`shrink-0 px-2.5 text-center rounded-lg py-2 ${tierClass}`}>
          <div className="text-sm font-bold leading-tight tabular-nums whitespace-nowrap">{label}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--fg)] truncate">
            {b.booking || "Unnamed guest"}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--fg-muted)] flex-wrap">
            <span className="tabular-nums">{fmtDDMM(b.check_in)} → {fmtDDMM(b.check_out)}</span>
            <span className="flex items-center gap-1 tabular-nums"><Moon className="h-3 w-3" />{nights}</span>
            <span className="flex items-center gap-1 tabular-nums"><Users className="h-3 w-3" />{b.guests ?? "—"}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--fg-muted)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-3">
            <Field label="Check-in" icon={<CalIcon className="h-3 w-3" />}>
              {fmtDate(b.check_in, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </Field>
            <Field label="Check-out" icon={<CalIcon className="h-3 w-3" />}>
              {fmtDate(b.check_out, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </Field>
            <Field label="Property" icon={<MapPin className="h-3 w-3" />}>
              {b.property}
            </Field>
            <Field label="Channel" icon={<Tag className="h-3 w-3" />}>
              {b.channel || "—"}
            </Field>
            <Field label="Guests" icon={<Users className="h-3 w-3" />}>
              {b.guests ?? "—"}
            </Field>
            <Field label="Nights">
              <span className="tabular-nums">{nights}</span>
            </Field>
            <Field label="Income">
              <span className="text-[var(--success)] font-semibold tabular-nums">
                {b.income != null ? formatILS(Number(b.income), { decimals: 0 }) : "—"}
              </span>
            </Field>
            <Field label="Booked on">
              {b.booking_date ? fmtDate(b.booking_date, { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </Field>
          </div>
          {b.details && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold mb-1">Details</div>
              <div className="text-sm text-[var(--fg)] whitespace-pre-wrap">{b.details}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-[var(--fg)] font-medium">{children}</div>
    </div>
  );
}

export default function UpcomingReservations({
  bookings,
  ongoing = [],
}: {
  bookings: Booking[];
  ongoing?: Booking[];
}) {
  if (!bookings.length && !ongoing.length) return null;
  return (
    <div className="mb-6 space-y-4">
      {ongoing.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider">Ongoing reservations</h2>
            <span className="text-xs text-[var(--fg-muted)]">{ongoing.length} active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {ongoing.map((b) => (
              <ReservationCard key={b.id} b={b} variant="ongoing" />
            ))}
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider">Upcoming reservations</h2>
            <span className="text-xs text-[var(--fg-muted)]">Next {bookings.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {bookings.map((b) => (
              <ReservationCard key={b.id} b={b} variant="upcoming" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
