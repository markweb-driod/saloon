"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <p className="text-sm text-cream-200/85">
        You&apos;re on the list &mdash; watch your inbox for launch offers.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-cream-100 outline-none transition placeholder:text-cream-200/40 focus:border-gold-400/60 sm:flex-1"
      />
      <Button type="submit" variant="gold" className="px-5 py-2.5 text-sm">
        Subscribe
      </Button>
    </form>
  );
}
