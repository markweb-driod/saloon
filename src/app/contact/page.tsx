"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, subject: subject || undefined, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send your message");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 bg-cream-100 py-20 sm:py-28">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="Get in touch"
          title="Contact Waifuu"
          subtitle="Wholesale inquiries, salon partnerships, or general questions — we read every message."
        />

        <Card flat className="mt-10 p-6! sm:p-8!">
          {sent ? (
            <div className="text-center">
              <p className="font-serif text-xl font-semibold text-navy-950">Message sent.</p>
              <p className="mt-2 text-sm text-slate-600">
                Thank you for reaching out — our team will reply within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <Textarea
                label="Message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="gold" disabled={submitting} className="w-full justify-center px-5 py-3 text-sm">
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </Card>
      </Container>
    </main>
  );
}
