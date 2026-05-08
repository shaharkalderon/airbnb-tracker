"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function YearPicker({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function set(y: number) {
    const params = new URLSearchParams(sp);
    params.set("year", String(y));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={year}
      onChange={(e) => set(Number(e.target.value))}
      className="text-2xl font-semibold text-[#FF385C] bg-transparent border-none focus:outline-none cursor-pointer"
    >
      {years.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}
