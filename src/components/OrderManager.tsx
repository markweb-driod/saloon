"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { TableShell, Thead, Th, Tbody, Td, EmptyRow } from "@/components/dashboard/DataTable";
import Pagination from "@/components/dashboard/Pagination";

type OrderSummary = {
  id: string;
  status: string;
  total: string;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  items: { productName: string; quantity: number; lineTotal: string }[];
};

const STATUS_OPTIONS = ["PENDING", "PAID", "FULFILLED", "CANCELLED"] as const;
const FILTER_TABS = ["ALL", ...STATUS_OPTIONS] as const;
const PAGE_SIZE = 8;

export default function OrderManager({ orders }: { orders: OrderSummary[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleStatusChange(order: OrderSummary, status: string) {
    if (status === order.status) return;
    setUpdatingId(order.id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update order");
        return;
      }
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setFilter(tab);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              filter === tab
                ? "bg-navy-950 text-gold-400"
                : "bg-navy-900/5 text-slate-500 hover:bg-navy-900/10"
            }`}
          >
            {tab === "ALL" ? "All" : tab}
            {tab !== "ALL" && (
              <span className="ml-1 opacity-60">
                ({orders.filter((o) => o.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <TableShell>
          <Thead>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Placed</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th className="text-right">Update</Th>
          </Thead>
          <Tbody>
            {paged.length === 0 && <EmptyRow colSpan={6}>No orders match this filter.</EmptyRow>}
            {paged.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <Fragment key={order.id}>
                  <tr
                    className="cursor-pointer hover:bg-navy-900/5"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <Td className="font-medium text-navy-950">
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        #{order.id.slice(-8)}
                      </span>
                    </Td>
                    <Td>
                      <p className="text-navy-950">{order.customerName}</p>
                      <p className="text-xs text-slate-400">{order.customerEmail}</p>
                    </Td>
                    <Td className="text-slate-600">{order.placedAt}</Td>
                    <Td className="font-medium text-navy-950">${Number(order.total).toFixed(2)}</Td>
                    <Td>
                      <Badge status={order.status} />
                    </Td>
                    <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        disabled={updatingId === order.id}
                        className="ml-auto w-36"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </Td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-cream-100/60 px-4 py-3">
                        <ul className="space-y-1 text-sm text-slate-600">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex items-center justify-between">
                              <span>
                                {item.productName} &times; {item.quantity}
                              </span>
                              <span>${Number(item.lineTotal).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </Tbody>
        </TableShell>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
