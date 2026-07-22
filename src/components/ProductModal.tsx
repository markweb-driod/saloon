"use client";

import { Button, LinkButton } from "@/components/ui/Button";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

export type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string;
  inStock: boolean;
  lowStock: boolean;
  image: string;
};

export default function ProductModal({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 px-4 pb-8 pt-24 sm:items-center sm:p-8">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-navy-950/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream-100 transition hover:bg-white/10"
        >
          Close
        </button>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_0.85fr] p-6 sm:p-8">
          <ImagePlaceholder
            label={product.name}
            src={product.image}
            alt={product.name}
            tone="navy"
            aspect="aspect-[4/3] lg:aspect-auto lg:h-full"
            className="rounded-[1.75rem] lg:h-full"
            priority
          />
          <div className="space-y-6 text-cream-100">
            <span className="inline-flex rounded-full border border-gold-400/30 bg-gold-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-gold-400">
              {product.category ?? "Featured"}
            </span>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-cream-100 sm:text-4xl">
                {product.name}
              </h2>
              <p className="text-sm leading-relaxed text-cream-200/80">
                {product.description}
              </p>
              <p className="text-2xl font-semibold text-gold-400">
                ${Number(product.price).toFixed(2)}
              </p>
              {!product.inStock ? (
                <p className="text-sm font-medium text-red-400">
                  Currently sold out &mdash; ask your stylist about restock timing.
                </p>
              ) : product.lowStock ? (
                <p className="text-sm font-medium text-gold-400">Only a few left in salon.</p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <LinkButton
                href="/book"
                variant="gold"
                className={`w-full px-4 py-3 text-sm ${!product.inStock ? "pointer-events-none opacity-40" : ""}`}
              >
                Reserve at the salon
              </LinkButton>
              <Button onClick={onClose} variant="outline" className="w-full px-4 py-3 text-sm text-cream-100">
                Continue browsing
              </Button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-cream-200/80">
              <p className="font-medium text-cream-100">Available exclusively in-salon:</p>
              <ul className="mt-3 space-y-2">
                <li>&bull; Complimentary application demo with purchase</li>
                <li>&bull; Personalized recommendation from your stylist</li>
                <li>&bull; Loyalty points earned on every purchase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
