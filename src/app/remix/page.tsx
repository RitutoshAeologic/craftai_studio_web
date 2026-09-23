'use client'

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wand2,
  Upload,
  History,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { fetchGenerations, fetchArtworks, type Generation, type Artwork } from "@/lib/supabase/db";
import RemixWorkspace from "./[id]/RemixWorkspace";

function RemixLaunchpadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRef =
    searchParams.get("ref") ||
    searchParams.get("anchorImageUrl") ||
    searchParams.get("imageUrl") ||
    searchParams.get("image");
  const queryPrompt =
    searchParams.get("prompt") ||
    searchParams.get("initialPrompt") ||
    "";

  const [activeRef, setActiveRef] = useState<string | null>(queryRef || null);
  const [activePrompt, setActivePrompt] = useState<string>(queryPrompt);
  const [recentGens, setRecentGens] = useState<Generation[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGenerations().then((gens) => {
      setRecentGens(gens.filter((g) => g.image_url && g.image_url.startsWith("http")).slice(0, 8));
    });
    fetchArtworks().then((arts) => {
      setArtworks(arts.slice(0, 8));
    });
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setActiveRef(dataUrl);
      setActivePrompt(`Remix of ${file.name.replace(/\.[^/.]+$/, "")}`);
    };
    reader.readAsDataURL(file);
  };

  // If a reference image is chosen, open the active Remix Workspace
  if (activeRef) {
    return (
      <RemixWorkspace
        referenceImage={activeRef}
        initialPrompt={activePrompt}
        onBack={() => setActiveRef(null)}
      />
    );
  }

  // Otherwise, display the intuitive Remix Launchpad
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#0a0e18",
        padding: "36px 32px 60px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            marginBottom: "16px",
          }}
        >
          <Wand2 size={14} style={{ color: "#a5b4fc" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Remix Lab
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
            fontFamily: "var(--font-outfit, Outfit, sans-serif)",
          }}
        >
          Select an Artwork to Remix
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
          Remix Lab transforms existing artwork by adjusting style, lighting, and palette while using the original composition as a visual anchor. Upload your own image or choose from creations below.
        </p>
      </div>

      {/* ── 1. Drag & Drop Upload Zone ─────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "36px 24px",
          borderRadius: "16px",
          background: isDragging ? "rgba(0, 212, 255, 0.08)" : "rgba(22, 29, 43, 0.5)",
          border: isDragging ? "2px dashed #00d4ff" : "1.5px dashed #222f4c",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.2s ease",
          boxShadow: isDragging ? "0 0 30px rgba(0, 212, 255, 0.15)" : "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#00d4ff";
          (e.currentTarget as HTMLDivElement).style.background = "rgba(0, 212, 255, 0.04)";
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#222f4c";
            (e.currentTarget as HTMLDivElement).style.background = "rgba(22, 29, 43, 0.5)";
          }
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(99, 102, 241, 0.2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Upload size={24} style={{ color: "#00d4ff" }} />
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
          Drop any image here to remix
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
          or click to browse from your device · PNG, JPG, WebP supported
        </p>
        <button
          type="button"
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            background: "#00d4ff",
            border: "none",
            color: "#000000",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Browse Image File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />
      </div>

      {/* ── 2. Your Recent Generations ─────────────────────── */}
      {recentGens.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <History size={16} style={{ color: "#00d4ff" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Remix from Your Recent Generations
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {recentGens.map((gen) => (
              <div
                key={gen.id}
                onClick={() => {
                  setActiveRef(gen.image_url);
                  setActivePrompt(gen.prompt);
                }}
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#00d4ff";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ height: "160px", width: "100%", background: "#0b0f19", position: "relative" }}>
                  <img
                    src={gen.image_url}
                    alt={gen.prompt}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.75)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#00d4ff",
                    }}
                  >
                    {gen.model}
                  </div>
                </div>

                <div style={{ padding: "12px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#cbd5e1",
                      margin: "0 0 10px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: "1.4",
                    }}
                  >
                    {gen.prompt}
                  </p>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.35)",
                      color: "#a5b4fc",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Wand2 size={12} />
                    Remix This
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Community Creations to Remix ────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LayoutGrid size={16} style={{ color: "#6366f1" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Or Choose from Community Showcase
            </h2>
          </div>
          <Link
            href="/explore"
            style={{ fontSize: "12px", color: "#00d4ff", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <span>Explore All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {artworks.map((art) => (
            <div
              key={art.id}
              onClick={() => {
                router.push(`/remix/${art.id}`);
              }}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#6366f1";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ height: "160px", width: "100%", background: "#0b0f19", position: "relative" }}>
                <img
                  src={art.image_url || art.fallback_url}
                  alt={art.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.75)",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#818cf8",
                  }}
                >
                  {art.category}
                </div>
              </div>

              <div style={{ padding: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px" }}>
                  {art.title}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    margin: "0 0 10px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  by {art.author_name}
                </p>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: "rgba(0, 212, 255, 0.08)",
                    border: "1px solid rgba(0, 212, 255, 0.25)",
                    color: "#00d4ff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Wand2 size={12} />
                  Remix Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RemixPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#64748b" }}>Loading Remix Lab...</div>}>
      <RemixLaunchpadContent />
    </Suspense>
  );
}
