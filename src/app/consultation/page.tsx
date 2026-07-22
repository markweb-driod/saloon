"use client";

import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const EVENT_TYPES = ["Wedding / Bridal", "Photoshoot / Editorial", "Group Styling Event", "VIP Mobile Service"] as const;

export default function ConsultationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [numPeople, setNumPeople] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function toggleEventType(type: string) {
    setEventTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const enquiryDetails = [
      eventDate && `Event Date: ${eventDate}`,
      numPeople && `Number of People: ${numPeople}`,
      eventTypes.length > 0 && `Event Types: ${eventTypes.join(", ")}`,
      message.trim()
    ].filter(Boolean).join("\n\n");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ name, email, phone: phone || undefined, subject: "Mobile Salon Consultation Request", message: enquiryDetails || "Mobile Salon Consultation Request" }),
      });
      window.clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "We couldn't send your request. Please try again.");
        return;
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === "AbortError" ? "The request took too long. Please check your connection and try again." : "We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 bg-cream-100 py-16 sm:py-20">
      <Container className="max-w-5xl">
        <SectionHeading eyebrow="Custom Events & Groups" title="Request a Consultation" subtitle="Tell us about your event and our master stylists will prepare a custom mobile salon package for you." />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Bridal & Events", "Bespoke styling for weddings, galas, and photoshoots."],
            ["Group Bookings", "Pamper your entire party with on-location luxury services."],
            ["Fast follow-up", "Our booking team responds within one business day to coordinate details."],
          ].map(([title, description]) => (
            <Card key={title} className="p-5!">
              <p className="font-serif text-lg font-semibold text-navy-950">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </Card>
          ))}
        </div>

        <Card flat className="mx-auto mt-10 max-w-3xl p-6! sm:p-8!">
          {sent ? (
            <div className="py-6 text-center" role="status" aria-live="polite">
              <p className="font-serif text-2xl font-semibold text-navy-950">Consultation request received.</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Thank you. Our team will get back to you with availability and details within one business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
                <Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                <Input label="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} />
                <Input label="Event Date (optional)" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
                <Input label="Number of People (optional)" type="number" min="1" value={numPeople} onChange={(event) => setNumPeople(event.target.value)} />
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-navy-950">Event Type</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {EVENT_TYPES.map((type) => {
                    const selected = eventTypes.includes(type);
                    return <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${selected ? "border-gold-500 bg-gold-300/20 text-navy-950" : "border-navy-900/10 text-slate-600 hover:border-gold-500/50"}`}><input type="checkbox" checked={selected} onChange={() => toggleEventType(type)} className="accent-gold-500" />{type}</label>;
                  })}
                </div>
              </fieldset>
              <Textarea label="Event Details" required rows={5} placeholder="Tell us more about your event, the styles you have in mind, and any specific location or timing requirements." value={message} onChange={(event) => setMessage(event.target.value)} />
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <Button type="submit" variant="gold" disabled={submitting} className="w-full justify-center px-5 py-3 text-sm">{submitting ? "Sending request…" : "Request Consultation"}</Button>
              {submitting && <p className="text-center text-sm text-slate-600" role="status" aria-live="polite">Sending your consultation request…</p>}
            </form>
          )}
        </Card>
      </Container>
    </main>
  );
}
