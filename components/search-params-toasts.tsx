"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const TOASTS: Record<string, { kind: "success" | "error"; message: string }> = {
  published: { kind: "success", message: "Trip is now shareable." },
  private: { kind: "success", message: "Trip is now private." },
  copied: { kind: "success", message: "Trip copied to your account." }
};

export function SearchParamsToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastMarker = useRef<string>("");

  useEffect(() => {
    const qs = searchParams.toString();
    if (!qs) {
      lastMarker.current = "";
      return;
    }

    const hasToast = qs.includes("toast=");
    const hasPassword = qs.includes("password=");
    const hasDelete = qs.includes("delete=");
    if (!hasToast && !hasPassword && !hasDelete) return;

    const marker = `${pathname}?${qs}`;
    if (lastMarker.current === marker) return;
    lastMarker.current = marker;

    const toastId = searchParams.get("toast");
    if (toastId && TOASTS[toastId]) {
      const t = TOASTS[toastId];
      if (t.kind === "success") toast.success(t.message);
      else toast.error(t.message);
    }

    const password = searchParams.get("password");
    if (password === "invalid") {
      toast.error("Check your current password and use at least 8 characters for the new one.");
    } else if (password === "updated") {
      toast.success("Password updated.");
    }

    if (searchParams.get("delete")) {
      toast.error("Type your email exactly to confirm account deletion.");
    }

    const next = new URLSearchParams(qs);
    next.delete("toast");
    next.delete("password");
    next.delete("delete");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
