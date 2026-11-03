'use client'

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  ChevronDown,
  Sparkles,
  Layers,
  Search,
  Filter,
  Bookmark,
} from "lucide-react";
import { fetchArtworks, savePrivateArtwork, removePrivateArtwork, isArtworkBookmarked, type Artwork } from "@/lib/supabase/db";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

const ALL_CATEGORIES = [
  "Cyberpunk",
  "Photorealism",
  "Anime",
  "Product",
  "Character",
  "Architecture",
  "3D Render",
];

const SORT_OPTIONS = ["Trending Now", "Newest First", "Most Liked", "Most Remixed"];

export default function CategoryExplorePage() {
  const router = useRouter();
  const params = useParams();
  const rawCategory = (params?.category as string) || "all";
  const activeCategory = decodeURIComponent(rawCategory).toLowerCase();

  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Trending Now");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  const syncBookmarks = (artworksList: Artwork[]) => {
    const bMap: Record<string, boolean> = {};
    artworksList.forEach((item) => {
      bMap[item.id] = isArtworkBookmarked(item.id, item.image_url);
    });
    setBookmarkedMap(bMap);
  };

  useEffect(() => {
    let isMounted = true;
    fetchArtworks().then((data) => {
      if (isMounted) {
        setItems(data);
        syncBookmarks(data);
        setLoading(false);
      }
    });

    const handleUpdate = () => {
      setItems((current) => {
        syncBookmarks(current);
        return current;
      });
    };

    window.addEventListener("craftai_bookmarks_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("craftai_bookmarks_updated", handleUpdate);
    };
  }, []);

  const handleLikeToggle = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBookmarkToggle = (item: Artwork) => {
    const isSaved = Boolean(bookmarkedMap[item.id]);
    if (isSaved) {
      removePrivateArtwork(item.id);
      removePrivateArtwork(item.image_url);
      setBookmarkedMap((prev) => ({ ...prev, [item.id]: false }));
    } else {
      savePrivateArtwork({
        id: item.id,
        prompt: item.prompt || item.title,
        image_url: item.image_url,
        model: item.model,
        aspect_ratio: item.aspect_ratio || "1:1",
      });
      setBookmarkedMap((prev) => ({ ...prev, [item.id]: true }));
    }
  };

  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      if (activeCategory === "all") return true;
      return (item.category || "").toLowerCase() === activeCategory;
    });

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
  }, [items, activeCategory, searchQuery, sortBy]);

  const displayCategoryTitle =
    ALL_CATEGORIES.find((c) => c.toLowerCase() === activeCategory) ||
    activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

  return (
    <div style={{ flex: 1, padding: "clamp(16px, 3vw, 32px)", maxWidth: "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* ── TOP HEADER & BREADCRUMB ── */}
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={() => router.push("/explore")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${S.borderLight}`,
            padding: "6px 12px",
            borderRadius: "8px",
            color: S.textPrimary,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "13px",
            marginBottom: "16px",
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

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: S.cyan, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Category Hub
              </span>
              <span style={{ fontSize: "12px", color: S.textMuted }}>•</span>
              <span style={{ fontSize: "12px", color: S.textMuted }}>
                {filtered.length} {filtered.length === 1 ? "Artwork" : "Artworks"}
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                margin: 0,
                fontFamily: "var(--font-outfit, Outfit, sans-serif)",
              }}
            >
              {displayCategoryTitle}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: S.textSecondary, maxWidth: "600px" }}>
              Explore top trending and community-crafted AI artwork generated under the {displayCategoryTitle} aesthetic.
            </p>
          </div>

          {/* Search in Category */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#12141f",
              border: `1px solid ${S.borderLight}`,
              borderRadius: "10px",
              padding: "8px 14px",
              width: "min(320px, 100%)",
            }}
          >
            <Search size={15} style={{ color: S.textMuted }} />
            <input
              type="text"
              placeholder={`Search in ${displayCategoryTitle}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f1f5f9",
                fontSize: "13px",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── FAST CATEGORY SWITCHER & SORT BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "28px",
          flexWrap: "wrap",
          borderBottom: `1px solid ${S.borderLight}`,
          paddingBottom: "16px",
        }}
      >
        {/* Horizontal Category Switcher Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px", maxWidth: "100%" }}>
          <button
            onClick={() => router.push("/explore")}
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              border: `1px solid ${S.borderLight}`,
              background: "rgba(255, 255, 255, 0.03)",
              color: S.textSecondary,
              fontSize: "12.5px",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const isCurrent = cat.toLowerCase() === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => router.push(`/explore/category/${encodeURIComponent(cat.toLowerCase())}`)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  border: isCurrent ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                  background: isCurrent ? "rgba(0, 212, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  color: isCurrent ? S.cyan : S.textSecondary,
                  fontSize: "12.5px",
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${S.borderLight}`,
              color: S.textPrimary,
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Filter size={13} style={{ color: S.cyan }} />
            <span>{sortBy}</span>
            <ChevronDown size={13} />
          </button>

          {sortOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: S.panel,
                border: `1px solid ${S.borderLight}`,
                borderRadius: "10px",
                padding: "6px",
                zIndex: 100,
                minWidth: "160px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.8)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSortBy(opt);
                    setSortOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    background: sortBy === opt ? "rgba(0, 212, 255, 0.15)" : "transparent",
                    border: "none",
                    color: sortBy === opt ? S.cyan : S.textPrimary,
                    fontSize: "12px",
                    fontWeight: sortBy === opt ? 700 : 400,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MASONRY / GRID OF CATEGORY ARTWORKS ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: S.textSecondary }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: `3px solid ${S.cyan}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "13px" }}>Loading {displayCategoryTitle} artworks...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: S.textSecondary }}>
          <Sparkles size={36} style={{ color: S.cyan, marginBottom: "12px", opacity: 0.7 }} />
          <h3 style={{ color: "#ffffff", fontSize: "18px", margin: "0 0 6px" }}>No artworks found</h3>
          <p style={{ fontSize: "13px", maxWidth: "420px", margin: "0 auto 20px" }}>
            There are no creations matching &quot;{searchQuery || displayCategoryTitle}&quot; yet. Be the first to generate one in Studio!
          </p>
          <button
            onClick={() => router.push(`/studio?prompt=${encodeURIComponent(displayCategoryTitle + " masterpiece")}`)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: S.primary,
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create in Studio
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filtered.map((item) => {
            const isLiked = !!likedMap[item.id];
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/explore/${item.id}`)}
                style={{
                  position: "relative",
                  borderRadius: "16px",
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
                  el.style.boxShadow = "0 16px 36px rgba(0, 0, 0, 0.6)";
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
                  alt={item.title || "Category creation"}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Category Pill Top-Left (stops propagation) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/explore/category/${encodeURIComponent(item.category.toLowerCase())}`);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(0, 0, 0, 0.75)",
                    backdropFilter: "blur(6px)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: S.cyan,
                    border: "1px solid rgba(0, 212, 255, 0.35)",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  {item.category}
                </button>

                {/* Top-Right Action Controls (Bookmark & Like) */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 3,
                  }}
                >
                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle(item);
                    }}
                    title={bookmarkedMap[item.id] ? "Remove from Saved Gallery" : "Save to Saved Gallery"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      borderRadius: "7px",
                      background: bookmarkedMap[item.id] ? "rgba(0, 212, 255, 0.28)" : "rgba(0,0,0,0.75)",
                      backdropFilter: "blur(6px)",
                      border: bookmarkedMap[item.id] ? "1.5px solid #00d4ff" : "1px solid rgba(255,255,255,0.18)",
                      cursor: "pointer",
                      color: bookmarkedMap[item.id] ? "#00d4ff" : "#cbd5e1",
                      boxShadow: bookmarkedMap[item.id] ? "0 0 14px rgba(0, 212, 255, 0.55)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <Bookmark
                      size={14}
                      style={{
                        fill: bookmarkedMap[item.id] ? "#00d4ff" : "none",
                        stroke: bookmarkedMap[item.id] ? "#00d4ff" : "currentColor",
                      }}
                    />
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeToggle(item.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      height: "30px",
                      borderRadius: "7px",
                      background: "rgba(0, 0, 0, 0.75)",
                      backdropFilter: "blur(6px)",
                      border: isLiked ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      color: isLiked ? "#ef4444" : "#cbd5e1",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    <Heart size={12} style={{ fill: isLiked ? "#ef4444" : "none" }} />
                    <span>{(item.likes_count || 100) + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>

                {/* Bottom Overlay Info */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px 14px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {item.author_avatar || "CA"}
                    </div>
                    <span style={{ fontSize: "12px", color: "#e5e7eb", fontWeight: 600 }}>
                      @{item.author_handle}
                    </span>
                  </div>

                  <span style={{ fontSize: "11px", color: S.cyan, fontWeight: 600 }}>
                    ⚡ {item.remix_count || 24}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

