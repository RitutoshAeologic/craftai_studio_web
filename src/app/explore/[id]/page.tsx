'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Wand2,
  Lock,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Share2,
  Layers,
  ChevronRight,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import { fetchArtworkById, fetchArtworks, savePrivateArtwork, removePrivateArtwork, isArtworkBookmarked, type Artwork } from "@/lib/supabase/db";
import { theme } from "@/lib/theme/themeGuard";
import { BACKEND_URL } from "@/lib/api/backend-client";

const S = theme.colors;

export default function ExploreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const artworkId = params?.id as string;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [similarArtworks, setSimilarArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!artworkId) return;

    let isMounted = true;
    setLoading(true);

    async function loadData() {
      try {
        const found = await fetchArtworkById(artworkId);
        if (!isMounted) return;

        if (found) {
          setArtwork(found);
          setIsBookmarked(isArtworkBookmarked(found.id));

          // Fetch similar artworks via backend with fallback to same category in DB
          try {
            const res = await fetch(`${BACKEND_URL}/api/v1/search/explore/similar/${encodeURIComponent(artworkId)}?limit=8`);
            if (res.ok) {
              const similarData = await res.json();
              if (Array.isArray(similarData) && similarData.length > 0) {
                const formatted: Artwork[] = similarData.map((item: any) => ({
                  id: item.id,
                  title: item.title,
                  prompt: item.title,
                  masked_summary: `${item.category} • Masterpiece • [Secret Recipe Encrypted]`,
                  image_url: item.preview_url || item.preview_image_url || "/placeholder.png",
                  model: item.model_used || "FLUX.1 Schnell",
                  category: item.category || found.category,
                  likes_count: item.likes_count || 120,
                  remix_count: item.remix_count || 18,
                  author_name: item.author_name || "Creator",
                  author_handle: item.author_handle?.replace(/^@/, "") || "creator",
                  author_avatar: item.author_avatar || "CR",
                  seed: item.seed || 42,
                  width: 512,
                  height: 512,
                }));
                if (isMounted) {
                  setSimilarArtworks(formatted.filter((a) => a.id !== artworkId));
                  setLoading(false);
                  return;
                }
              }
            }
          } catch {
            // Backend similar API unavailable, fall back to DB artworks
          }

          // Fallback: fetch artworks with same category or any other artworks
          const all = await fetchArtworks();
          if (isMounted) {
            const matches = all.filter(
              (a) => a.id !== artworkId && a.category.toLowerCase() === found.category.toLowerCase()
            );
            const fallbackList = matches.length >= 4 ? matches : all.filter((a) => a.id !== artworkId);
            setSimilarArtworks(fallbackList.slice(0, 8));
          }
        }
      } catch (err) {
        console.error("Failed to load artwork detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [artworkId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleBookmarkToggle = () => {
    if (!artwork) return;
    if (isBookmarked) {
      removePrivateArtwork(artwork.id);
      setIsBookmarked(false);
    } else {
      savePrivateArtwork(artwork);
      setIsBookmarked(true);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: S.textSecondary }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `3px solid ${S.primary}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "14px" }}>Loading generation details...</span>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div style={{ flex: 1, padding: "40px 24px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", marginBottom: "8px" }}>Generation Not Found</h2>
        <p style={{ color: S.textSecondary, fontSize: "14px", marginBottom: "20px" }}>
          The requested artwork could not be located in the explore gallery.
        </p>
        <button
          onClick={() => router.push("/explore")}
          style={{
            padding: "10px 20px",
            background: S.primary,
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Return to Explore
        </button>
      </div>
    );
  }

  const royaltyPercent =
    artwork.remix_fee && artwork.creator_royalty_cut
      ? Math.round((artwork.creator_royalty_cut / artwork.remix_fee) * 100)
      : 40;

  const displayMasked =
    artwork.masked_summary ||
    `${artwork.category} • High Fidelity • Masterpiece • [Secret Recipe Encrypted]`;

  return (
    <div style={{ flex: 1, padding: "clamp(16px, 3vw, 32px)", maxWidth: "1400px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* ── TOP BREADCRUMB & BACK ACTION ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: S.textSecondary }}>
          <button
            onClick={() => router.push("/explore")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${S.borderLight}`,
              padding: "6px 12px",
              borderRadius: "8px",
              color: S.textPrimary,
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
              (e.currentTarget as HTMLButtonElement).style.color = S.textPrimary;
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Explore</span>
          </button>

          <ChevronRight size={14} style={{ opacity: 0.4 }} />

          <Link
            href={`/explore/category/${encodeURIComponent(artwork.category.toLowerCase())}`}
            style={{ color: S.cyan, textDecoration: "none", fontWeight: 600 }}
          >
            {artwork.category}
          </Link>

          <ChevronRight size={14} style={{ opacity: 0.4 }} />

          <span style={{ color: "#ffffff", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {artwork.title || "Artwork Detail"}
          </span>
        </div>

        {/* Top Header Actions (Bookmark & Share) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Bookmark Button */}
          <button
            id="btn-bookmark-generation"
            onClick={handleBookmarkToggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: isBookmarked ? "rgba(0, 212, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: isBookmarked ? "1px solid rgba(0, 212, 255, 0.5)" : `1px solid ${S.borderLight}`,
              padding: "6px 14px",
              borderRadius: "8px",
              color: isBookmarked ? S.cyan : S.textSecondary,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
              (e.currentTarget as HTMLButtonElement).style.color = S.cyan;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = isBookmarked ? "rgba(0, 212, 255, 0.5)" : S.borderLight;
              (e.currentTarget as HTMLButtonElement).style.color = isBookmarked ? S.cyan : S.textSecondary;
            }}
          >
            <Bookmark size={13} style={{ fill: isBookmarked ? S.cyan : "none" }} />
            <span>{isBookmarked ? "Saved in Gallery" : "Save to Gallery"}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${S.borderLight}`,
              padding: "6px 14px",
              borderRadius: "8px",
              color: S.textSecondary,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ffffff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = S.textSecondary)}
          >
            <Share2 size={13} />
            <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN GENERATION DISPLAY (TWO COLUMNS) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "28px",
          background: S.card,
          border: `1px solid ${S.borderLight}`,
          borderRadius: "20px",
          padding: "clamp(16px, 3vw, 28px)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          marginBottom: "40px",
        }}
      >
        {/* Left: High-Res Image Display */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            background: "#08080c",
            border: `1px solid ${S.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "440px",
            maxHeight: "680px",
          }}
        >
          <img
            src={artwork.image_url}
            alt={artwork.title || "Artwork detail preview"}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "680px",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
            }}
          />

          {/* Interactive Category Badge Top-Left */}
          <button
            onClick={() => router.push(`/explore/category/${encodeURIComponent(artwork.category.toLowerCase())}`)}
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              padding: "5px 12px",
              borderRadius: "9999px",
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              fontSize: "12px",
              fontWeight: 700,
              color: S.cyan,
              border: "1px solid rgba(0, 212, 255, 0.35)",
              cursor: "pointer",
              transition: "transform 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0, 212, 255, 0.35)";
            }}
          >
            {artwork.category}
          </button>

          {/* Like Button */}
          <button
            onClick={() => setLiked(!liked)}
            style={{
              position: "absolute",
              bottom: "14px",
              right: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "9999px",
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(8px)",
              border: liked ? "1px solid rgba(239, 68, 68, 0.6)" : `1px solid ${S.borderLight}`,
              cursor: "pointer",
              color: liked ? "#ef4444" : "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <Heart size={15} style={{ fill: liked ? "#ef4444" : "none" }} />
            <span>{(artwork.likes_count || 100) + (liked ? 1 : 0)}</span>
          </button>
        </div>

        {/* Right: Metadata, Secret Formula DRM, and Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
          <div>
            {/* Author Attribution & Royalty Split */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {artwork.author_avatar || "CA"}
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: "20px", color: S.textPrimary, fontWeight: 700 }}>
                    {artwork.title || "Community Artwork"}
                  </h1>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: S.textSecondary }}>
                    by @{artwork.author_handle}
                  </p>
                </div>
              </div>

              {/* Creator Royalty Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "9999px",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  color: S.success,
                  fontSize: "12px",
                  fontWeight: 700,
                }}
                title="Author receives creator royalty on every remix generation"
              >
                <Sparkles size={13} />
                <span>{royaltyPercent}% Royalty</span>
              </div>
            </div>

            {/* Secret Formula DRM Box (Anti-Theft Protected) */}
            <div
              style={{
                background: "#161622",
                border: `1px solid ${S.borderLight}`,
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: S.cyan, fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Lock size={13} />
                  <span>Public Style Tags (Secret Formula DRM)</span>
                </div>
                <span style={{ fontSize: "11px", color: S.textMuted }}>
                  Encrypted Master Recipe
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#e2e8f0", lineHeight: 1.6, fontFamily: "monospace" }}>
                {displayMasked}
              </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: "16px", fontSize: "12.5px", color: S.textMuted, marginBottom: "20px", flexWrap: "wrap" }}>
              <span>⚡ {artwork.remix_count || 32} Community remixes</span>
              <span>•</span>
              <span>Model: {artwork.model}</span>
              {artwork.aspect_ratio && (
                <>
                  <span>•</span>
                  <span>Ratio: {artwork.aspect_ratio}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* 1. Use as Prompt */}
            <button
              id="btn-use-as-prompt"
              onClick={() => {
                router.push(
                  `/studio?prompt=${encodeURIComponent(displayMasked)}&remixPromptId=${artwork.id}&engine=flux`
                );
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "13px 18px",
                borderRadius: "12px",
                background: S.primary,
                border: "none",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = S.primaryDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = S.primary)}
            >
              <Wand2 size={16} />
              <span>Use as Prompt (Credit Author)</span>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* 2. Use as Ref */}
              <button
                id="btn-use-as-ref"
                onClick={() => {
                  router.push(
                    `/studio?imageUrl=${encodeURIComponent(artwork.image_url)}&remixPromptId=${artwork.id}&prompt=${encodeURIComponent(displayMasked)}`
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "11px",
                  borderRadius: "11px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${S.borderLight}`,
                  color: S.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
                  (e.currentTarget as HTMLButtonElement).style.color = S.cyan;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
                  (e.currentTarget as HTMLButtonElement).style.color = S.textPrimary;
                }}
              >
                <ImageIcon size={15} />
                <span>Use as Ref</span>
              </button>

              {/* 3. Remix on My Photo */}
              <button
                id="btn-remix-my-photo"
                onClick={() => {
                  router.push(
                    `/studio?faceLock=true&remixPromptId=${artwork.id}&prompt=${encodeURIComponent(displayMasked)}`
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "11px",
                  borderRadius: "11px",
                  background: "rgba(168, 85, 247, 0.12)",
                  border: "1px solid rgba(168, 85, 247, 0.35)",
                  color: "#c084fc",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(168, 85, 247, 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(168, 85, 247, 0.12)";
                }}
              >
                <Camera size={15} />
                <span>Remix on My Photo</span>
              </button>
            </div>

            {/* Save to Collection / Gallery Button */}
            <button
              id="btn-save-to-gallery-action"
              onClick={handleBookmarkToggle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px",
                borderRadius: "11px",
                background: isBookmarked ? "rgba(0, 212, 255, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: isBookmarked ? "1px solid rgba(0, 212, 255, 0.45)" : `1px solid ${S.borderLight}`,
                color: isBookmarked ? S.cyan : S.textPrimary,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = isBookmarked ? "rgba(0, 212, 255, 0.45)" : S.borderLight;
              }}
            >
              <Bookmark size={15} style={{ fill: isBookmarked ? S.cyan : "none" }} />
              <span>{isBookmarked ? "Saved in Your Gallery (Tap to Remove)" : "Save Generation to My Gallery"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SIMILAR GENERATIONS SECTION ── */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} style={{ color: S.cyan }} />
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                Similar Generations
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: S.textSecondary, margin: "4px 0 0" }}>
              More community creations in <span style={{ color: S.cyan, fontWeight: 600 }}>{artwork.category}</span> and matching aesthetic styles
            </p>
          </div>

          <Link
            href={`/explore/category/${encodeURIComponent(artwork.category.toLowerCase())}`}
            style={{
              fontSize: "13px",
              color: S.cyan,
              textDecoration: "none",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Similar Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {similarArtworks.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/explore/${item.id}`)}
              style={{
                position: "relative",
                borderRadius: "14px",
                overflow: "hidden",
                background: "#101018",
                border: `1px solid ${S.borderLight}`,
                cursor: "pointer",
                aspectRatio: "1 / 1",
                transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-4px)";
                el.style.borderColor = S.cyan;
                el.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.6)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(0)";
                el.style.borderColor = S.borderLight;
                el.style.boxShadow = "none";
              }}
            >
              <img
                src={item.image_url}
                alt={item.title || "Similar creation"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Category Tag */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(6px)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: S.cyan,
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                }}
              >
                {item.category}
              </div>

              {/* Likes Top-Right */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(6px)",
                  color: "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <Heart size={11} style={{ fill: "#ef4444", color: "#ef4444" }} />
                <span>{item.likes_count || 100}</span>
              </div>

              {/* Bottom Info Bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "10px 12px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#e2e8f0", fontWeight: 600 }}>
                  @{item.author_handle}
                </span>
                <span style={{ fontSize: "10.5px", color: S.cyan }}>
                  ⚡ {item.remix_count || 24}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

