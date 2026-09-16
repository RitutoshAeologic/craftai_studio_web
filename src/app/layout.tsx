import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CraftAI Studio — AI Image Generation & Remix Marketplace",
  description:
    "Generate, remix, and publish stunning AI artwork for free. Powered by FLUX.1, SDXL, and Gemini AI. Zero subscriptions, 100% free.",
  keywords: [
    "AI image generation",
    "FLUX.1",
    "SDXL",
    "AI art",
    "remix",
    "free AI tools",
    "CraftAI Studio",
  ],
  openGraph: {
    title: "CraftAI Studio — AI Image Generation & Remix Marketplace",
    description: "Generate, remix, and publish stunning AI artwork for free.",
    type: "website",
  },
};

import AppShell from "@/components/layout/AppShell";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#0a0e18]"
        style={{ fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)", margin: 0, padding: 0 }}
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
