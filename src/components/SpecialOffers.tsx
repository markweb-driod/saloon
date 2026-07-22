"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

type PromoCode = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  expiresAt: string | null;
};

function describeDiscount(promo: PromoCode): string {
  return promo.discountType === "PERCENT" ? `${promo.discountValue}% off` : `€${promo.discountValue} off`;
}

export default function SpecialOffers() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promo-codes/active")
      .then((r) => r.json())
      .then((data) => setPromoCodes(data.promoCodes ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading || promoCodes.length === 0) {
    return null;
  }

  return (
    <section className="bg-navy-950 py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400">Active promotions</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-cream-100 sm:text-4xl">
              Special offers &amp; discounts
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promoCodes.map((promo) => (
            <Card key={promo.code} className="bg-white/8 text-cream-100">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold-400">Limited time</p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-cream-100">
                {describeDiscount(promo)}
              </h3>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-gold-400/40 bg-gold-500/10 px-4 py-2.5">
                <span className="font-serif text-lg tracking-[0.15em] text-gold-400">{promo.code}</span>
              </div>
              {promo.expiresAt && (
                <p className="mt-3 text-xs text-cream-200/60">
                  Valid through {new Date(promo.expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                </p>
              )}
              <LinkButton href="/products" variant="gold" className="mt-6 w-full px-4 py-3 text-sm">
                Use this offer
              </LinkButton>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
