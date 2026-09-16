'use client'

import { useState, useMemo, useEffect } from "react";
import { Search, Heart, ChevronDown, Wand2, X, ShieldCheck, Sparkles, Image as ImageIcon, Camera, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchArtworks, type Artwork } from "@/lib/supabase/db";

/* ── Design tokens matching Flutter & Web Spec ──────────────── */
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
};

/* ── Categories matching specification ──────────────────────── */
const CATEGORIES = [
  "All",
  "Cyberpunk",
  "Photorealism",
  "Anime",
  "Product",
  "Character",
  "Architecture",
  "3D Render",
];

const SORT_OPTIONS = ["Trending Now", "Newest First", "Most Liked", "Most Remixed"];

function encP(p: string) {
  return encodeURIComponent(p + ", ultra detailed, cinematic 8k quality");
}

/* ═══════════════════════════════════════════════════════════════
   CARD DETAIL MODAL / DRAWER (MeiGen Parity with DRM Protection)
═══════════════════════════════════════════════════════════════ */
function CardDetailModal({
  item,
  onClose,
  onLikeToggle,
  isLiked,
}: {
  item: Artwork;
  onClose: () => void;
  onLikeToggle: (id: string) => void;
  isLiked: boolean;
}) {
  const router = useRouter();
  const royaltyPercent = item.remix_fee && item.creator_royalty_cut
    ? Math.round((item.creator_royalty_cut / item.remix_fee) * 100)
    : 40;

  const displayMasked =
    item.masked_summary ||
    `${item.category} • High Fidelity • Masterpiece • [Secret Formula Encrypted]`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(12px, 3vw, 24px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: S.card,
          border: `1px solid ${S.borderLight}`,
          borderRadius: "18px",
          width: "min(920px, 96vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9)",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(0, 0, 0, 0.6)",
            border: `1px solid ${S.borderLight}`,
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            color: S.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = S.textSecondary;
            (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            padding: "24px",
          }}
        >
          {/* Left: Image Preview */}
          <div
            style={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#08080c",
              border: `1px solid ${S.borderLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxHeight: "520px",
            }}
          >
            <img
              src={item.image_url}
              alt={item.title || "Artwork preview"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Category Pill */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                padding: "4px 10px",
                borderRadius: "9999px",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                fontSize: "11px",
                fontWeight: 700,
                color: S.cyan,
                border: "1px solid rgba(0,212,255,0.3)",
              }}
            >
              {item.category}
            </div>

            {/* Like button in modal */}
            <button
              onClick={() => onLikeToggle(item.id)}
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "9999px",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                border: isLiked ? "1px solid rgba(239,68,68,0.5)" : `1px solid ${S.borderLight}`,
                cursor: "pointer",
                color: isLiked ? "#ef4444" : "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <Heart size={14} style={{ fill: isLiked ? "#ef4444" : "none" }} />
              {(item.likes_count || 100) + (isLiked ? 1 : 0)}
            </button>
          </div>

          {/* Right: Info, DRM Recipe, and Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "space-between" }}>
            <div>
              {/* Author Attribution & Royalty Split */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {item.author_avatar || "CA"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", color: S.textPrimary, fontWeight: 700 }}>
                      {item.title || "Community Artwork"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: S.textSecondary }}>
                      by @{item.author_handle}
                    </p>
                  </div>
                </div>

                {/* Creator Royalty Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: S.success,
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                  title="Author receives creator royalty on every remix generation"
                >
                  <Sparkles size={12} />
                  <span>{royaltyPercent}% Royalty</span>
                </div>
              </div>

              {/* Secret Formula DRM Box (Anti-Theft Protected) */}
              <div
                style={{
                  background: "#181822",
                  border: `1px solid ${S.borderLight}`,
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: S.cyan, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <Lock size={12} />
                    <span>Public Style Tags (Secret Formula DRM)</span>
                  </div>
                  <span style={{ fontSize: "10px", color: S.textMuted }}>
                    Encrypted Master Recipe
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", lineHeight: 1.5, fontFamily: "monospace" }}>
                  {displayMasked}
                </p>
              </div>

              {/* Remix stats */}
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: S.textMuted }}>
                <span>⚡ {item.remix_count || 32} Community remixes</span>
                <span>•</span>
                <span>Model: {item.model}</span>
              </div>
            </div>

            {/* Tri-Action Buttons (MeiGen Parity) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* 1. Use as Prompt */}
              <button
                id="btn-use-as-prompt"
                onClick={() => {
                  onClose();
                  router.push(
                    `/studio?prompt=${encodeURIComponent(displayMasked)}&remixPromptId=${item.id}`
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: S.primary,
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = S.primaryDark)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = S.primary)}
              >
                <Wand2 size={16} />
                Use as Prompt (Credit Author)
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {/* 2. Use as Ref */}
                <button
                  id="btn-use-as-ref"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/studio?imageUrl=${encodeURIComponent(item.image_url)}&remixPromptId=${item.id}&prompt=${encodeURIComponent(displayMasked)}`
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${S.borderLight}`,
                    color: S.textPrimary,
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
                    (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
                    (e.currentTarget as HTMLButtonElement).style.color = S.textPrimary;
                  }}
                >
                  <ImageIcon size={14} />
                  Use as Ref
                </button>

                {/* 3. Remix on My Photo */}
                <button
                  id="btn-remix-my-photo"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/studio?faceLock=true&remixPromptId=${item.id}&prompt=${encodeURIComponent(displayMasked)}`
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#c084fc",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(168, 85, 247, 0.22)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#c084fc";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(168, 85, 247, 0.12)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(168, 85, 247, 0.3)";
                  }}
                >
                  <Camera size={14} />
                  ⚡ Remix on My Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GALLERY CARD (DRM Compliant with Masked Summary)
═══════════════════════════════════════════════════════════════ */
function GalleryCard({
  item,
  onClick,
  onLikeToggle,
  isLiked,
}: {
  item: Artwork;
  onClick: () => void;
  onLikeToggle: (id: string) => void;
  isLiked: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    item.image_url ||
      `https://image.pollinations.ai/prompt/${encP(item.prompt)}?model=flux&width=512&height=${
        item.height || 360
      }&seed=${item.seed}&nologo=true`
  );

  const displayH = item.height || 360;
  const fallback =
    item.fallback_url ||
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "14px",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        height: displayH,
        background: "#08080c",
        border: hovered ? `1.5px solid ${S.cyan}` : `1.5px solid ${S.cardBorder}`,
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 30px rgba(0, 212, 255, 0.25)" : "none",
      }}
    >
      {/* Shimmer while loading */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #121218 25%, #1e1e2a 50%, #121218 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "2px solid #1e1e2a",
              borderTopColor: S.cyan,
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}

      <img
        src={imgSrc}
        alt={item.title || "Community creation"}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imgSrc !== fallback) {
            setImgSrc(fallback);
          }
          setLoaded(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s, transform 0.4s",
          transform: hovered ? "scale(1.04)" : "scale(1)",
        }}
      />

      {/* Category Pill Top-Left */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "3px 8px",
          borderRadius: "6px",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          fontSize: "11px",
          fontWeight: 700,
          color: S.cyan,
          border: "1px solid rgba(0,212,255,0.3)",
          zIndex: 2,
        }}
      >
        {item.category}
      </div>

      {/* Like Button Top-Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLikeToggle(item.id);
        }}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 8px",
          borderRadius: "6px",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          border: isLiked ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
          color: isLiked ? "#ef4444" : "#9ca3af",
          fontSize: "12px",
          fontWeight: 600,
          zIndex: 2,
          opacity: hovered ? 1 : 0.75,
          transition: "opacity 0.2s",
        }}
      >
        <Heart size={12} style={{ fill: isLiked ? "#ef4444" : "none" }} />
        {(item.likes_count || 100) + (isLiked ? 1 : 0)}
      </button>

      {/* Hover Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.25s",
        }}
      />

      {/* Bottom Info Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.25s, transform 0.25s",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {item.author_avatar || "CA"}
          </div>
          <span style={{ fontSize: "12px", color: "#e5e7eb", fontWeight: 500 }}>
            @{item.author_handle}
          </span>
        </div>

        <div style={{ fontSize: "11px", color: S.cyan, fontWeight: 600 }}>
          ⚡ {item.remix_count || 24} remixes
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPLORE PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ExplorePage() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Trending Now");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchArtworks().then(setItems);
  }, []);

  const handleLikeToggle = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    let result = items;
    if (category !== "All") result = result.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.masked_summary && i.masked_summary.toLowerCase().includes(q)) ||
          (i.author_handle && i.author_handle.toLowerCase().includes(q))
      );
    }
    if (sortBy === "Most Liked") result = [...result].sort((a, b) => b.likes_count - a.likes_count);
    if (sortBy === "Most Remixed") result = [...result].sort((a, b) => (b.remix_count || 0) - (a.remix_count || 0));
    return result;
  }, [items, category, sortBy, searchQuery]);

  const [colCount, setColCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setColCount(1);
      else if (w < 1024) setColCount(2);
      else if (w < 1440) setColCount(3);
      else setColCount(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cols = useMemo(() => {
    const arr: Artwork[][] = Array.from({ length: colCount }, () => []);
    filtered.forEach((item, i) => {
      arr[i % colCount].push(item);
    });
    return arr;
  }, [filtered, colCount]);

  return (
    <div style={{ minHeight: "100%", background: S.bg, display: "flex", flexDirection: "column" }}>
      {/* ── Top Filter Bar ───────────────────────────────────── */}
      <div
        style={{
          padding: "14px clamp(12px, 3vw, 24px)",
          borderBottom: `1px solid ${S.cardBorder}`,
          background: S.bg,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Category pills with horizontal scroll */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            maxWidth: "100%",
            paddingBottom: "4px",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase().replace(" ", "-")}`}
              onClick={() => setCategory(cat)}
              style={{
                padding: "7px 16px",
                borderRadius: "9999px",
                border: category === cat ? "none" : `1px solid ${S.borderLight}`,
                background: category === cat ? S.primary : S.card,
                color: category === cat ? "#ffffff" : S.textSecondary,
                fontSize: "12px",
                fontWeight: category === cat ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: "12px" }} />

        {/* Search & Sort Wrap Container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            flex: "1 1 280px",
            justifyContent: "flex-end",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: "180px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: S.textMuted,
              }}
            />
            <input
              id="explore-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search community creations..."
              style={{
                width: "100%",
                padding: "8px 14px 8px 36px",
                background: S.card,
                border: `1px solid ${S.borderLight}`,
                borderRadius: "9999px",
                color: S.textPrimary,
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              id="explore-sort-btn"
              onClick={() => setSortOpen(!sortOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: S.card,
                border: `1px solid ${S.borderLight}`,
                borderRadius: "9999px",
                cursor: "pointer",
                color: S.textPrimary,
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {sortBy}
              <ChevronDown size={13} style={{ color: S.textSecondary }} />
            </button>
            {sortOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: S.card,
                  border: `1px solid ${S.borderLight}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  zIndex: 100,
                  minWidth: "160px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => {
                      setSortBy(o);
                      setSortOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      background: sortBy === o ? "rgba(99,102,241,0.15)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: sortBy === o ? S.cyan : S.textPrimary,
                      fontSize: "13px",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Responsive Masonry Grid ───────────────────────────── */}
      <div
        style={{
          padding: "clamp(12px, 3vw, 24px)",
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: "clamp(10px, 2vw, 16px)",
          alignItems: "start",
          flex: 1,
        }}
      >
        {cols.map((col, colIdx) => (
          <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 2vw, 16px)" }}>
            {col.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => setSelectedArtwork(item)}
                onLikeToggle={handleLikeToggle}
                isLiked={Boolean(likedMap[item.id])}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Card Detail Modal (MeiGen Parity) ────────────────── */}
      {selectedArtwork && (
        <CardDetailModal
          item={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onLikeToggle={handleLikeToggle}
          isLiked={Boolean(likedMap[selectedArtwork.id])}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
