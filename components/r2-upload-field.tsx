"use client";

import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type R2UploadFieldScope = "profile-avatar" | "trip-cover" | "receipt" | "catalog-image";

type Props = {
  name: string;
  label: string;
  /** Server-computed flag from `isR2Configured()`. When false, only manual URL entry is shown (current behavior). */
  uploadsEnabled: boolean;
  scope: R2UploadFieldScope;
  defaultValue?: string | null;
  /** File input accept attribute when uploads enabled */
  accept?: string;
};

export function R2UploadField({ name, label, uploadsEnabled, scope, defaultValue, accept }: Props) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [showUrl, setShowUrl] = useState(!uploadsEnabled);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  useLayoutEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.value = value;
    }
  }, [value]);

  const presetAccept = uploadsEnabled ? (accept ?? (scope === "receipt" ? "image/jpeg,image/png,image/webp,image/gif,application/pdf" : "image/jpeg,image/png,image/webp,image/gif")) : "";

  async function onPickFile(file: File | null) {
    if (!file || !uploadsEnabled) return;
    setBusy(true);
    try {
      const res = await fetch("/api/uploads/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          contentType: file.type
        })
      });
      const data = (await res.json()) as { error?: string; uploadUrl?: string; publicUrl?: string };

      if (!res.ok || !data.uploadUrl || !data.publicUrl) {
        throw new Error(data.error ?? "Could not prepare upload");
      }

      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!put.ok) {
        throw new Error("Upload to storage failed. Check R2 bucket CORS and credentials.");
      }

      setValue(data.publicUrl);
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="grid gap-2">
      <span className="label">{label}</span>
      <input ref={hiddenRef} name={name} type="hidden" />

      {value && (scope !== "receipt" || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(value)) ? (
        <div className="relative h-24 w-full max-w-xs overflow-hidden border-2 border-ink bg-ink/5" style={{ borderRadius: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full w-full object-cover" src={value} />
        </div>
      ) : value && scope === "receipt" ? (
        <p className="text-xs font-bold text-ink/60">
          Linked file:{" "}
          <a className="text-coral underline" href={value} rel="noreferrer" target="_blank">
            Open
          </a>
        </p>
      ) : null}

      {uploadsEnabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            accept={presetAccept}
            className="sr-only"
            disabled={busy}
            type="file"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn-secondary gap-2"
            disabled={busy}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? "Uploading…" : "Choose file"}
          </button>
          {value ? (
            <button
              aria-label="Remove"
              className="btn-ghost text-coral"
              type="button"
              onClick={() => setValue("")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
          <button className="btn-ghost gap-2 text-xs" type="button" onClick={() => setShowUrl((s) => !s)}>
            <Link2 className="h-4 w-4" />
            {showUrl ? "Hide URL" : "Paste URL"}
          </button>
        </div>
      ) : (
        <p className="text-xs font-bold text-ink/55">Paste an image URL, or configure R2 in the server environment to upload files directly.</p>
      )}

      {(!uploadsEnabled || showUrl) ? (
        <input
          className="input"
          placeholder={uploadsEnabled ? "https://…" : "https://…"}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : null}
    </div>
  );
}
