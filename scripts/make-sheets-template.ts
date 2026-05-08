import * as XLSX from "xlsx";
import path from "node:path";

// Sample data
const bookings = [
  { check_in: "2026-05-09", check_out: "2026-05-11", booking: "Test Guest", guests: 2, property: "Marrakech", channel: "Airbnb", income: 2500, booking_date: "2026-05-08", details: "" },
  { check_in: "2026-05-20", check_out: "2026-05-23", booking: "דניאל דורון", guests: 5, property: "Marrakech", channel: "Airbnb", income: 4905, booking_date: "2026-04-30", details: "" },
  { check_in: "2026-06-03", check_out: "2026-06-06", booking: "אלכס", guests: 5, property: "Marrakech", channel: "Private", income: 3600, booking_date: "2026-05-01", details: "" },
];
const income = [
  { date: "2026-05-09", property: "Marrakech", category: "Booking", amount: 2500, details: "Test Guest" },
  { date: "2026-04-12", property: "Marrakech", category: "Booking", amount: 10671, details: "" },
];
const expenses = [
  { date: "2026-04-15", property: "Marrakech", category: "Cleaning", amount: 350, details: "" },
  { date: "2026-04-20", property: "The Red Sea", category: "Maintenance", amount: 800, details: "" },
];
const holidays = [
  { date: "2026-05-01", name: "Pesach Sheni" },
  { date: "2026-05-05", name: "Lag BaOmer" },
  { date: "2026-05-15", name: "Yom Yerushalayim" },
  { date: "2026-05-21", name: "Erev Shavuot" },
  { date: "2026-05-22", name: "Shavuot" },
];

const wb = XLSX.utils.book_new();

// ---------- BOOKINGS ----------
const bookingsHeader = ["Check-in", "Check-out", "Guest", "Guests", "Property", "Channel", "Income", "Booked on", "Details"];
const bookingsRows = bookings.map((b) => [b.check_in, b.check_out, b.booking, b.guests, b.property, b.channel, b.income, b.booking_date, b.details]);
const bookingsSheet = XLSX.utils.aoa_to_sheet([bookingsHeader, ...bookingsRows]);
bookingsSheet["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, bookingsSheet, "Bookings");

// ---------- INCOME ----------
const incomeHeader = ["Date", "Property", "Category", "Amount", "Details"];
const incomeRows = income.map((r) => [r.date, r.property, r.category, r.amount, r.details]);
const incomeSheet = XLSX.utils.aoa_to_sheet([incomeHeader, ...incomeRows]);
incomeSheet["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, incomeSheet, "Income");

// ---------- EXPENSES ----------
const expensesHeader = ["Date", "Property", "Category", "Amount", "Details"];
const expensesRows = expenses.map((r) => [r.date, r.property, r.category, r.amount, r.details]);
const expensesSheet = XLSX.utils.aoa_to_sheet([expensesHeader, ...expensesRows]);
expensesSheet["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

// ---------- DASHBOARD ----------
const dash: (string | number | { f: string })[][] = [
  ["DorisDayInn — Dashboard"],
  [],
  ["Year:", 2026],
  [],
  ["KPI", "Value"],
  ["Annual Income", { f: "SUMIFS(Income!D:D, Income!A:A, \">=\"&DATE(B3,1,1), Income!A:A, \"<=\"&DATE(B3,12,31))" }],
  ["Annual Expenses", { f: "SUMIFS(Expenses!D:D, Expenses!A:A, \">=\"&DATE(B3,1,1), Expenses!A:A, \"<=\"&DATE(B3,12,31))" }],
  ["Annual Profit", { f: "B6-B7" }],
  ["Margin %", { f: "IFERROR(B8/B6, 0)" }],
  [],
  ["Monthly P&L", "Income", "Expenses", "Profit"],
  ...Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
    return [
      monthName,
      { f: `SUMIFS(Income!D:D, Income!A:A, ">=" & DATE(B3,${month},1), Income!A:A, "<=" & EOMONTH(DATE(B3,${month},1),0))` },
      { f: `SUMIFS(Expenses!D:D, Expenses!A:A, ">=" & DATE(B3,${month},1), Expenses!A:A, "<=" & EOMONTH(DATE(B3,${month},1),0))` },
      { f: `B${i + 12} - C${i + 12}` },
    ];
  }),
  [],
  ["Upcoming Reservations (next 5)"],
  ["Days", "Guest", "Check-in", "Check-out", "Property", "Income"],
  ...Array.from({ length: 5 }, (_, i) => {
    const r = i + 27;
    return [
      { f: `IFERROR(C${r}-TODAY(), "")` },
      { f: `IFERROR(INDEX(SORT(FILTER(Bookings!A:I, Bookings!A:A>=TODAY()), 1, TRUE), ${i + 1}, 3), "")` },
      { f: `IFERROR(INDEX(SORT(FILTER(Bookings!A:I, Bookings!A:A>=TODAY()), 1, TRUE), ${i + 1}, 1), "")` },
      { f: `IFERROR(INDEX(SORT(FILTER(Bookings!A:I, Bookings!A:A>=TODAY()), 1, TRUE), ${i + 1}, 2), "")` },
      { f: `IFERROR(INDEX(SORT(FILTER(Bookings!A:I, Bookings!A:A>=TODAY()), 1, TRUE), ${i + 1}, 5), "")` },
      { f: `IFERROR(INDEX(SORT(FILTER(Bookings!A:I, Bookings!A:A>=TODAY()), 1, TRUE), ${i + 1}, 7), "")` },
    ];
  }),
];
const dashSheet = XLSX.utils.aoa_to_sheet(dash);
dashSheet["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, dashSheet, "Dashboard");

// ---------- CALENDAR ----------
// Formula-driven monthly grid. User picks year and month in B1, B2.
const calRows: (string | number | { f: string })[][] = [
  ["Year:", 2026],
  ["Month:", 5],
  [],
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
];
// Build 6 weeks (42 cells). Each cell: date if within month, else blank. Show day + booking guest.
for (let week = 0; week < 6; week++) {
  const row: (string | number | { f: string })[] = [];
  for (let dow = 0; dow < 7; dow++) {
    // Cell index 0..41
    const idx = week * 7 + dow;
    // Date formula:
    // first cell of grid = DATE(year,month,1) - WEEKDAY(DATE(year,month,1),1) + 1
    // (Sunday-start)
    const dateF = `DATE($B$1,$B$2,1) - WEEKDAY(DATE($B$1,$B$2,1),1) + 1 + ${idx}`;
    // Show: day number if month matches; with holiday/booking annotation
    row.push({
      f: `IF(MONTH(${dateF})=$B$2, TEXT(${dateF},"d") & IFERROR(CHAR(10) & "🏖 " & VLOOKUP(${dateF}, Holidays!A:B, 2, FALSE), "") & IFERROR(CHAR(10) & "👤 " & INDEX(Bookings!C:C, MATCH(1, (Bookings!A:A<=${dateF}) * (Bookings!B:B>${dateF}), 0)), ""), "")`,
    });
  }
  calRows.push(row);
}
const calSheet = XLSX.utils.aoa_to_sheet(calRows);
calSheet["!cols"] = Array(7).fill({ wch: 18 });
calSheet["!rows"] = [
  undefined as unknown as { hpt: number },
  undefined as unknown as { hpt: number },
  undefined as unknown as { hpt: number },
  undefined as unknown as { hpt: number },
  ...Array(6).fill({ hpt: 60 }),
];
XLSX.utils.book_append_sheet(wb, calSheet, "Calendar");

// ---------- HOLIDAYS ----------
const holHeader = ["Date", "Name"];
const holRows = holidays.map((h) => [h.date, h.name]);
const holSheet = XLSX.utils.aoa_to_sheet([holHeader, ...holRows]);
holSheet["!cols"] = [{ wch: 12 }, { wch: 24 }];
XLSX.utils.book_append_sheet(wb, holSheet, "Holidays");

// ---------- HOW TO USE ----------
const help = [
  ["Airbnb Tracker — Google Sheets template"],
  [],
  ["Tabs:"],
  ["• Dashboard — KPIs and Monthly P&L (computed from Income & Expenses)"],
  ["• Calendar — formula grid; change Year/Month in cells B1/B2"],
  ["• Bookings — your bookings"],
  ["• Income — manual income entries"],
  ["• Expenses — manual expense entries"],
  ["• Holidays — Israeli holidays lookup table (paste more rows for future years)"],
  [],
  ["To share:"],
  ["1. File → Share → Anyone with the link → Viewer"],
  ["2. Append &usp=sharing&copy=true to the URL when sending — opens with 'Make a copy'."],
  [],
  ["Limitations vs the web app:"],
  ["• No clickable booking pills — guest name shows in calendar cell as text."],
  ["• No interactive drawer; details are in Bookings sheet."],
  ["• Conditional formatting for the upcoming-reservation color tiers must be set up manually (Format → Conditional formatting on the Days column in Dashboard)."],
];
const helpSheet = XLSX.utils.aoa_to_sheet(help);
helpSheet["!cols"] = [{ wch: 80 }];
XLSX.utils.book_append_sheet(wb, helpSheet, "How to use");

const outPath = path.join(process.cwd(), "..", "Airbnb-tracker-template.xlsx");
XLSX.writeFile(wb, outPath);
console.log("Wrote:", outPath);
