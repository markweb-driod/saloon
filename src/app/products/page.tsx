"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import ProductModal, { type CatalogProduct } from "@/components/ProductModal";
import Reveal from "@/components/ui/Reveal";
import TiltCard from "@/components/ui/TiltCard";
import { PRODUCT_IMAGES } from "@/lib/productImages";

const CATEGORY_BLURBS: Record<string, string> = {
  Shampoo: "Daily cleansing formulas that respect your color and texture.",
  Conditioner: "Deep conditioning to rebuild strength between visits.",
  Treatment: "Targeted oils, serums, and masks for specific hair goals.",
  Styling: "Heat protection and finishing tools for the perfect blowout.",
};

const FEATURES = [
  {
    title: "Stylist-curated",
    body: "Every product on this shelf is hand-picked and used by our own stylists in-chair.",
  },
  {
    title: "Loyalty points on every purchase",
    body: "Retail purchases count toward your loyalty balance, just like services.",
  },
  {
    title: "Ask before you buy",
    body: "Bring a product to your next appointment for a free application walkthrough.",
  },
];

type RawProduct = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string;
  inStock: boolean;
  lowStock: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortByPrice, setSortByPrice] = useState(false);
  const [search, setSearch] = useState("");
  const [activeProduct, setActiveProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    fetch("/api/products/catalog")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category ?? "Other")))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    let list =
      activeCategory === "All"
        ? products
        : products.filter((p) => (p.category ?? "Other") === activeCategory);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q)
      );
    }
    if (sortByPrice) {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    }
    return list;
  }, [products, activeCategory, sortByPrice, search]);

  function withImage(p: RawProduct): CatalogProduct {
    return { ...p, image: PRODUCT_IMAGES[p.name] ?? "" };
  }

  return (
    <main className="bg-cream-100 text-navy-950">
      <section className="relative overflow-hidden bg-navy-950/95 py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-gold-400/30 bg-gold-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.32em] text-gold-400">
              Retail Shelf
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-cream-100 sm:text-5xl">
              The haircare our stylists actually use.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-200/80 sm:text-lg">
              Every product on our shelf is stocked in real time from our salon inventory &mdash;
              what you see here is what&apos;s on hand today. Reserve a bottle for your next visit
              or ask your stylist for a personal recommendation.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/book" variant="gold">
                Book a visit
              </LinkButton>
              <LinkButton href="#shelf" variant="outline-light">
                Browse the shelf
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>

      <section id="shelf" className="scroll-mt-24 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Live inventory"
            title="Shop the retail shelf"
            subtitle="Filter by category or sort by price &mdash; stock levels update straight from the salon's inventory system."
          />

          <div className="mt-10">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full max-w-md rounded-full border border-navy-900/15 bg-white px-5 py-3 text-sm text-navy-950 outline-none transition-colors placeholder:text-slate-500/60 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === c
                      ? "border-navy-900 bg-navy-900 text-cream-100"
                      : "border-navy-900/15 text-navy-950 hover:border-gold-500"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSortByPrice((v) => !v)}
              className="rounded-full border border-navy-900/15 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:border-gold-500"
            >
              {sortByPrice ? "Sorted: price low to high" : "Sort by price"}
            </button>
          </div>

          {loading && <p className="mt-12 text-sm text-slate-500">Loading the shelf&hellip;</p>}

          {!loading && visibleProducts.length === 0 && (
            <p className="mt-12 text-sm text-slate-500">
              {search
                ? `No products match "${search}".`
                : "No products in this category right now."}
            </p>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 70}>
                <TiltCard className="group h-full">
                  <Card className="flex h-full flex-col">
                    <ImagePlaceholder
                      label={product.name}
                      src={PRODUCT_IMAGES[product.name]}
                      alt={product.name}
                      tone="cream"
                      aspect="aspect-[4/3]"
                      className="rounded-[1.5rem]"
                    />
                    <div className="mt-6 flex flex-1 flex-col">
                      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-600">
                        {product.category ?? "Featured"}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl font-semibold text-navy-950">
                        {product.name}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="font-serif text-xl text-navy-950">
                          ${Number(product.price).toFixed(2)}
                        </p>
                        {!product.inStock ? (
                          <span className="text-xs font-medium text-red-500">Sold out</span>
                        ) : product.lowStock ? (
                          <span className="text-xs font-medium text-gold-600">Low stock</span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">In stock</span>
                        )}
                      </div>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setActiveProduct(withImage(product))}
                          disabled={!product.inStock}
                          className="inline-flex w-full justify-center rounded-full bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {product.inStock ? "Preview" : "Sold out"}
                        </button>
                      </div>
                    </div>
                  </Card>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream-200/60 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Why shop with us"
            title="More than a shelf of bottles"
            subtitle="Retail here is an extension of your appointment, not a separate transaction."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-navy-900/10 bg-white/70 p-6"
              >
                <h3 className="font-serif text-lg font-semibold text-navy-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy-950 py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-gold-400/30 bg-gold-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-gold-400">
                In-salon only
              </span>
              <h2 className="font-serif text-4xl font-semibold tracking-tight text-cream-100 sm:text-5xl">
                Every bottle earns loyalty points.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-cream-200/80 sm:text-lg">
                Retail purchases are rung up at checkout alongside your service, so they count
                toward your loyalty balance automatically &mdash; no separate account or app
                needed.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(CATEGORY_BLURBS).map(([category, blurb]) => (
                  <div key={category} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-400">
                      {category}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-cream-200">{blurb}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <p className="font-serif text-2xl text-cream-100">Not sure what to pick?</p>
              <p className="mt-3 text-sm leading-relaxed text-cream-200/80">
                Bring your hair goals to your next appointment and your stylist will build a
                take-home routine from what&apos;s on the shelf today.
              </p>
              <Link
                href="/book"
                className="mt-6 inline-flex rounded-full border border-gold-400/40 px-5 py-2.5 text-sm font-semibold text-gold-400 transition hover:bg-gold-500/10"
              >
                Book a consultation
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {activeProduct && (
        <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}
    </main>
  );
}
