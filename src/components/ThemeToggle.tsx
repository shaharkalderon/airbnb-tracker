"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(t);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[var(--fg)] hover:bg-[var(--bg)] font-medium w-full"
      aria-label="Toggle theme"
    >
      {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {mounted && theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
