"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

type MessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
};

const STATUS_STYLES: Record<MessageRecord["status"], string> = {
  NEW: "bg-gold-300/40 text-gold-600",
  READ: "bg-navy-900/10 text-navy-700",
  REPLIED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

export default function ContactInbox({ messages }: { messages: MessageRecord[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function updateStatus(id: string, status: MessageRecord["status"]) {
    await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function expand(msg: MessageRecord) {
    setExpandedId(expandedId === msg.id ? null : msg.id);
    if (msg.status === "NEW") {
      updateStatus(msg.id, "READ");
    }
  }

  if (messages.length === 0) {
    return <p className="mt-6 text-sm text-slate-500">No messages yet.</p>;
  }

  return (
    <ul className="mt-6 space-y-3">
      {messages.map((m) => (
        <Card key={m.id} as="li" flat className="p-4!">
          <button type="button" onClick={() => expand(m)} className="w-full text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-navy-950">{m.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_STYLES[m.status]}`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {m.email}
                  {m.phone ? ` · ${m.phone}` : ""}
                  {m.subject ? ` · ${m.subject}` : ""}
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
          </button>

          {expandedId === m.id && (
            <div className="mt-4 border-t border-navy-900/10 pt-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{m.message}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-medium text-navy-950">Status</span>
                <Select
                  value={m.status}
                  onChange={(e) => updateStatus(m.id, e.target.value as MessageRecord["status"])}
                  className="w-auto"
                >
                  <option value="NEW">New</option>
                  <option value="READ">Read</option>
                  <option value="REPLIED">Replied</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
                <a
                  href={`mailto:${m.email}`}
                  className="text-sm font-medium text-gold-600 underline underline-offset-2 hover:text-gold-500"
                >
                  Reply by email
                </a>
              </div>
            </div>
          )}
        </Card>
      ))}
    </ul>
  );
}
