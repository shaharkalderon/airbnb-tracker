"use client";
import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>{children}</div>;
}

export function StatCard({ icon, label, value, accent = "brand" }: { icon: ReactNode; label: string; value: string; accent?: "brand" | "teal" | "emerald" | "amber" }) {
  const colors = {
    brand: "bg-[var(--brand-soft)] text-[#FF385C]",
    teal: "bg-[var(--teal-soft)] text-[var(--teal)]",
    emerald: "bg-[var(--success-soft)] text-[var(--success)]",
    amber: "bg-[#FFF7E5] text-[#B25E09]",
  } as const;
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-full grid place-items-center", colors[accent])}>{icon}</div>
      <div>
        <div className="text-sm text-[var(--fg-muted)]">{label}</div>
        <div className="text-2xl font-bold text-[var(--fg)] mt-0.5 tracking-tight">{value}</div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, right, year }: { title: string; right?: ReactNode; year?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--fg)] tracking-tight">{title}</h1>
        {year}
      </div>
      {right}
    </div>
  );
}

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-gradient-to-r from-[#FF385C] to-[#E31C5F] hover:from-[#E31C5F] hover:to-[#BD1E59] text-white shadow-sm",
    secondary: "bg-[var(--surface)] border border-[#222222] hover:bg-[var(--bg)] text-[var(--fg)]",
    ghost: "hover:bg-[var(--bg)] text-[var(--fg)]",
    danger: "bg-[#C13515] hover:bg-[#A52A0E] text-white",
  }[variant];
  return <button className={cn("px-5 py-2.5 rounded-full font-semibold text-sm transition disabled:opacity-50", v, className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full px-4 py-2.5 rounded-xl border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)] focus:border-transparent text-sm transition", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("w-full px-4 py-2.5 rounded-xl border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)] bg-[var(--surface)] text-sm transition", className)} {...props}>{children}</select>;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full px-4 py-2.5 rounded-xl border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)] text-sm", className)} {...props} />;
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("block text-xs font-semibold text-[var(--fg)] mb-1.5 uppercase tracking-wide", className)}>{children}</label>;
}

export function Donut({ value, label, color = "#FF385C" }: { value: number; label: string; color?: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-[var(--fg-muted)] mb-2">{label}</div>
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} stroke="#EBEBEB" strokeWidth="10" fill="none" />
          <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="10" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-bold text-[var(--fg)]">{Math.round(value)}%</div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--fg)]">{title}</h2>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-[var(--fg-muted)] hover:bg-[var(--bg)] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="py-16 text-center text-[var(--fg-muted)] text-sm">{message}</div>;
}
