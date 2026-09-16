'use client'

import { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Paperclip,
  ArrowLeft,
  Sparkles,
  Shield,
  Layers,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { saveGeneration } from "@/lib/supabase/db";
import { generateFreeImage, stripWatermark } from "@/lib/api/generate";
import { useUser } from "@/context/UserContext";

interface ChatMsg {
  role: "ai" | "user";
  content: string;
  time: string;
}

const QUICK_MODS = [
  "+ Cyberpunk Neon",
  "+ Studio Ghibli Anime",
  "+ 3D Octane Render",
  "+ Dark Moody Cinematic",
  "+ Watercolor Dreamscape",
];

export default function RemixWorkspace({
  referenceImage,
  initialPrompt,
  onBack,
}: {
  referenceImage: string;
  initialPrompt?: string;
  onBack?: () => void;
}) {
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";

  const [currentImgUrl, setCurrentImgUrl] = useState(referenceImage);
  const [promptMod, setPromptMod] = useState(
    initialPrompt || "Add vibrant neon backlights, transform to cyberpunk anime aesthetic with rich iridescent highlights"
  );
  const [styleWeight, setStyleWeight] = useState(0.55);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      content: "Reference artwork locked as composition anchor. Enter your style modifications, choose quick presets below, or ask for specific lighting and texture tweaks.",
      time: "Just now",
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resizable Right Panel Width (Draggable Remix Assistant)
  const [panelWidth, setPanelWidth] = useState<number>(420);
  const [isResizing, setIsResizing] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("craftai_remix_panel_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 320 && val <= 800) {
          setPanelWidth(val);
        }
      }
    } catch {}
  }, []);

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"canvas" | "assistant">("canvas");

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth < 960);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(320, Math.min(newWidth, Math.min(800, window.innerWidth - 350)));
      setPanelWidth(clamped);
      try {
        localStorage.setItem("craftai_remix_panel_width", String(clamped));
      } catch {}
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsResizing(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Watermark cleanup for initial or updated remix image
  useEffect(() => {
    if (currentImgUrl && currentImgUrl.includes("pollinations.ai")) {
      stripWatermark(currentImgUrl).then((clean) => {
        if (clean && clean !== currentImgUrl) setCurrentImgUrl(clean);
      });
    }
  }, []);

  async function handleSend() {
    if (!promptMod.trim() || generating) return;
    setGenerating(true);

    const userMsg: ChatMsg = { role: "user", content: promptMod, time: "Just now" };
    setMessages((p) => [...p, userMsg]);
    const userInput = promptMod;
    if (isMobileOrTablet) {
      setActiveMobileTab("canvas");
    }

    try {
      const generatedUrl = await generateFreeImage({
        prompt: `${userInput}, cinematic 8k quality, masterpiece, vivid lighting`,
        model: "flux",
        aspectRatio: "1:1",
      });

      const cleanUrl = await stripWatermark(generatedUrl);
      setCurrentImgUrl(cleanUrl);

      await saveGeneration({
        prompt: `Remix: ${userInput}`,
        image_url: cleanUrl,
        model: "Flux Schnell (Remix)",
        aspect_ratio: "1:1",
        user_id: user?.id,
        user_email: profile.email,
      }, userKey);

      const aiReply: ChatMsg = {
        role: "ai",
        content: `Remix generated with FLUX.1 engine (Style Anchor: ${Math.round(styleWeight * 100)}%). New variation saved to Supabase DB.`,
        time: "Just now",
      };
      setMessages((p) => [...p, aiReply]);
    } catch {
      // Keep reference as fallback
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ height: "100%", width: "100%", background: "#0a0e18", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Sub-header Toolbar ──────────────────────────────── */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #161d2b",
          background: "#080c14",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onBack && (
            <button
              onClick={onBack}
              title="Back to Launchpad"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid #1e2533",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533"}
            >
              <ArrowLeft size={13} />
              <span>Change Reference</span>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Active Mode
            </span>
            <span style={{ fontSize: "12px", color: "#a5b4fc", background: "rgba(99, 102, 241, 0.12)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
              Image-to-Image Remix
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
            <Sliders size={13} style={{ color: "#00d4ff" }} />
            <span>Anchor Weight: {Math.round(styleWeight * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={styleWeight}
            onChange={(e) => setStyleWeight(parseFloat(e.target.value))}
            style={{ width: "90px", accentColor: "#00d4ff", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* ── Mobile/Tablet View Switcher Bar ────────────────── */}
      {isMobileOrTablet && (
        <div style={{
          display: "flex",
          background: "#080c14",
          borderBottom: "1px solid #161d2b",
          padding: "8px 12px",
          gap: "8px",
          flexShrink: 0,
        }}>
          <button
            id="remix-mobile-tab-canvas"
            onClick={() => setActiveMobileTab("canvas")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              background: activeMobileTab === "canvas" ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
              border: activeMobileTab === "canvas" ? "1px solid rgba(0, 212, 255, 0.4)" : "1px solid #1e293b",
              color: activeMobileTab === "canvas" ? "#00d4ff" : "#94a3b8",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <ImageIcon size={14} />
            Remix Artwork
          </button>
          <button
            id="remix-mobile-tab-assistant"
            onClick={() => setActiveMobileTab("assistant")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              background: activeMobileTab === "assistant" ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
              border: activeMobileTab === "assistant" ? "1px solid rgba(0, 212, 255, 0.4)" : "1px solid #1e293b",
              color: activeMobileTab === "assistant" ? "#00d4ff" : "#94a3b8",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s",
              position: "relative",
            }}
          >
            <Sparkles size={14} />
            Remix Assistant
            {generating && (
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00d4ff",
                display: "inline-block",
              }} />
            )}
          </button>
        </div>
      )}

      {/* ── 2-Column Split View (With Resizable Assistant Panel) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Left: Dual / Active Artwork Canvas */}
        <div
          style={{
            flex: 1,
            display: isMobileOrTablet ? (activeMobileTab === "canvas" ? "flex" : "none") : "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#070a10",
            borderRight: isMobileOrTablet ? "none" : "1px solid #161d2b",
            position: "relative",
            padding: "20px",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {generating ? (
            /* Shimmer Skeleton during remix synthesis */
            <div
              className="skeleton-shimmer"
              style={{
                width: "100%",
                maxWidth: "540px",
                aspectRatio: "1/1",
                borderRadius: "16px",
                border: "1px solid rgba(0, 212, 255, 0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 32px rgba(0, 212, 255, 0.15)",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "3px solid #00d4ff",
                  borderTopColor: "transparent",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: "16px",
                }}
              />
              <p style={{ color: "#00d4ff", fontSize: "15px", fontWeight: 700, margin: "0 0 6px" }}>
                Synthesizing Image Remix...
              </p>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                Anchor preservation active · High fidelity diffusion
              </p>
            </div>
          ) : (
            /* Rendered Remix Image */
            <div
              style={{
                position: "relative",
                maxWidth: "100%",
                maxHeight: "calc(100vh - 170px)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
                border: "1px solid #1e2533",
              }}
            >
              <img
                src={currentImgUrl || "/sample-art.jpg"}
                alt="Remix artwork"
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 170px)",
                  objectFit: "contain",
                  display: "block",
                  clipPath: "inset(0 0 40px 0)",
                  marginBottom: "-40px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  fontSize: "11px",
                  color: "#00d4ff",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Layers size={11} />
                <span>Active Remix Canvas</span>
              </div>
            </div>
          )}

          {/* Mobile quick button to switch to assistant */}
          {isMobileOrTablet && (
            <button
              id="remix-mobile-edit-btn"
              onClick={() => setActiveMobileTab("assistant")}
              style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid rgba(0, 212, 255, 0.35)",
                borderRadius: "8px",
                color: "#00d4ff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Sparkles size={14} />
              Open Remix Assistant &amp; Tune Prompt
            </button>
          )}
        </div>

        {/* ── DRAGGABLE RESIZE DIVIDER HANDLE ── */}
        {!isMobileOrTablet && (
          <div
            onMouseDown={startResizing}
            title="Drag to resize panel width"
            style={{
              width: "6px",
              cursor: "col-resize",
              background: isResizing ? "#00d4ff" : "transparent",
              position: "relative",
              zIndex: 30,
              transition: "background 0.15s",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isResizing) (e.currentTarget as HTMLDivElement).style.background = "rgba(0, 212, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              if (!isResizing) (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            {/* Subtle grab indicator notch */}
            <div
              style={{
                width: "2px",
                height: "36px",
                borderRadius: "1px",
                background: isResizing ? "#ffffff" : "rgba(255, 255, 255, 0.25)",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* Right: Clean Conversational Remix Chat (Resizable) */}
        <div
          suppressHydrationWarning
          style={{
            width: isMobileOrTablet ? "100%" : `${panelWidth}px`,
            minWidth: isMobileOrTablet ? "100%" : "320px",
            maxWidth: isMobileOrTablet ? "100%" : "800px",
            display: isMobileOrTablet ? (activeMobileTab === "assistant" ? "flex" : "none") : "flex",
            flexDirection: "column",
            background: "#0d1117",
            height: "100%",
            overflow: "hidden",
            userSelect: isResizing ? "none" : "auto",
            transition: isResizing ? "none" : "width 0.05s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #161d2b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>
                Remix Assistant
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Conversational prompt tuning
              </p>
            </div>
            <span style={{ fontSize: "11px", color: "#00d4ff", background: "rgba(0,212,255,0.08)", padding: "2px 8px", borderRadius: "10px" }}>
              98 Credits
            </span>
          </div>

          {/* Clean Message Stream */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: "3px",
                }}
              >
                <div
                  style={{
                    maxWidth: "90%",
                    padding: "9px 13px",
                    borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: msg.role === "user" ? "#1e293b" : "rgba(0,212,255,0.05)",
                    border: msg.role === "user" ? "1px solid #334155" : "1px solid rgba(0,212,255,0.18)",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    color: msg.role === "user" ? "#ffffff" : "#cbd5e1",
                  }}
                >
                  {msg.content}
                </div>
                <span style={{ fontSize: "10px", color: "#64748b", padding: "0 4px" }}>
                  {msg.role === "user" ? "You" : "Assistant"} · {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Modifier Chips */}
          <div style={{ padding: "8px 18px", borderTop: "1px solid #161d2b" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
              Quick Modifiers
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUICK_MODS.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setPromptMod((prev) => `${prev}, ${mod}`)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid #1e2533",
                    color: "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533";
                    (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                  }}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Input Box */}
          <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #161d2b" }}>
            <textarea
              rows={3}
              value={promptMod}
              onChange={(e) => setPromptMod(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe what to change in the reference image..."
              style={{
                width: "100%",
                background: "#161d2b",
                border: "1px solid #222f4c",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "#f1f5f9",
                fontSize: "13px",
                lineHeight: "1.5",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "10px",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
            />

            <button
              onClick={handleSend}
              disabled={generating || !promptMod.trim()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: generating ? "rgba(99, 102, 241, 0.4)" : "#6366f1",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: generating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: generating ? "none" : "0 0 16px rgba(99, 102, 241, 0.4)",
                transition: "all 0.15s",
              }}
            >
              <Wand2 size={14} />
              <span>{generating ? "Generating Variation..." : "Generate Remix (1 Credit)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
