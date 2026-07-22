"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@salon.test" },
  { role: "Receptionist", email: "reception@salon.test" },
  { role: "Stylist", email: "stylist@salon.test" },
  { role: "Customer", email: "customer@salon.test" },
];
const DEMO_PASSWORD = "password123";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      const role = data.user.role;
      router.push(next ?? (role === "CUSTOMER" ? "/account" : "/dashboard"));
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center overflow-hidden bg-cream-100 px-4 py-16 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,162,75,0.16),_transparent_55%)]" />
      <div className="animate-float-slow absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="animate-float-slower absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-navy-500/10 blur-3xl" />

      <div className="relative w-full max-w-md animate-[scale-in_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-2.5 rounded-2xl bg-navy-950 px-4 py-2.5 transition-transform duration-300 hover:scale-105"
        >
          <span className="font-serif text-base font-semibold uppercase tracking-[0.2em] text-cream-100">
            Waifuu
          </span>
        </Link>

        <div className="rounded-[1.75rem] border border-navy-900/10 bg-white/80 p-8 shadow-[0_28px_80px_-30px_rgba(5,6,15,0.35)] backdrop-blur sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-600">
            Sign in
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-navy-950">Welcome back</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <PasswordInput
              label="Password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <p className="animate-[fade-in_0.3s_ease-out_both] text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" variant="gold" className="mt-2 w-full" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-medium text-gold-600 hover:underline"
            >
              Create one
            </Link>
          </p>

          <details className="mt-6 rounded-xl border border-navy-900/10 bg-cream-200/50 px-4 py-3 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium text-slate-600">Demo accounts</summary>
            <p className="mt-2">
              Password for all: <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => {
                    setEmail(acct.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="rounded-full border border-navy-900/15 bg-white px-3 py-1 font-medium text-navy-950 transition-colors hover:border-gold-500"
                >
                  {acct.role}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
