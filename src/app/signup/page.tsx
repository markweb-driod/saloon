"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

function passwordStrength(password: string): { label: string; ratio: number; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length === 0) return { label: "", ratio: 0, color: "bg-transparent" };
  if (score <= 1) return { label: "Weak", ratio: 0.25, color: "bg-red-400" };
  if (score <= 2) return { label: "Fair", ratio: 0.5, color: "bg-amber-400" };
  if (score <= 3) return { label: "Good", ratio: 0.75, color: "bg-gold-500" };
  return { label: "Strong", ratio: 1, color: "bg-emerald-500" };
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: normalizedEmail, phone: phone || undefined, password }),
      });

      let data: { error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const friendlyMessage =
          res.status === 409
            ? "That email is already registered. Please log in or use another address."
            : data?.error ?? "Signup failed";
        setError(friendlyMessage);
        return;
      }

      router.push(next ?? "/account");
      router.refresh();
    } catch {
      setError("We couldn't create your account right now. Please try again.");
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
            Create account
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-navy-950">
            Join Waifuu Salon
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <Input
              label="Phone (optional)"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
            />
            <div>
              <PasswordInput
                label="Password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              {password.length > 0 && (
                <div className="mt-2 animate-[fade-in_0.25s_ease-out_both]">
                  <div className="h-1.5 overflow-hidden rounded-full bg-navy-900/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.ratio * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Password strength: <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="animate-[fade-in_0.3s_ease-out_both] text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" variant="gold" className="mt-2 w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="font-medium text-gold-600 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
