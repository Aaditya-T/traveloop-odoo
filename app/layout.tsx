import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Traveloop",
  description: "Personalized multi-city travel planning made playful."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
