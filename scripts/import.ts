/**
 * Import historical data from Tracker.xlsx into Supabase.
 * Run with: npx tsx scripts/import.ts
 */
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "node:fs";
import path from "node:path";

// Load .env.local manually
const envFile = dotenv.readFileSync(
  path.join(process.cwd(), ".env.local"),
  "utf8"
);
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const xlsxPath = path.join(process.cwd(), "..", "Tracker.xlsx");
console.log("Reading", xlsxPath);
const wb = XLSX.readFile(xlsxPath, { cellDates: true });

function toISODate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    // xlsx returns Date objects that may be 1 day off due to TZ — round to nearest day.
    // Add 12 hours then use UTC components → reliably gives the intended calendar date.
    const d = new Date(v.getTime() + 12 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function str(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

async function importBookings() {
  const ws = wb.Sheets["Bookings"];
  // Headers are at row 3 (1-based), data starts row 4
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 2, // 0-based -> row 3
    defval: null,
  });
  const cleaned = rows
    .filter((r) => r["Check In"] && r["Property"])
    .map((r) => ({
      check_in: toISODate(r["Check In"]),
      check_out: toISODate(r["Check Out"]),
      booking: str(r["Booking"]),
      guests: num(r["Guests"]),
      property: str(r["Property"])!,
      channel: str(r["Channel"]),
      rental_period: num(r["Rental Period"]),
      income: num(r["Income"] ?? r[" Income "]),
      details: str(r["Details"]),
      booking_date: toISODate(r["Booking Date"]),
    }))
    .filter((r) => r.check_in && r.check_out);

  console.log(`Bookings to import: ${cleaned.length}`);
  await supabase.from("bookings").delete().gt("id", 0);
  const { error } = await supabase.from("bookings").insert(cleaned);
  if (error) throw error;
  console.log("✓ Bookings imported");
}

async function importIncome() {
  const ws = wb.Sheets["Income"];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 2,
    defval: null,
  });
  const cleaned = rows
    .filter((r) => r["Date"] && r["Property"])
    .map((r) => ({
      date: toISODate(r["Date"])!,
      property: str(r["Property"])!,
      category: str(r["Category"]),
      amount: num(r["Income"] ?? r[" Income "]) ?? 0,
      details: str(r["Details"]),
    }));
  console.log(`Income to import: ${cleaned.length}`);
  await supabase.from("income").delete().gt("id", 0);
  const { error } = await supabase.from("income").insert(cleaned);
  if (error) throw error;
  console.log("✓ Income imported");
}

async function importExpenses() {
  const ws = wb.Sheets["Expenses"];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 2,
    defval: null,
  });
  const cleaned = rows
    .filter((r) => r["Date"] && r["Property"])
    .map((r) => ({
      date: toISODate(r["Date"])!,
      property: str(r["Property"])!,
      category: str(r["Category"]),
      amount: num(r["Expenses"] ?? r[" Expenses "]) ?? 0,
      details: str(r["Details"]),
    }));
  console.log(`Expenses to import: ${cleaned.length}`);
  await supabase.from("expenses").delete().gt("id", 0);
  const { error } = await supabase.from("expenses").insert(cleaned);
  if (error) throw error;
  console.log("✓ Expenses imported");
}

async function importCategories() {
  // Pull distinct categories from data
  const ws = wb.Sheets["SETTINGS BACKEND"];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
  });
  const incomeCats = new Set<string>();
  const expenseCats = new Set<string>();
  for (const r of data) {
    const ic = r["Income Categories"];
    const ec = r["Exenses Categories"];
    if (ic && typeof ic === "string" && !["Marrakech", "The Red Sea"].includes(ic)) {
      // skip property names
    }
    if (ec && typeof ec === "string") expenseCats.add(ec);
  }
  // Income categories: derive from actual income data
  for (const r of XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Income"],
    { range: 2, defval: null }
  )) {
    const c = r["Category"];
    if (c && typeof c === "string") incomeCats.add(c);
  }
  for (const r of XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Expenses"],
    { range: 2, defval: null }
  )) {
    const c = r["Category"];
    if (c && typeof c === "string") expenseCats.add(c);
  }

  const cats = [
    ...[...incomeCats].map((name) => ({ kind: "income" as const, name })),
    ...[...expenseCats].map((name) => ({ kind: "expense" as const, name })),
  ];
  console.log(
    `Categories to import: ${incomeCats.size} income, ${expenseCats.size} expense`
  );
  await supabase.from("categories").delete().gt("id", 0);
  const { error } = await supabase.from("categories").insert(cats);
  if (error) throw error;
  console.log("✓ Categories imported");
}

async function main() {
  await importCategories();
  await importBookings();
  await importIncome();
  await importExpenses();
  console.log("\nAll done!");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
