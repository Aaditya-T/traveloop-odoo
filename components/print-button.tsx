"use client";

import { FileDown } from "lucide-react";

export function PrintButton() {
  return (
    <button className="btn-secondary self-end justify-self-start print:hidden" onClick={() => window.print()} type="button">
      <FileDown className="h-4 w-4" />
      Print or save PDF
    </button>
  );
}
