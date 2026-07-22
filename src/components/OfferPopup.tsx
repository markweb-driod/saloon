"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";

type PromoCode = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  expiresAt: string | null;
};

type OfferType = "PRODUCT" | "SERVICE";

function describeDiscount(promo: PromoCode): string {
  return promo.discountType === "PERCENT"
    ? `${promo.discountValue}% off`
    : `€${promo.discountValue} off`;
}

export default function OfferPopup() {
  const [visible, setVisible] = useState(false);
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [offerType, setOfferType] = useState<OfferType>("PRODUCT");

  useEffect(() => {
    // Show periodically every 30 seconds
    const interval = setInterval(() => {
      setOfferType(prev => prev === "PRODUCT" ? "SERVICE" : "PRODUCT");
      setVisible(true);
      // Auto hide after 15 seconds if not interacted with
      setTimeout(() => setVisible(false), 15000);
    }, 30000);
    
    // Initial show
    const initialTimer = setTimeout(() => {
        setVisible(true);
    }, 2400);

    fetch("/api/promo-codes/active")
      .then((r) => r.json())
      .then((data) => setPromo(data.promoCodes?.[0] ?? null))
      .catch(() => setPromo(null));

    return () => {
        clearInterval(interval);
        clearTimeout(initialTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  function handleCopy() {
    if (!promo) return;
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-x-4 bottom-6 z-50 pointer-events-none sm:inset-x-auto sm:right-6 sm:w-[24rem]">
      <div className="pointer-events-auto overflow-hidden rounded-[2rem] border border-white/10 bg-navy-950/95 px-5 py-5 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-400">
              {offerType === "PRODUCT" ? "Product Special" : "Service Special"}
            </p>
            {promo && offerType === "PRODUCT" ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-cream-100">
                  {describeDiscount(promo)} your order
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-cream-200/80">
                  Use code at checkout &mdash; first orders also receive express shipping.
                </p>
              </>
            ) : offerType === "SERVICE" ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-cream-100">20% off Signature Balayage</h2>
                <p className="mt-2 text-sm leading-relaxed text-cream-200/80">
                  Book any mobile salon service this week and enjoy a complimentary deep conditioning treatment.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-lg font-semibold text-cream-100">Launch storefront savings</h2>
                <p className="mt-2 text-sm leading-relaxed text-cream-200/80">
                  First orders receive express shipping and a complimentary premium care kit.
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-sm text-cream-200 transition hover:text-cream-100"
          >
            Close
          </button>
        </div>

        {promo && offerType === "PRODUCT" && (
          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-gold-400/40 bg-gold-500/10 px-4 py-2.5 text-left transition hover:border-gold-400/70"
          >
            <span className="font-serif text-lg tracking-[0.15em] text-gold-400">{promo.code}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-cream-200/70">
              {copied ? "Copied!" : "Tap to copy"}
            </span>
          </button>
        )}

        <div className="mt-5 flex items-center gap-3">
          <LinkButton href={offerType === "PRODUCT" ? "/products" : "/book"} variant="gold" className="w-full px-4 py-3 text-sm">
            {offerType === "PRODUCT" ? "Shop the offer" : "Book your service"}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
