"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import TextAction from "@/components/ui/TextAction";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "STYLIST" | "RECEPTIONIST" | "ADMIN";
  createdAt: string;
};

const ROLE_STYLES: Record<UserRecord["role"], string> = {
  CUSTOMER: "bg-navy-900/10 text-navy-700",
  STYLIST: "bg-gold-300/40 text-gold-600",
  RECEPTIONIST: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-amber-100 text-amber-700",
};

export default function UsersManager({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ id: string; password: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, [q, role]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleResetPassword(id: string) {
    setResetFor(id);
    setTempPassword(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTempPassword({ id, password: data.tempPassword });
      }
    } finally {
      setResetFor(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="w-64"
        />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="STYLIST">Stylist</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">Searching&hellip;</p>}

      <ul className="mt-6 space-y-3">
        {users.map((u) => (
          <Card key={u.id} as="li" flat className="p-4!">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-navy-950">{u.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${ROLE_STYLES[u.role]}`}
                  >
                    {u.role}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""} · joined{" "}
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
                {tempPassword?.id === u.id && (
                  <p className="mt-2 rounded-lg bg-gold-300/20 px-3 py-2 text-sm text-navy-950">
                    New temporary password:{" "}
                    <span className="font-mono font-semibold">{tempPassword.password}</span>
                  </p>
                )}
              </div>
              <TextAction
                onClick={() => handleResetPassword(u.id)}
                disabled={resetFor === u.id}
              >
                {resetFor === u.id ? "Resetting…" : "Reset password"}
              </TextAction>
            </div>
          </Card>
        ))}
        {!loading && users.length === 0 && (
          <p className="text-sm text-slate-500">No users match this search.</p>
        )}
      </ul>
    </div>
  );
}
