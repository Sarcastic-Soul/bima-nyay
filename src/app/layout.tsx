import type { Metadata, Viewport } from "next";
import { Mukta, Newsreader } from "next/font/google";
import "./globals.css";

const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "600"] });
const sans = Mukta({ variable: "--font-sans", subsets: ["latin", "devanagari"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Bima Nyay — check a rejected health insurance claim",
  description:
    "Photograph a rejected health insurance claim letter. Bima Nyay checks it against IRDAI rules, shows how similar Insurance Ombudsman cases ended, and drafts your grievance and Ombudsman complaint in Hindi and English. Free and open source.",
};

export const viewport: Viewport = { themeColor: "#F4EFE4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
