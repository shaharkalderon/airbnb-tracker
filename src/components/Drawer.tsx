"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export default function Drawer({
  open,
  onClose,
  title,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const w = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[width];

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full ${w} bg-[var(--surface)] shadow-2xl transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--fg)] text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--bg)] transition"
          >
            <X className="h-5 w-5 text-[var(--fg-muted)]" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)]">{children}</div>
      </div>
    </div>
  );
}
