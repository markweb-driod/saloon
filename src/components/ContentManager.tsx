"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type ContentRecord = {
  key: string;
  label: string;
  value: string;
};

export default function ContentManager({ content }: { content: ContentRecord[] }) {
  return (
    <div className="mt-6 space-y-4">
      {content.map((c) => (
        <ContentField key={c.key} field={c} />
      ))}
    </div>
  );
}

function ContentField({ field }: { field: ContentRecord }) {
  const [value, setValue] = useState(field.value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = value !== field.value;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/content/${field.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card flat className="p-5!">
      <Textarea
        label={field.label}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        rows={field.value.length > 120 ? 4 : 2}
      />
      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="gold"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 text-xs disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-xs font-medium text-emerald-600">Saved</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </Card>
  );
}
