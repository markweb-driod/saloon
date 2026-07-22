"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";
import TextAction from "@/components/ui/TextAction";

type Service = { id: string; name: string; price: string; durationMinutes: number };
type Product = { id: string; name: string; unitPrice: string; stockQuantity: number };
type StaffOption = { id: string; name: string };
type CheckoutableAppointment = {
  id: string;
  startTime: string;
  staffId: string;
  customer: { user: { name: string } };
  staff: { user: { name: string } };
  services: { service: Service }[];
};

const TAX_RATE = 0.08;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function POSCheckout({
  services,
  products,
  staffOptions,
  checkoutableAppointments,
}: {
  services: Service[];
  products: Product[];
  staffOptions: StaffOption[];
  checkoutableAppointments: CheckoutableAppointment[];
}) {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState(staffOptions[0]?.id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "SPLIT">("CASH");
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    total: number;
    subtotal: number;
    tax: number;
    tip: number;
    paymentMethod: string;
  } | null>(null);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const selectedProducts = Object.entries(productQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }));

  const subtotal = useMemo(() => {
    const serviceTotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
    const productTotal = selectedProducts.reduce(
      (sum, { product, qty }) => sum + Number(product.unitPrice) * qty,
      0
    );
    return round2(serviceTotal + productTotal);
  }, [selectedServices, selectedProducts]);

  const tax = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + tax + tip);

  function pickAppointment(appt: CheckoutableAppointment) {
    setAppointmentId(appt.id);
    setStaffId(appt.staffId);
    setServiceIds(appt.services.map((s) => s.service.id));
  }

  function startAdHoc() {
    setAppointmentId(null);
    setServiceIds([]);
    setProductQuantities({});
  }

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function setProductQty(id: string, qty: number) {
    setProductQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const lineItems = [
        ...selectedServices.map((s) => ({ type: "SERVICE" as const, id: s.id })),
        ...selectedProducts.map(({ product, qty }) => ({
          type: "PRODUCT" as const,
          id: product.id,
          quantity: qty,
        })),
      ];
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointmentId ?? undefined,
          staffId,
          lineItems,
          tip,
          taxRate: TAX_RATE,
          paymentMethod,
          ...(paymentMethod === "SPLIT"
            ? { splitCashAmount: splitCash, splitCardAmount: splitCard }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      setReceipt({ total, subtotal, tax, tip, paymentMethod });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function newSale() {
    setReceipt(null);
    setAppointmentId(null);
    setServiceIds([]);
    setProductQuantities({});
    setTip(0);
    setPaymentMethod("CASH");
    setSplitCash(0);
    setSplitCard(0);
  }

  if (receipt) {
    return (
      <Card className="max-w-md p-8">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
          Payment complete
        </span>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="text-navy-950">${receipt.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tax</dt>
            <dd className="text-navy-950">${receipt.tax.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tip</dt>
            <dd className="text-navy-950">${receipt.tip.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-navy-900/10 pt-2 font-serif text-lg font-semibold text-navy-950">
            <dt>Total ({receipt.paymentMethod})</dt>
            <dd>${receipt.total.toFixed(2)}</dd>
          </div>
        </dl>
        <Button onClick={newSale} variant="gold" className="mt-6 px-5 py-2.5 text-sm">
          New sale
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 className="font-serif text-lg font-semibold text-navy-950">Ready to check out</h2>
        {checkoutableAppointments.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No confirmed appointments awaiting checkout today.</p>
        )}
        <ul className="mt-3 space-y-2">
          {checkoutableAppointments.map((appt) => (
            <li key={appt.id}>
              <button
                onClick={() => pickAppointment(appt)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  appointmentId === appt.id
                    ? "border-gold-500 bg-gold-300/10"
                    : "border-navy-900/10 hover:border-navy-900/30"
                }`}
              >
                <p className="font-medium text-navy-950">
                  {new Date(appt.startTime).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  &mdash; {appt.customer.user.name}
                </p>
                <p className="text-slate-500">
                  {appt.services.map((s) => s.service.name).join(", ")} with {appt.staff.user.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
        <TextAction onClick={startAdHoc} className="mt-4">
          Or start an ad-hoc / retail-only sale
        </TextAction>

        <div className="mt-8">
          <Select
            label="Stylist credited"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mt-1 w-auto"
          >
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-lg font-semibold text-navy-950">Services</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {services.map((s) => (
              <Chip key={s.id} active={serviceIds.includes(s.id)} onClick={() => toggleService(s.id)}>
                {s.name} &middot; ${Number(s.price).toFixed(2)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-lg font-semibold text-navy-950">Retail products</h2>
          <ul className="mt-2 space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-navy-950">
                  {p.name} &middot; ${Number(p.unitPrice).toFixed(2)}{" "}
                  <span className="text-slate-500">({p.stockQuantity} in stock)</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={p.stockQuantity}
                  value={productQuantities[p.id] ?? 0}
                  onChange={(e) => setProductQty(p.id, Number(e.target.value))}
                  className="w-16 rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-right text-sm text-navy-950 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Card flat className="h-fit p-6!">
        <h2 className="font-serif text-lg font-semibold text-navy-950">Summary</h2>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="text-navy-950">${subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tax ({(TAX_RATE * 100).toFixed(0)}%)</dt>
            <dd className="text-navy-950">${tax.toFixed(2)}</dd>
          </div>
        </dl>

        <label className="mt-4 flex items-center justify-between text-sm text-navy-950">
          Tip
          <input
            type="number"
            min={0}
            step={0.5}
            value={tip}
            onChange={(e) => setTip(round2(Number(e.target.value)))}
            className="w-24 rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-right outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20"
          />
        </label>

        <div className="mt-4 flex justify-between border-t border-navy-900/10 pt-3 font-serif text-lg font-semibold text-navy-950">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-navy-950">Payment method</p>
          <div className="mt-2 flex gap-2">
            {(["CASH", "CARD", "SPLIT"] as const).map((m) => (
              <Chip key={m} active={paymentMethod === m} onClick={() => setPaymentMethod(m)}>
                {m}
              </Chip>
            ))}
          </div>
          {paymentMethod === "SPLIT" && (
            <div className="mt-3 flex gap-3">
              <Input
                label="Cash"
                type="number"
                min={0}
                value={splitCash}
                onChange={(e) => setSplitCash(round2(Number(e.target.value)))}
                className="w-24"
              />
              <Input
                label="Card"
                type="number"
                min={0}
                value={splitCard}
                onChange={(e) => setSplitCard(round2(Number(e.target.value)))}
                className="w-24"
              />
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleCheckout}
          variant="gold"
          disabled={submitting || (serviceIds.length === 0 && selectedProducts.length === 0)}
          className="mt-6 w-full justify-center px-5 py-3 text-sm disabled:opacity-50"
        >
          {submitting ? "Processing…" : `Charge $${total.toFixed(2)}`}
        </Button>
      </Card>
    </div>
  );
}
