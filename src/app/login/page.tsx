"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { config } from "@/lib/config";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/";
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      setErr("Wrong password");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md bg-[var(--surface)] rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.08)] p-10 border border-[var(--border)]"
    >
      <div className="flex justify-center"><Logo size={56} /></div>
      <h1 className="text-3xl font-bold text-[var(--fg)] text-center mt-6 tracking-tight">{config.brandName}</h1>
      <p className="text-sm text-[var(--fg-muted)] mb-8 text-center mt-2">Enter your password to continue</p>
      <input
        autoFocus
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="Password"
        className="w-full px-5 py-4 rounded-2xl border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)] focus:border-transparent text-base transition"
      />
      {err && <p className="text-sm text-[var(--danger)] mt-3 text-center">{err}</p>}
      <button
        disabled={loading}
        className="w-full mt-5 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] hover:from-[#E31C5F] hover:to-[#BD1E59] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition shadow-sm"
      >
        {loading ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg)] p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
