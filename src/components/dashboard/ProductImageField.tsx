"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

export default function ProductImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewErrored, setPreviewErrored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setPreviewErrored(false);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-navy-950">Product image</p>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-900/10 bg-navy-900/5">
          {value && !previewErrored ? (
            // eslint-disable-next-line @next/next/no-img-element -- locally uploaded / arbitrary hotlinked preview, not a static asset
            <img
              src={value}
              alt="Product preview"
              className="h-full w-full object-cover"
              onError={() => setPreviewErrored(true)}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-slate-400">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="M20.5 15.5l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="block w-full max-w-xs text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900/5 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy-950 hover:file:bg-navy-900/10"
            />
            {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
          </div>
          <Input
            type="url"
            placeholder="…or paste an image URL"
            value={value}
            onChange={(e) => {
              setPreviewErrored(false);
              onChange(e.target.value);
            }}
            className="max-w-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
