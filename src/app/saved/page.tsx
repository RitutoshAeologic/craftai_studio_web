'use client'

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  Search,
  Wand2,
  Trash2,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  fetchBookmarks,
  removePrivateArtwork,
  type Generation,
} from "@/lib/supabase/db";
import { useUser } from "@/context/UserContext";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

export default function SavedGalleryPage() {
  const router = useRouter();
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";

  const [savedItems, setSavedItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSaved = () => {
    fetchBookmarks(userKey).then((data) => {
      setSavedItems(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSaved();

    const handleUpdate = () => {
      loadSaved();
    };

    window.addEventListener("craftai_bookmarks_updated", handleUpdate);
    return () => {
      window.removeEventListener("craftai_bookmarks_updated", handleUpdate);
    };
  }, [userKey]);

  const handleRemove = async (item: Generation) => {
    await removePrivateArtwork(item.id || item.image_url, user?.id);
    setSavedItems((prev) => prev.filter((i) => i.id !== item.id && i.image_url !== item.image_url));
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return savedItems;
    const q = searchQuery.toLowerCase();
    return savedItems.filter(
      (item) =>
        (item.prompt && item.prompt.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q))
    );
  }, [savedItems, searchQuery]);

  return (
    <div
      style={{
        flex: 1,
        padding: "clamp(16px, 3vw, 32px)",
        maxWidth: "1600px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Bookmark size={15} style={{ color: S.cyan, fill: S.cyan }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: S.cyan,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Private Bookmarks
            </span>
            <span style={{ fontSize: "12px", color: S.textMuted }}>•</span>
            <span style={{ fontSize: "12px", color: S.textMuted }}>
              {savedItems.length} {savedItems.length === 1 ? "Creation" : "Creations"}
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
            Saved Gallery
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: S.textSecondary, maxWidth: "600px" }}>
            Your private collection of bookmarked community creations and inspiration.
          </p>
        </div>

        {/* Search within Saved */}
        {savedItems.length > 0 && (
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
              placeholder="Search saved creations..."
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
        )}
      </div>

      {/* ── CONTENT GRID ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: S.textSecondary }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: `3px solid ${S.cyan}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "13px" }}>Loading saved creations...</span>
          </div>
        </div>
      ) : savedItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "rgba(255, 255, 255, 0.02)",
            border: `1px dashed ${S.borderLight}`,
            borderRadius: "20px",
            maxWidth: "600px",
            margin: "40px auto",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(0, 212, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: S.cyan,
            }}
          >
            <Bookmark size={28} />
          </div>
          <h3 style={{ color: "#ffffff", fontSize: "20px", margin: "0 0 8px", fontWeight: 700 }}>
            No saved creations yet
          </h3>
          <p style={{ fontSize: "13.5px", color: S.textSecondary, lineHeight: 1.5, margin: "0 0 24px" }}>
            Explore the public community showcase and tap the bookmark icon on any generation to save it here for fast reference.
          </p>
          <button
            onClick={() => router.push("/explore")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 22px",
              borderRadius: "10px",
              background: S.primary,
              border: "none",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <span>Browse Explore Community</span>
            <ArrowRight size={15} />
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: S.textSecondary }}>
          <p style={{ fontSize: "14px" }}>No saved artworks match &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id || item.image_url}
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#08080c",
                border: `1px solid ${S.borderLight}`,
                aspectRatio: "1 / 1",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                el.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.4)";
              }}
            >
              {/* Ambient backdrop for non-square framing so subjects are never clipped */}
              {(item.aspect_ratio === "16:9" || item.aspect_ratio === "9:16") && (
                <div
                  style={{
                    position: "absolute",
                    inset: -10,
                    backgroundImage: `url(${item.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(20px) brightness(0.35)",
                    zIndex: 0,
                  }}
                />
              )}

              <img
                src={item.image_url}
                alt={item.prompt || "Saved artwork"}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  objectFit: item.aspect_ratio === "16:9" || item.aspect_ratio === "9:16" ? "contain" : "cover",
                  objectPosition: "center",
                  display: "block",
                  zIndex: 1,
                }}
              />

              {/* Remove from Saved Bookmark Button (Top-Right) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                title="Remove from Saved Gallery"
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(6px)",
                  border: `1px solid ${S.borderLight}`,
                  color: S.cyan,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 3,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = S.cyan;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
                }}
              >
                <Bookmark size={15} style={{ fill: S.cyan }} />
              </button>

              {/* Bottom Info Bar & Quick Use as Prompt */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "12px 14px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#f1f5f9",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {item.prompt || "Saved Artwork"}
                </p>

                <button
                  onClick={() => router.push(`/studio?prompt=${encodeURIComponent(item.prompt)}&imageUrl=${encodeURIComponent(item.image_url)}`)}
                  title="Use as prompt in Studio"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: S.primary,
                    border: "none",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Wand2 size={12} />
                  <span>Remix</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

