"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Reveal from "@/components/ui/Reveal";
import { getWhatsAppLink, getTelegramLink } from "@/lib/contact";
import { PRODUCT_IMAGES } from "@/lib/productImages";

type RawProduct = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string;
  inStock: boolean;
  lowStock: boolean;
};

type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
};

type PlacedOrder = {
  id: string;
  total: string;
  items: { productName: string; quantity: number; lineTotal: string }[];
};

export default function ShopPage() {
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

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

  const visibleProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((p) => (p.category ?? "Other") === activeCategory),
    [products, activeCategory]
  );

  const cartTotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  function addToCart(product: RawProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      const maxStock = 99;
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: Math.min(l.quantity + 1, maxStock) }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          maxStock,
        },
      ];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  async function placeOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlaceError(data.error ?? "Could not place order");
        return;
      }
      setPlacedOrder(data.order);
      setCart([]);
      fetch("/api/products/catalog")
        .then((r) => r.json())
        .then((d) => setProducts(d.products ?? []));
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return (
      <div className="animate-[fade-in_0.4s_ease-out_both]">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
          Order placed
        </h1>
        <Card className="mt-6 p-6!" flat>
          <p className="text-sm text-slate-600">
            Order <span className="font-medium text-navy-950">#{placedOrder.id.slice(-8)}</span> is
            reserved and waiting for payment.
          </p>
          <ul className="mt-4 divide-y divide-navy-900/10 text-sm">
            {placedOrder.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span className="text-navy-950">
                  {item.productName} &times; {item.quantity}
                </span>
                <span className="text-slate-600">${Number(item.lineTotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-navy-900/10 pt-4 font-serif text-lg text-navy-950">
            <span>Total</span>
            <span>${Number(placedOrder.total).toFixed(2)}</span>
          </div>
        </Card>

        <Card className="mt-6 p-6!" flat>
          <p className="font-serif text-lg font-semibold text-navy-950">Complete your payment</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Pay in-store when you pick up your order, or message our customer care team to
            arrange payment and delivery.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={getWhatsAppLink(`Hi! I'd like to complete payment for order #${placedOrder.id.slice(-8)}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              Message on WhatsApp
            </a>
            <a
              href={getTelegramLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-navy-900/15 px-5 py-2.5 text-sm font-medium text-navy-950 transition hover:border-gold-500"
            >
              Message on Telegram
            </a>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/account/orders" variant="outline" className="px-5 py-2.5 text-sm">
            View my orders
          </LinkButton>
          <Button
            variant="outline"
            onClick={() => setPlacedOrder(null)}
            className="px-5 py-2.5 text-sm"
          >
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
            Shop
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Reserve products from our live inventory &mdash; pay in-store or via customer care at
            pickup.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
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

          {loading && <p className="mt-8 text-sm text-slate-500">Loading the shelf&hellip;</p>}
          {!loading && visibleProducts.length === 0 && (
            <p className="mt-8 text-sm text-slate-500">No products in this category right now.</p>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {visibleProducts.map((product, index) => {
              const inCart = cart.find((l) => l.productId === product.id);
              return (
                <Reveal key={product.id} delay={index * 60}>
                  <Card className="flex h-full flex-col overflow-hidden p-0!" flat>
                    <ImagePlaceholder
                      label={product.name}
                      src={PRODUCT_IMAGES[product.name]}
                      alt={product.name}
                      tone="cream"
                      aspect="aspect-[5/3]"
                      className="rounded-none"
                      compact
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-600">
                        {product.category ?? "Featured"}
                      </p>
                      <h3 className="mt-2 font-serif text-lg font-semibold text-navy-950">
                        {product.name}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="font-serif text-lg text-navy-950">
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
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {!product.inStock
                          ? "Sold out"
                          : inCart
                            ? `In cart · ${inCart.quantity}`
                            : "Add to cart"}
                      </button>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5!" flat>
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg font-semibold text-navy-950">Your cart</p>
              {cartCount > 0 && (
                <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-medium text-cream-100">
                  {cartCount}
                </span>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Your cart is empty.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {cart.map((line) => (
                  <li key={line.productId} className="flex gap-3 text-sm">
                    <ImagePlaceholder
                      label={line.name}
                      src={PRODUCT_IMAGES[line.name]}
                      alt={line.name}
                      tone="cream"
                      aspect="aspect-square"
                      className="w-14 shrink-0 rounded-lg"
                      compact
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-navy-950">{line.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.productId)}
                          className="shrink-0 text-xs text-red-600 underline underline-offset-2"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.productId, line.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/15 text-navy-950 hover:border-gold-500"
                          >
                            &minus;
                          </button>
                          <span className="w-6 text-center text-navy-950">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.productId, line.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/15 text-navy-950 hover:border-gold-500"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-slate-600">
                          ${(line.price * line.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {cart.length > 0 && (
              <>
                <div className="mt-5 flex items-center justify-between border-t border-navy-900/10 pt-4 font-serif text-lg text-navy-950">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {placeError && <p className="mt-3 text-sm text-red-600">{placeError}</p>}
                <Button
                  variant="gold"
                  onClick={placeOrder}
                  disabled={placing}
                  className="mt-4 w-full px-4 py-3 text-sm"
                >
                  {placing ? "Placing order…" : "Place order"}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
