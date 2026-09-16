'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Download,
  Copy,
  MoreVertical,
  Edit3,
  Scissors,
  Repeat,
  Film,
  Sparkles,
  Check,
  ShieldCheck,
  X,
  Globe,
  Maximize2,
} from "lucide-react";
import {
  fetchGenerationById,
  unlockGenerationDownload,
  publishArtwork,
  fetchWallet,
  type Generation,
  type Wallet,
} from "@/lib/supabase/db";
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
  purple:      "#a855f7",
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";

  const [job, setJob] = useState<Generation | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      fetchGenerationById(jobId, userKey),
      fetchWallet(userKey),
    ]).then(([foundJob, w]) => {
      setJob(foundJob);
      setWallet(w);
      setLoading(false);
    });
  }, [jobId, userKey]);

  const handleDownloadClick = async () => {
    if (!job) return;
    if (job.is_download_unlocked) {
      triggerLosslessDownload(job.image_url, `craftai-${job.id}-4k.png`);
    } else {
      setPaywallOpen(true);
    }
  };

  const handleConfirmPaywall = async () => {
    if (!job) return;
    setUnlocking(true);
    try {
      const res = await unlockGenerationDownload(job.id, userKey);
      if (res.success) {
        setJob((prev) => (prev ? { ...prev, is_download_unlocked: true } : null));
        triggerLosslessDownload(job.image_url, `craftai-${job.id}-4k.png`);
        setPaywallOpen(false);
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

  const handlePublish = async () => {
    if (!job) return;
    await publishArtwork({
      prompt: job.prompt,
      image_url: job.image_url,
      model: job.model,
      aspect_ratio: job.aspect_ratio,
      author_name: profile.name,
      author_handle: profile.handle,
      author_avatar: profile.initials,
    });
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
  };

  const handleCopy = () => {
    if (!job) return;
    navigator.clipboard.writeText(job.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: S.textSecondary, textAlign: "center" }}>
        Loading creation detail...
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: S.textPrimary }}>Creation not found</h2>
        <Link href="/library" style={{ color: S.cyan }}>
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: S.bg, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${S.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: S.bg,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => router.push("/library")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "transparent",
            border: "none",
            color: S.textSecondary,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = S.textSecondary)}
        >
          <ArrowLeft size={16} />
          <span>Library</span>
        </button>

        {/* Right Publish Button */}
        <button
          onClick={handlePublish}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 16px",
            borderRadius: "9999px",
            background: publishSuccess ? "rgba(16, 185, 129, 0.2)" : S.primary,
            border: publishSuccess ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
            color: publishSuccess ? S.success : "#ffffff",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.3)",
          }}
        >
          {publishSuccess ? <Check size={14} /> : <Globe size={14} />}
          <span>{publishSuccess ? "Published to Explore!" : "+ Publish (Earn Royalties)"}</span>
        </button>
      </div>

      {/* ── Main Detail Viewport ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px clamp(12px, 3vw, 32px) 100px", // space for bottom pill
          maxWidth: "880px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Hero Image Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "18px",
            overflow: "hidden",
            background: "#08080c",
            border: `1px solid ${S.cardBorder}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            marginBottom: "16px",
          }}
        >
          <img
            src={job.image_url}
            alt={job.prompt}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "68vh",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Status Badge */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              fontSize: "11px",
              fontWeight: 700,
              color: job.is_download_unlocked ? S.success : S.cyan,
              border: `1px solid ${job.is_download_unlocked ? "rgba(16,185,129,0.3)" : "rgba(0,212,255,0.3)"}`,
            }}
          >
            {job.is_download_unlocked ? "Unlocked 4K Master" : "Cloud Saved (Free)"}
          </div>
        </div>

        {/* Action Row */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0 16px",
            borderBottom: `1px solid ${S.cardBorder}`,
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setLiked(!liked)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9999px",
                background: liked ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${liked ? "rgba(239,68,68,0.4)" : S.borderLight}`,
                color: liked ? "#ef4444" : S.textSecondary,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Heart size={14} style={{ fill: liked ? "#ef4444" : "none" }} />
              <span>{12 + (liked ? 1 : 0)}</span>
            </button>

            <button
              onClick={handleDownloadClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9999px",
                background: job.is_download_unlocked ? "rgba(16, 185, 129, 0.15)" : S.primary,
                border: job.is_download_unlocked ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
                color: job.is_download_unlocked ? S.success : "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Download size={14} />
              <span>{job.is_download_unlocked ? "Re-Download (Free)" : "Download 4K (2 Cr)"}</span>
            </button>

            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${S.borderLight}`,
                color: S.textSecondary,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={14} style={{ color: S.success }} /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <div style={{ fontSize: "11px", color: S.textMuted }}>
            {job.model || "FLUX.1 Schnell"} · {job.aspect_ratio || "1:1"}
          </div>
        </div>

        {/* Creator Attribution */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {profile.initials}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: S.textPrimary }}>
              {profile.name}
            </div>
            <div style={{ fontSize: "11px", color: S.textSecondary }}>
              @{profile.handle} · {new Date(job.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Prompt Description */}
        <div
          style={{
            width: "100%",
            background: S.card,
            border: `1px solid ${S.cardBorder}`,
            borderRadius: "12px",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase", marginBottom: "6px" }}>
            Clean User Prompt
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#e2e8f0",
              lineHeight: 1.6,
              display: showFullPrompt ? "block" : "-webkit-box",
              WebkitLineClamp: showFullPrompt ? "unset" : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.prompt}
          </p>
          {job.prompt.length > 140 && (
            <button
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              style={{
                marginTop: "8px",
                background: "transparent",
                border: "none",
                color: S.cyan,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {showFullPrompt ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      </div>

      {/* ══ FLOATING BOTTOM ACTION PILL: ✏️ Edit image ═════════ */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        <button
          id="btn-edit-image-pill"
          onClick={() => setEditSheetOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)",
            border: "none",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0, 212, 255, 0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <Edit3 size={16} />
          <span>✏️ Edit image</span>
        </button>
      </div>

      {/* ══ EDIT ACTIONS SHEET (MeiGen 5-Action Modal) ═════════ */}
      {editSheetOpen && (
        <div
          onClick={() => setEditSheetOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              width: "min(500px, 100vw)",
              padding: "20px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: S.textSecondary, marginBottom: "8px" }}>
              Creative Edit Options
            </div>

            {/* 1. ✨ Describe edits */}
            <button
              onClick={() => {
                setEditSheetOpen(false);
                router.push(
                  `/studio?imageUrl=${encodeURIComponent(job.image_url)}&prompt=${encodeURIComponent("Edit image1 as follows: ")}&aiEdit=true`
                );
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Sparkles size={18} style={{ color: S.cyan }} />
              <div>
                <div style={{ fontWeight: 700 }}>✨ Describe edits</div>
                <div style={{ fontSize: "11px", color: S.textSecondary }}>
                  Loads image into slot image1 with &quot;Edit image1 as follows:&quot;
                </div>
              </div>
            </button>

            {/* 2. ✂️ Remove Background */}
            <button
              onClick={() => {
                setEditSheetOpen(false);
                router.push(`/tools?image=${encodeURIComponent(job.image_url)}&action=cutout`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${S.borderLight}`,
                color: S.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Scissors size={18} style={{ color: S.purple }} />
              <div>
                <div style={{ fontWeight: 700 }}>✂️ Remove Background</div>
                <div style={{ fontSize: "11px", color: S.textSecondary }}>
                  Instant zero-token transparent PNG cutout
                </div>
              </div>
            </button>

            {/* 3. 🔄 Use prompt */}
            <button
              onClick={() => {
                setEditSheetOpen(false);
                router.push(`/studio?prompt=${encodeURIComponent(job.prompt)}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${S.borderLight}`,
                color: S.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Repeat size={18} style={{ color: S.cyan }} />
              <div>
                <div style={{ fontWeight: 700 }}>🔄 Use prompt</div>
                <div style={{ fontSize: "11px", color: S.textSecondary }}>
                  Load raw text prompt into studio textarea
                </div>
              </div>
            </button>

            {/* 4. 🎬 Make Video */}
            <button
              onClick={() => {
                setEditSheetOpen(false);
                alert("🎬 Image-to-Video synthesis is available in the Creative Skills Toolbox!");
                router.push(`/tools?image=${encodeURIComponent(job.image_url)}&action=video`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${S.borderLight}`,
                color: S.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Film size={18} style={{ color: "#f59e0b" }} />
              <div>
                <div style={{ fontWeight: 700 }}>🎬 Make Video</div>
                <div style={{ fontSize: "11px", color: S.textSecondary }}>
                  Animate image with camera motion and video diffusion
                </div>
              </div>
            </button>

            {/* 5. 4K+ Upscale 4K */}
            <button
              onClick={() => {
                setEditSheetOpen(false);
                setPaywallOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: S.success,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Maximize2 size={18} />
              <div>
                <div style={{ fontWeight: 700 }}>4K+ Upscale 4K</div>
                <div style={{ fontSize: "11px", color: S.textSecondary }}>
                  Super-resolution master lossless export
                </div>
              </div>
            </button>

            {/* Cancel */}
            <button
              onClick={() => setEditSheetOpen(false)}
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "10px",
                background: "transparent",
                border: `1px solid ${S.borderLight}`,
                color: S.textSecondary,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══ 4K PAYWALL MODAL ═══════════════════════════════════ */}
      {paywallOpen && (
        <div
          onClick={() => setPaywallOpen(false)}
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
                onClick={() => setPaywallOpen(false)}
                style={{ background: "transparent", border: "none", color: S.textSecondary, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
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
                onClick={() => setPaywallOpen(false)}
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
                onClick={handleConfirmPaywall}
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
