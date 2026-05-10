"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "border-2 border-ink bg-white font-bold text-ink shadow-sketch",
          title: "font-black",
          description: "font-semibold text-ink/80"
        }
      }}
    />
  );
}
