"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Select, Button } from "@/components/ui";
import Drawer from "@/components/Drawer";
import { PROPERTIES, MONTHS_LONG, MONTHS, formatILS, formatILSCompact } from "@/lib/utils";
import { getHolidaysForYear } from "@/lib/holidays";
import { ChevronLeft, ChevronRight, User, Calendar as CalIcon, Users as UsersIcon, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Booking = {
  id: number;
  check_in: string;
  check_out: string;
  booking: string | null;
  guests: number | null;
  property: string;
  channel: string | null;
  income: number | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nightsBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

type DayCell = { day: number; date: Date } | null;

export default function CalendarClient({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [property, setProperty] = useState<string>(PROPERTIES[0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells: DayCell[] = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const totalDays = last.getDate();
    const arr: DayCell[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push({ day: d, date: new Date(year, month, d) });
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [year, month]);

  const propBookings = useMemo(
    () => bookings.filter((b) => b.property === property),
    [bookings, property]
  );

  // Lane assignment: bookings that touch (incl. turnover days) → different lanes.
  const bookingLane = useMemo(() => {
    const sorted = [...propBookings].sort((a, b) => a.check_in.localeCompare(b.check_in));
    const lanes: { lastEnd: string }[] = [];
    const map = new Map<number, number>();
    for (const b of sorted) {
      let assigned = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i].lastEnd < b.check_in) {
          assigned = i;
          lanes[i].lastEnd = b.check_out;
          break;
        }
      }
      if (assigned === -1) {
        assigned = lanes.length;
        lanes.push({ lastEnd: b.check_out });
      }
      map.set(b.id, assigned);
    }
    return map;
  }, [propBookings]);

  // Map iso-date -> [lane 0 booking | null, lane 1 booking | null]
  const bookingByDay = useMemo(() => {
    const map = new Map<string, [Booking | null, Booking | null]>();
    for (const b of propBookings) {
      const ci = toDate(b.check_in);
      const co = toDate(b.check_out);
      const nights = nightsBetween(ci, co);
      const lane = (bookingLane.get(b.id) ?? 0) % 2;
      // Cover days [check_in, check_out] inclusive — check_out day shows the departing pill
      // alongside any arriving booking for that day.
      for (let i = 0; i <= nights; i++) {
        const d = new Date(ci);
        d.setDate(ci.getDate() + i);
        const key = isoDate(d);
        const existing = map.get(key) ?? [null, null];
        existing[lane] = b;
        map.set(key, existing);
      }
    }
    return map;
  }, [propBookings, bookingLane]);

  function computeSegments(lane: 0 | 1) {
    return cells.map((cell, idx): { booking: Booking; span: number } | null => {
      if (!cell) return null;
      const iso = isoDate(cell.date);
      const b = bookingByDay.get(iso)?.[lane] ?? null;
      if (!b) return null;
      const prevIdx = idx - 1;
      const prevCell = prevIdx >= 0 ? cells[prevIdx] : null;
      const prevSameBooking = prevCell && bookingByDay.get(isoDate(prevCell.date))?.[lane]?.id === b.id;
      const isRowStart = idx % 7 === 0;
      if (prevSameBooking && !isRowStart) return null;
      let span = 1;
      for (let j = idx + 1; j < cells.length; j++) {
        if (j % 7 === 0) break;
        const c = cells[j];
        if (!c) break;
        const next = bookingByDay.get(isoDate(c.date))?.[lane] ?? null;
        if (!next || next.id !== b.id) break;
        span++;
      }
      return { booking: b, span };
    });
  }

  const segmentsLane0 = useMemo(() => computeSegments(0), [cells, bookingByDay]);
  const segmentsLane1 = useMemo(() => computeSegments(1), [cells, bookingByDay]);

  const holidays = useMemo(() => getHolidaysForYear(year), [year]);

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  }
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  }

  const years = Array.from({ length: 8 }, (_, i) => 2021 + i);

  return (
    <div>
      <PageHeader
        title="Calendar"
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            >
              Today
            </Button>
            <Select value={property} onChange={(e) => setProperty(e.target.value)} className="w-44">
              {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
        }
      />

      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="h-10 w-10 grid place-items-center rounded-full border border-[var(--border-strong)] hover:bg-[var(--bg)] transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-3xl font-bold text-[var(--fg)] bg-transparent border-none focus:outline-none cursor-pointer tracking-tight">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="text-3xl font-bold text-[var(--fg)] bg-transparent border-none focus:outline-none cursor-pointer tracking-tight">
            {MONTHS_LONG.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
        <button onClick={nextMonth} className="h-10 w-10 grid place-items-center rounded-full border border-[var(--border-strong)] hover:bg-[var(--bg)] transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-3">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] md:text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const iso = isoDate(cell.date);
          const isPast = cell.date.getTime() < today.getTime();
          const isToday = cell.date.getTime() === today.getTime();
          const isSelected = selectedDate === iso;
          const seg0 = segmentsLane0[i];
          const seg1 = segmentsLane1[i];

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={cn(
                "relative flex flex-col items-start min-h-[96px] sm:min-h-[110px] md:min-h-[120px] rounded-xl md:rounded-2xl border transition group text-left p-1.5 sm:p-2 md:p-2.5",
                isPast
                  ? "bg-[var(--bg)] border-[var(--border)]"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--fg)]",
                isSelected && !isToday && "border-[#FF385C] ring-1 ring-[#FF385C]"
              )}
            >
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <div
                  className={cn(
                    "text-sm font-semibold h-7 w-7 grid place-items-center rounded-full shrink-0",
                    isToday && "bg-[#FF385C] text-white",
                    !isToday && isSelected && "bg-gradient-to-tr from-[#FF385C] via-[#E61E4D] to-[#BD1E59] text-white",
                    !isToday && !isSelected && (isPast ? "text-[var(--fg-faint)]" : "text-[var(--fg)]")
                  )}
                >
                  {cell.day}
                </div>
                {holidays.get(iso) && (
                  <div className="hidden md:block text-[10px] leading-tight font-semibold text-[#1D4ED8] bg-[#DBEAFE] border border-[#93C5FD] rounded-md px-1.5 py-0.5 truncate min-w-0 flex-1">
                    {holidays.get(iso)!.join(" · ")}
                  </div>
                )}
              </div>
              {holidays.get(iso) && (
                <div
                  className="md:hidden absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#1D4ED8]"
                  aria-label="Holiday"
                />
              )}

              {seg0 && <BookingPill booking={seg0.booking} span={seg0.span} position="upper" />}
              {seg1 && <BookingPill booking={seg1.booking} span={seg1.span} position="lower" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-6 text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF385C] inline-block" />
          Today
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-6 rounded-full bg-[#222222] inline-block" />
          Booked
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-[var(--bg)] border border-[var(--border)] inline-block" />
          Past
        </div>
      </div>

      <DayDrawer
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        booking={selectedDate ? (bookingByDay.get(selectedDate)?.[0] ?? bookingByDay.get(selectedDate)?.[1] ?? null) : null}
        property={property}
        holidayNames={selectedDate ? holidays.get(selectedDate) ?? null : null}
      />
    </div>
  );
}

function DayDrawer({
  open,
  onClose,
  date,
  booking,
  property,
  holidayNames,
}: {
  open: boolean;
  onClose: () => void;
  date: string | null;
  booking: Booking | null;
  property: string;
  holidayNames: string[] | null;
}) {
  if (!date) return <Drawer open={open} onClose={onClose} title="" >{null}</Drawer>;
  const d = toDate(date);
  const longDate = `${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  let nights: number | null = null;
  let perNight: number | null = null;
  if (booking) {
    const ci = toDate(booking.check_in);
    const co = toDate(booking.check_out);
    nights = nightsBetween(ci, co);
    if (booking.income && nights > 0) perNight = Number(booking.income) / nights;
  }

  return (
    <Drawer open={open} onClose={onClose} title={longDate} width="md">
      <div className="p-6 space-y-6">
        <div className="text-sm text-[var(--fg-muted)]">
          Property <span className="font-semibold text-[var(--fg)] ml-1">{property}</span>
        </div>

        {holidayNames && holidayNames.length > 0 && (
          <div className="rounded-2xl border border-[#93C5FD] bg-[#DBEAFE] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[#1D4ED8] mb-1">Holiday</div>
            <div className="text-sm font-semibold text-[#1E3A8A]">{holidayNames.join(" · ")}</div>
          </div>
        )}

        {booking ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#FF385C] grid place-items-center text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--fg)]">{booking.booking || "Guest"}</div>
                <div className="text-sm text-[var(--fg-muted)]">{booking.channel || "—"}</div>
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
              <DetailRow icon={<CalIcon className="h-4 w-4" />} label="Check-in" value={booking.check_in} />
              <DetailRow icon={<CalIcon className="h-4 w-4" />} label="Check-out" value={booking.check_out} />
              <DetailRow icon={<UsersIcon className="h-4 w-4" />} label="Guests" value={String(booking.guests ?? "—")} />
              <DetailRow icon={<Tag className="h-4 w-4" />} label="Nights" value={String(nights ?? "—")} />
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--bg)]">
              <div className="flex justify-between items-baseline">
                <div className="text-sm text-[var(--fg-muted)]">Total income</div>
                <div className="text-2xl font-bold text-[var(--fg)] tabular-nums">{formatILS(booking.income)}</div>
              </div>
              {perNight != null && (
                <div className="flex justify-between items-baseline mt-2">
                  <div className="text-xs text-[var(--fg-muted)]">Per night</div>
                  <div className="text-sm text-[var(--fg-muted)] tabular-nums">{formatILSCompact(perNight)}</div>
                </div>
              )}
            </div>

            <Link href={`/bookings`}>
              <Button variant="secondary" className="w-full">View all bookings</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-[var(--bg)] grid place-items-center mx-auto mb-4">
              <CalIcon className="h-8 w-8 text-[var(--fg-muted)]" />
            </div>
            <div className="text-lg font-bold text-[var(--fg)]">No booking</div>
            <div className="text-sm text-[var(--fg-muted)] mt-1 mb-6">This day is open at {property}.</div>
            <Link href={`/bookings`}>
              <Button className="mx-auto"><Plus className="h-4 w-4 inline mr-1" /> Add booking</Button>
            </Link>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function BookingPill({
  booking,
  span,
  position,
}: {
  booking: Booking;
  span: number;
  position: "upper" | "lower";
}) {
  const positionClass =
    position === "upper"
      ? "top-10 md:top-12"
      : "bottom-1.5 md:bottom-3";
  return (
    <div
      className={cn(
        "absolute left-1 md:left-2 h-5 md:h-7 bg-[#222222] text-white text-[10px] md:text-xs font-semibold flex items-center pl-0.5 pr-1.5 md:pr-2.5 gap-1 md:gap-2 z-10 rounded-full whitespace-nowrap shadow-md pointer-events-none",
        positionClass
      )}
      style={{
        width: `calc(${span * 100}% + ${(span - 1) * 0.25}rem - 0.5rem)`,
      }}
    >
      <span className="h-4 w-4 md:h-6 md:w-6 rounded-full bg-gradient-to-tr from-[#FF385C] via-[#E61E4D] to-[#BD1E59] grid place-items-center flex-shrink-0 ring-2 ring-[#222222]">
        <User className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-white" />
      </span>
      <span className="truncate">
        {(booking.booking || "Guest").split(/\s+/)[0]}
        {booking.guests && booking.guests > 1 ? ` + ${booking.guests - 1}` : ""}
      </span>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-[var(--fg-muted)]">
        <span className="text-[var(--fg)]">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--fg)]">{value}</div>
    </div>
  );
}
