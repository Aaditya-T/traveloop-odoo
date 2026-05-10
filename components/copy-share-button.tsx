"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

type Props = { url: string };

export function CopyShareButton({ url }: Props) {
  return (
    <button
      className="flex w-full items-start gap-2 border-2 border-ink bg-white p-3 text-left text-xs font-bold text-ink/80 transition hover:bg-paper"
      style={{ borderRadius: 8 }}
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Share link copied");
        } catch {
          toast.error("Could not copy — try selecting the link manually.");
        }
      }}
    >
      <Copy className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="break-all">{url}</span>
    </button>
  );
}
