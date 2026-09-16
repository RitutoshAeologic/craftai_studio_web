'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Wand2,
  Heart,
  Settings,
  Share2,
  Edit3,
  Coins,
  Shield,
  Layers,
  Clock,
  Download,
  CheckCircle2,
  Trash2,
  Cpu,
} from "lucide-react";
import { fetchGenerations, fetchArtworks, deleteGeneration, type Generation, type Artwork } from "@/lib/supabase/db";
import { useUser } from "@/context/UserContext";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, updateProfile } = useUser();
  const userKey = user?.id || profile.email || "default";
  const [activeTab, setActiveTab] = useState<"creations" | "favorites" | "settings">("creations");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [favorites, setFavorites] = useState<Artwork[]>([]);
  const [preferredEngine, setPreferredEngine] = useState("Flux Schnell");
  const [defaultRatio, setDefaultRatio] = useState("1:1");
  const [safeMode, setSafeMode] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(profile.name);

  useEffect(() => {
    setDisplayNameInput(profile.name);
  }, [profile.name]);

  useEffect(() => {
    fetchGenerations(userKey).then(setGenerations);
    fetchArtworks().then((arts) => setFavorites(arts.slice(0, 6)));

    const handleUpdate = () => {
      fetchGenerations(userKey).then(setGenerations);
    };
    window.addEventListener("craftai_generations_updated", handleUpdate);
    return () => window.removeEventListener("craftai_generations_updated", handleUpdate);
  }, [userKey]);

  const handleDeleteGen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    await deleteGeneration(id, userKey);
  };

  const handleSaveSettings = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div style={{ minHeight: "100%", background: "#0a0e18", paddingBottom: "60px" }}>
      {/* ── Top Cover Banner ────────────────────────────────── */}
      <div
        style={{
          height: "200px",
          width: "100%",
          background: "linear-gradient(135deg, #0b1329 0%, #1e1b4b 50%, #082f49 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 30% 50%, rgba(0, 212, 255, 0.15), transparent 60%)",
          }}
        />
      </div>

      {/* ── Profile Header Bar ──────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)", position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "clamp(-45px, -6vw, -60px)",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Avatar & Identifiers */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(12px, 3vw, 20px)", flexWrap: "wrap" }}>
            <div
              style={{
                width: "clamp(75px, 14vw, 110px)",
                height: "clamp(75px, 14vw, 110px)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #00d4ff 100%)",
                border: "4px solid #0a0e18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(24px, 5vw, 36px)",
                fontWeight: 800,
                color: "#ffffff",
                boxShadow: "0 8px 32px rgba(0, 212, 255, 0.25)",
                flexShrink: 0,
              }}
            >
              {profile.initials}
            </div>

            <div style={{ paddingBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)", fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
                  {profile.name}
                </h1>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: "rgba(0, 212, 255, 0.12)",
                    border: "1px solid rgba(0, 212, 255, 0.35)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#00d4ff",
                  }}
                >
                  PRO CREATOR
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 6px" }}>
                {profile.handle} · AI Prompt Crafting &amp; Concept Design
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px", color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={13} /> Joined Jan 2024
                </span>
                <span>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399" }}>
                  <CheckCircle2 size={13} /> Verified Free Tier
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "6px" }}>
            <button
              onClick={() => setActiveTab("settings")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "10px",
                background: "#161d2b",
                border: "1px solid #1e293b",
                color: "#e2e8f0",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
            <button
              onClick={() => router.push("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "10px",
                background: "#00d4ff",
                border: "none",
                color: "#000000",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(0, 212, 255, 0.4)",
              }}
            >
              <Sparkles size={14} />
              <span>Create Artwork</span>
            </button>
          </div>
        </div>

        {/* ── Key Metrics Cards ──────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
              Generations Run
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
              {generations.length + 120}
            </p>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
              Total Remixes
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#a5b4fc" }}>
              89
            </p>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
              Community Likes
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f43f5e" }}>
              1,248
            </p>
          </div>

          <div style={{ background: "#111827", border: "1px solid rgba(0, 212, 255, 0.25)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#00d4ff", fontWeight: 600 }}>
              Available Credits
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#00d4ff" }}>
              98 <span style={{ fontSize: "12px", fontWeight: 500, color: "#94a3b8" }}>/ 100 Free</span>
            </p>
          </div>
        </div>

        {/* ── Tab Switcher ───────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid #1e293b",
            marginBottom: "24px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => setActiveTab("creations")}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "creations" ? "2px solid #00d4ff" : "2px solid transparent",
              color: activeTab === "creations" ? "#00d4ff" : "#94a3b8",
              fontSize: "14px",
              fontWeight: activeTab === "creations" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            My Creations ({generations.length})
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "favorites" ? "2px solid #00d4ff" : "2px solid transparent",
              color: activeTab === "favorites" ? "#00d4ff" : "#94a3b8",
              fontSize: "14px",
              fontWeight: activeTab === "favorites" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Saved &amp; Bookmarks ({favorites.length})
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "settings" ? "2px solid #00d4ff" : "2px solid transparent",
              color: activeTab === "settings" ? "#00d4ff" : "#94a3b8",
              fontSize: "14px",
              fontWeight: activeTab === "settings" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Preferences &amp; Engine
          </button>
        </div>

        {/* ── Tab 1: Creations Grid ──────────────────────────── */}
        {activeTab === "creations" && (
          <div>
            {generations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                <Layers size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p style={{ fontSize: "15px", color: "#94a3b8" }}>No artworks generated yet.</p>
                <button
                  onClick={() => router.push("/")}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#00d4ff",
                    border: "none",
                    color: "#000",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Create Your First Artwork
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                  gap: "16px",
                }}
              >
                {generations.map((gen) => (
                  <div
                    key={gen.id}
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: "14px",
                      overflow: "hidden",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ height: "200px", width: "100%", background: "#0b0f19", position: "relative" }}>
                      <img
                        src={gen.image_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop"}
                        alt={gen.prompt}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        title="Delete from history"
                        onClick={(e) => handleDeleteGen(gen.id, e)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "rgba(0,0,0,0.65)",
                          border: "none",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ padding: "14px" }}>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#f1f5f9",
                          margin: "0 0 12px",
                          lineHeight: "1.4",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {gen.prompt}
                      </p>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => router.push(`/studio?prompt=${encodeURIComponent(gen.prompt)}`)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "rgba(0,212,255,0.08)",
                            border: "1px solid rgba(0,212,255,0.25)",
                            color: "#00d4ff",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Studio
                        </button>
                        <button
                          onClick={() => router.push(`/remix?ref=${encodeURIComponent(gen.image_url)}&prompt=${encodeURIComponent(gen.prompt)}`)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "rgba(99,102,241,0.12)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            color: "#a5b4fc",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Remix
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Saved / Bookmarks ───────────────────────── */}
        {activeTab === "favorites" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
              gap: "16px",
            }}
          >
            {favorites.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: "200px", width: "100%", background: "#0b0f19" }}>
                  <img
                    src={item.image_url || item.fallback_url}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "14px" }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#ffffff", fontWeight: 700 }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#64748b" }}>
                    by {item.author_name} · {item.category}
                  </p>
                  <button
                    onClick={() => router.push(`/remix/${item.id}`)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      background: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.35)",
                      color: "#a5b4fc",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Remix in Lab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 3: Preferences & Settings ──────────────────── */}
        {activeTab === "settings" && (
          <div
            style={{
              maxWidth: "600px",
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
              Creator Profile &amp; Preferences
            </h3>

            {/* Display Name Input */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                Creator Display Name
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Your display name"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#161d2b",
                  border: "1px solid #222f4c",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Preferred Model */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                Default AI Model Engine
              </label>
              <select
                value={preferredEngine}
                onChange={(e) => setPreferredEngine(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#161d2b",
                  border: "1px solid #222f4c",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="Flux Schnell">FLUX.1 Schnell (Recommended · Unlimited Free)</option>
                <option value="SDXL Turbo">SDXL Turbo (Fast 1-step Diffusion)</option>
                <option value="Stable XL">Stable Diffusion XL (v1.0)</option>
              </select>
            </div>

            {/* Default Aspect Ratio */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>
                Default Aspect Ratio
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {["1:1", "16:9", "9:16"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDefaultRatio(r)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      border: defaultRatio === r ? "1px solid #00d4ff" : "1px solid #1e293b",
                      background: defaultRatio === r ? "rgba(0, 212, 255, 0.1)" : "#161d2b",
                      color: defaultRatio === r ? "#00d4ff" : "#94a3b8",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe Mode Filter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderTop: "1px solid #1e293b",
                borderBottom: "1px solid #1e293b",
                marginBottom: "24px",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
                  Safe Mode Active
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Automatically filters sensitive content from outputs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSafeMode(!safeMode)}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  background: safeMode ? "#00d4ff" : "#1e293b",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: safeMode ? "23px" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={() => {
                if (displayNameInput.trim()) {
                  updateProfile({ name: displayNameInput.trim() });
                }
                handleSaveSettings();
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "#00d4ff",
                border: "none",
                color: "#000000",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {savedNotice ? "✓ Profile & Preferences Saved!" : "Save Profile & Preferences"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
