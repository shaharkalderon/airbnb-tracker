"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Wallet,
  Receipt,
  TrendingUp,
  PieChart,
  LogOut,
  Menu,
  X,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/bookings-overview", label: "Bookings Overview", icon: TrendingUp },
  { href: "/expenses-overview", label: "Expenses Overview", icon: PieChart },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const navInner = (
    <>
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <Logo size={32} />
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--bg)]"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                active
                  ? "bg-[var(--fg)] text-[var(--surface)] font-semibold"
                  : "text-[var(--fg)] hover:bg-[var(--bg)] font-medium"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition",
            pathname === "/admin" || pathname.startsWith("/admin/")
              ? "bg-[var(--fg)] text-[var(--surface)] font-semibold"
              : "text-[var(--fg)] hover:bg-[var(--bg)]"
          )}
        >
          <Table className="h-4 w-4" />
          Admin
        </Link>
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[var(--fg)] hover:bg-[var(--bg)] font-medium w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--bg)]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo size={28} />
        <div className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[var(--surface)] border-r border-[var(--border)] flex-col h-screen sticky top-0">
        {navInner}
      </aside>

      {/* Mobile slide-in drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-opacity",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-72 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transform transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {navInner}
        </aside>
      </div>
    </>
  );
}
