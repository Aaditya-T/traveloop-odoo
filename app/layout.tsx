import type { Metadata } from "next";
import { AppToaster } from "@/components/app-toaster";
import { SearchParamsToastsBoundary } from "@/components/search-params-toasts-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Traveloop",
  description: "Personalized multi-city travel planning made playful."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AppToaster />
        <SearchParamsToastsBoundary />
      </body>
    </html>
  );
}
