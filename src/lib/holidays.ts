import { HebrewCalendar, flags } from "@hebcal/core";

const cache = new Map<number, Map<string, string[]>>();

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getHolidaysForYear(year: number): Map<string, string[]> {
  const cached = cache.get(year);
  if (cached) return cached;

  const events = HebrewCalendar.calendar({
    year,
    isHebrewYear: false,
    il: true,
    candlelighting: false,
    sedrot: false,
    omer: false,
    noMinorFast: true,
    noModern: false,
    noRoshChodesh: true,
    noSpecialShabbat: true,
    locale: "en",
  });

  const map = new Map<string, string[]>();
  for (const ev of events) {
    if (ev.getFlags() & flags.PARSHA_HASHAVUA) continue;
    const d = ev.getDate().greg();
    const key = isoDate(d);
    const name = ev.render("en");
    const list = map.get(key) ?? [];
    if (!list.includes(name)) list.push(name);
    map.set(key, list);
  }
  cache.set(year, map);
  return map;
}
