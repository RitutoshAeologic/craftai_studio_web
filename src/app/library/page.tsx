'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
  ExternalLink,
  Coins,
  ChevronRight,
  ShieldCheck,
  X,
  Layers,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { fetchGenerations, deleteGeneration, unlockGenerationDownload, fetchWallet, type Generation, type Wallet } from "@/lib/supabase/db";
import { useUser } from "@/context/UserContext";

const S = {
  bg:          "#0b0b0f",
  card:        "#121218",
  cardBorder:  "#1e1e2a",
  borderLight: "#2e2e3e",
  cyan:        "#00d4ff",
  primary:     "#6366f1",
  primaryDark: "#4f46e5",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted:   "#64748b",
  success:     "#10b981",
  warning:     "#f59e0b",
};

export default function LibraryPage() {
  const router = useRouter();
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedJob, setSelectedJob] = useState<Generation | null>(null);
  const [paywallModalJob, setPaywallModalJob] = useState<Generation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unlocked" | "cloud">("all");

  const loadData = async () => {
    const [gens, w] = await Promise.all([
      fetchGenerations(userKey),
      fetchWallet(userKey),
    ]);
    setGenerations(gens);
    setWallet(w);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("craftai_generations_updated", loadData);
    window.addEventListener("craftai_wallet_updated", loadData);
    return () => {
      window.removeEventListener("craftai_generations_updated", loadData);
      window.removeEventListener("craftai_wallet_updated", loadData);
    };
  }, [userKey]);

  // Handle Download Logic (Rule 1: Download Paywall Gate)
  const handleDownloadClick = async (job: Generation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (job.is_download_unlocked) {
      // Idempotent re-download is 100% free!
      triggerLosslessDownload(job.image_url, `craftai-${job.id}-4k.png`);
    } else {
      // Open Paywall Modal
      setPaywallModalJob(job);
    }
  };

  const handleConfirmPaywallUnlock = async () => {
    if (!paywallModalJob) return;
    setUnlocking(true);
    try {
      const res = await unlockGenerationDownload(paywallModalJob.id, userKey);
      if (res.success) {
        // Trigger lossless download
        triggerLosslessDownload(paywallModalJob.image_url, `craftai-${paywallModalJob.id}-4k.png`);
        setPaywallModalJob(null);
        await loadData();
      } else {
        alert("Insufficient credits! Please top up your wallet.");
        router.push("/wallet");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const triggerLosslessDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = generations.filter((g) => {
    if (filterTab === "unlocked" && !g.is_download_unlocked) return false;
    if (filterTab === "cloud" && g.is_download_unlocked) return false;
    if (searchQuery) {
      return g.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100%", background: S.bg, display: "flex", flexDirection: "column" }}>
      {/* ── Top Header ───────────────────────────────────────── */}
      <div
        style={{
          padding: "18px clamp(14px, 3vw, 28px)",
          borderBottom: `1px solid ${S.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: S.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={20} style={{ color: S.cyan }} />
            Cloud Library
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: S.textSecondary }}>
            All your studio creations, cloud storage &amp; lossless 4K export downloads.
          </p>
        </div>

        {/* Right Info: Wallet balance indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/wallet"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "9999px",
              background: "rgba(0, 212, 255, 0.08)",
              border: "1px solid rgba(0, 212, 255, 0.25)",
              color: S.cyan,
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Coins size={14} />
            <span>{wallet?.credits ?? 100} Credits</span>
          </Link>

          <Link
            href="/studio"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: S.primary,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Sparkles size={14} />
            Create New
          </Link>
        </div>
      </div>

      {/* ── Subheader Filters & Search ────────────────────────── */}
      <div
        style={{
          padding: "12px clamp(14px, 3vw, 28px)",
          borderBottom: `1px solid ${S.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "unlocked", "cloud"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                border: filterTab === tab ? "none" : `1px solid ${S.borderLight}`,
                background: filterTab === tab ? S.primary : S.card,
                color: filterTab === tab ? "#ffffff" : S.textSecondary,
                fontSize: "12px",
                fontWeight: filterTab === tab ? 700 : 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab === "all" ? `All Creations (${generations.length})` : tab === "unlocked" ? "Unlocked 4K" : "Cloud Saved (Free)"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "220px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: S.textMuted }} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creations..."
            style={{
              width: "100%",
              padding: "7px 12px 7px 34px",
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "9999px",
              color: S.textPrimary,
              fontSize: "12px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Grid of User Creations ───────────────────────────── */}
      <div style={{ flex: 1, padding: "clamp(14px, 3vw, 28px)" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Layers size={40} style={{ color: S.textMuted }} />
            <h3 style={{ margin: 0, fontSize: "16px", color: S.textPrimary }}>No creations found</h3>
            <p style={{ margin: 0, fontSize: "13px", color: S.textSecondary, maxWidth: "380px" }}>
              Generate stunning diffusion images in Prompt Master Studio, and they will appear here saved in your cloud library.
            </p>
            <Link
              href="/studio"
              style={{
                marginTop: "10px",
                padding: "8px 18px",
                borderRadius: "8px",
                background: S.primary,
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Start Generating
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/library/${item.id}`)}
                style={{
                  background: S.card,
                  border: `1px solid ${S.cardBorder}`,
                  borderRadius: "14px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = S.cyan;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = S.cardBorder;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Image Preview Container */}
                <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#08080c" }}>
                  <img
                    src={item.image_url}
                    alt={item.prompt}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* Status Pill Badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.75)",
                      backdropFilter: "blur(6px)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: item.is_download_unlocked ? S.success : S.cyan,
                      border: `1px solid ${item.is_download_unlocked ? "rgba(16,185,129,0.4)" : "rgba(0,212,255,0.4)"}`,
                    }}
                  >
                    {item.is_download_unlocked ? "Unlocked (4K Ready)" : "Cloud Saved (Free)"}
                  </div>
                </div>

                {/* Info & Prompt */}
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: S.textPrimary,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={item.prompt}
                    >
                      {item.prompt}
                    </p>
                    <span style={{ fontSize: "10px", color: S.textMuted, marginTop: "4px", display: "block" }}>
                      {new Date(item.created_at).toLocaleDateString()} · {item.model || "FLUX.1 Schnell"}
                    </span>
                  </div>

                  {/* Action Button: Re-Download (Free) or Download 4K (2 Cr) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={(e) => handleDownloadClick(item, e)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px",
                        borderRadius: "8px",
                        background: item.is_download_unlocked ? "rgba(16, 185, 129, 0.15)" : S.primary,
                        border: item.is_download_unlocked ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
                        color: item.is_download_unlocked ? S.success : "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={13} />
                      <span>{item.is_download_unlocked ? "Re-Download (Free $0.00)" : "Download 4K (2 Cr)"}</span>
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteGeneration(item.id, userKey);
                      }}
                      title="Delete from Library"
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${S.borderLight}`,
                        color: S.textMuted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = S.textMuted)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ DOWNLOAD PAYWALL GATE MODAL (Rule 1) ═══════════════ */}
      {paywallModalJob && (
        <div
          onClick={() => setPaywallModalJob(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "16px",
              width: "min(440px, 94vw)",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={20} style={{ color: S.cyan }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.textPrimary }}>
                  Download 4K Master Export
                </h3>
              </div>
              <button
                onClick={() => setPaywallModalJob(null)}
                style={{ background: "transparent", border: "none", color: S.textSecondary, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ borderRadius: "10px", overflow: "hidden", maxHeight: "160px", background: "#000" }}>
              <img
                src={paywallModalJob.image_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "12px",
                color: "#c7d2fe",
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#ffffff" }}>
                ✨ 2 Credits ($0.20) Master Export Fee
              </p>
              Unlock lossless 4K resolution master render. Once unlocked, all future re-downloads of this masterpiece are <strong>100% Free &amp; Idempotent</strong> forever.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: S.textSecondary }}>
              <span>Your Current Balance:</span>
              <span style={{ color: S.cyan, fontWeight: 700 }}>{wallet?.credits ?? 0} Credits</span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setPaywallModalJob(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: `1px solid ${S.borderLight}`,
                  color: S.textSecondary,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPaywallUnlock}
                disabled={unlocking}
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: "8px",
                  background: S.primary,
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: unlocking ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                }}
              >
                <Download size={14} />
                <span>{unlocking ? "Unlocking 4K..." : "Confirm & Unlock (2 Credits)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
