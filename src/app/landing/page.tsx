'use client'

import Link from "next/link";
import { Sparkles, Play, ArrowRight, Zap, Shuffle, ShieldCheck, Globe } from "lucide-react";

const S = {
  bg: "#0d1117",
  panelBorder: "#1e2533",
  card: "#161d2b",
  cardBorder: "#1e2b3a",
  cyan: "#00d4ff",
  textPrimary: "#e5e7eb",
  textSecondary: "#6b7280",
};

const STATS = [
  { value: "100%", label: "Free — Forever" },
  { value: "3", label: "AI Models" },
  { value: "∞", label: "Generations" },
  { value: "0", label: "API Keys Needed" },
];

const FEATURES = [
  { icon: Zap, title: "Instant Generation", desc: "FLUX.1 Schnell, SDXL Turbo & Stable Diffusion XL — all free, no API key required.", color: "#00d4ff" },
  { icon: Shuffle, title: "One-Tap Remix", desc: "Discover community artwork and remix anything with a single prompt modification.", color: "#818cf8" },
  { icon: ShieldCheck, title: "Prompt Intelligence", desc: "Auto-enhance your ideas with Gemini 1.5 Flash for studio-quality outputs.", color: "#10b981" },
  { icon: Globe, title: "Public Gallery", desc: "Publish your best work to the community showcase and get discovered worldwide.", color: "#f59e0b" },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: S.bg }}>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "400px", pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)",
        }} />

        <div style={{
          maxWidth: "900px", margin: "0 auto", padding: "72px 24px 40px",
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "9999px", marginBottom: "32px",
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}>
            <Sparkles size={13} style={{ color: S.cyan }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: S.cyan }}>
              100% Free · No API Keys · Unlimited Generations
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 900, letterSpacing: "-0.03em",
            color: S.textPrimary, lineHeight: 1.1,
            marginBottom: "24px",
            fontFamily: "var(--font-outfit, Outfit, sans-serif)",
          }}>
            Create &amp; Remix<br />
            <span style={{ color: S.cyan }}>AI Artwork</span> for Free
          </h1>

          <p style={{
            fontSize: "17px", color: S.textSecondary, lineHeight: 1.7,
            maxWidth: "560px", margin: "0 auto 40px",
          }}>
            Generate stunning images with FLUX.1, SDXL &amp; Turbo. Remix community
            creations. Publish to the gallery. All powered by free AI — zero subscriptions,
            zero credit cards.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "60px" }}>
            <Link
              href="/studio"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 28px", borderRadius: "10px",
                background: S.cyan, color: "#000",
                fontSize: "15px", fontWeight: 700, textDecoration: "none",
                boxShadow: `0 0 24px ${S.cyan}55`,
              }}
            >
              <Sparkles size={16} />
              Open Studio — It&apos;s Free
            </Link>

            <Link
              href="/explore"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 28px", borderRadius: "10px",
                background: "transparent", color: S.textPrimary,
                fontSize: "15px", fontWeight: 600, textDecoration: "none",
                border: `1px solid ${S.panelBorder}`,
              }}
            >
              <Play size={15} />
              Explore Gallery
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px", maxWidth: "600px", margin: "0 auto",
          }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: "28px", fontWeight: 800, color: S.cyan, margin: "0 0 4px", fontFamily: "var(--font-outfit, Outfit, sans-serif)" }}>
                  {s.value}
                </p>
                <p style={{ fontSize: "12px", color: S.textSecondary, margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
