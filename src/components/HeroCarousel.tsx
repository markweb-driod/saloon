"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import TiltCard from "@/components/ui/TiltCard";

const SLIDES = [
  {
    title: "Limited Couture Collections",
    subtitle: "Seasonal pieces delivered directly to boutique professionals.",
    cta: "Shop launch range",
    src: "/images/landing/hero-collections.svg",
  },
  {
    title: "Express Boutique Styling Kits",
    subtitle: "Premium clip-ins and accessories for instant salon-ready looks.",
    cta: "View styling kits",
    src: "/images/landing/couture-clip-in-set.svg",
  },
  {
    title: "Designer Lace Wigs",
    subtitle: "Refined silhouettes with natural movement and luxurious density.",
    cta: "Explore wigs",
    src: "/images/landing/designer-lace-wig.svg",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-navy-950/90 p-4 shadow-[0_30px_90px_-34px_rgba(10,14,39,0.45)] backdrop-blur">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gold-400">Live showcase</p>
          <h2 className="text-2xl font-semibold text-cream-100 sm:text-3xl">
            {SLIDES[active].title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-cream-200/80 sm:text-base">
            {SLIDES[active].subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/products" variant="gold" className="px-4 py-2.5 text-sm">
              {SLIDES[active].cta}
            </LinkButton>
            <LinkButton href="/consultation" variant="outline-light" className="px-4 py-2.5 text-sm">
              Book Consultation
            </LinkButton>
          </div>
          <div className="flex gap-2">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2.5 w-12 rounded-full transition-all duration-300 ${index === active ? "bg-gold-400" : "bg-white/20 hover:bg-white/30"}`}
              />
            ))}
          </div>
        </div>
        <TiltCard className="relative">
          <Card className="overflow-hidden bg-[#0b1226]/90 p-0">
            <ImagePlaceholder
              label={SLIDES[active].title}
              src={SLIDES[active].src}
              alt={SLIDES[active].title}
              tone="navy"
              aspect="aspect-[4/3]"
              className="rounded-[1.5rem]"
              priority
            />
          </Card>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-950/95 to-transparent" />
        </TiltCard>
      </div>
    </div>
  );
}
