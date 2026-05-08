"use client";
import { useId } from "react";

export function Logo({ size = 32 }: { size?: number }) {
  const id = useId().replace(/[:]/g, "");
  const gradId = `ddi-${id}`;
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DorisDayInn"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF385C" />
          <stop offset="100%" stopColor="#E31C5F" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradId})`} />
      <circle cx="20" cy="14" r="3.2" fill="#FFD25C" />
      <path d="M7 27 L20 17 L33 27 L33 30 L7 30 Z" fill="white" />
      <rect x="18" y="24" width="4" height="6" rx="1" fill={`url(#${gradId})`} />
    </svg>
  );
}

export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <div className="leading-tight">
        <div className="font-bold text-[var(--fg)] text-base tracking-tight">DorisDayInn</div>
        <div className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">Property tracker</div>
      </div>
    </div>
  );
}
