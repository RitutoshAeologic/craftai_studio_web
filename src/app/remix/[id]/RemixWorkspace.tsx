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
import { dispatchGeneration, subscribeGenerationProgress, uploadReferencePhoto } from "@/lib/api/backend-client";
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

function cleanBasePrompt(raw?: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  clean = clean.replace(/^Remix\s+of\s+"[^"]*":\s*/i, "");
  clean = clean.replace(/^Remix\s+of\s+[^:]*:\s*/i, "");
  clean = clean.replace(/^Remix:\s*/i, "");

  // Deduplicate comma-separated clauses if prompt was duplicated
  const parts = clean.split(/,\s*/);
  const seen = new Set<string>();
  const uniqueParts: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && !seen.has(lower)) {
      seen.add(lower);
      uniqueParts.push(trimmed);
    }
  }
  return uniqueParts.join(", ");
}

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

  const basePrompt = cleanBasePrompt(initialPrompt);
  const basePromptRef = useRef<string>(basePrompt);
  const accumulatedEditsRef = useRef<string[]>([]);
  const currentCanvasUrlRef = useRef<string>(referenceImage);
  // Always starts null so the source image being remixed is NEVER replaced in Recent Generations!
  const remixSessionId = useRef<string | null>(null);
  const sessionTitle = useRef<string>(
    basePrompt ? `Remix: ${basePrompt.slice(0, 32)}...` : ""
  );

  const [currentImgUrl, setCurrentImgUrl] = useState(referenceImage);
  const [viewingOriginal, setViewingOriginal] = useState(false);
  const [promptMod, setPromptMod] = useState("");
  const [styleWeight, setStyleWeight] = useState(0.55);
  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState("Synthesizing Image Remix...");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      content: basePrompt
        ? `Reference artwork locked: "${basePrompt.slice(0, 80)}${basePrompt.length > 80 ? "..." : ""}". Enter your modifications, choose quick presets below, or ask for specific adjustments.`
        : "Reference artwork locked as composition anchor. Enter your style modifications, choose quick presets below, or ask for specific lighting and texture tweaks.",
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
    const userInput = promptMod.trim();
    if (!userInput || generating) return;
    setGenerating(true);
    setPromptMod("");

    const userMsg: ChatMsg = { role: "user", content: userInput, time: "Just now" };
    setMessages((p) => [...p, userMsg]);
    if (isMobileOrTablet) {
      setActiveMobileTab("canvas");
    }

    // Accumulate modification turns so character/subject identity is never lost
    accumulatedEditsRef.current.push(userInput);

    const base = basePromptRef.current;
    const allEdits = accumulatedEditsRef.current.join(", ");
    let promptToSend = "";
    if (base) {
      promptToSend = `${base}, in the exact same visual rendering and artistic style as the reference image, with modifications: ${allEdits}, maintaining original character identity, subject consistency, and composition, ultra high quality, 8k resolution, masterpiece`;
    } else {
      promptToSend = `${allEdits}, in the exact same visual rendering and artistic style as the reference image, maintaining visual composition and character appearance, ultra high quality, 8k resolution, masterpiece`;
    }

    if (!sessionTitle.current) {
      sessionTitle.current = base
        ? `Remix: ${base.slice(0, 32)}...`
        : `Remix: ${userInput.slice(0, 32)}...`;
    }

    try {
      // Step A: Ensure reference image is an accessible HTTP URL (upload if base64)
      let resolvedRefUrl = currentCanvasUrlRef.current || referenceImage;
      if (resolvedRefUrl && resolvedRefUrl.startsWith("data:")) {
        try {
          const res = await fetch(resolvedRefUrl);
          const blob = await res.blob();
          const file = new File([blob], "remix_reference.png", { type: blob.type || "image/png" });
          const upRes = await uploadReferencePhoto(file);
          if (upRes?.url) {
            resolvedRefUrl = upRes.url;
            currentCanvasUrlRef.current = upRes.url;
          }
        } catch (upErr) {
          console.warn("Base64 reference upload notice:", upErr);
        }
      }

      setProgressMsg(`Analyzing visual anchor at ${Math.round(styleWeight * 100)}% weight...`);

      // Step B: Dispatch task to FastAPI backend with reference image and style weight
      const dispatchRes = await dispatchGeneration({
        prompt: promptToSend,
        reference_image_url: resolvedRefUrl,
        style_weight: styleWeight,
        model: "flux",
      });

      const taskId = dispatchRes.task_id;
      let finalUrl = dispatchRes.direct_image_url;

      // Step C: Stream realtime generation progress
      await new Promise<void>((resolve) => {
        const unsubscribe = subscribeGenerationProgress(
          taskId,
          (event) => {
            if (event.message) setProgressMsg(event.message);
            if (event.output_url) finalUrl = event.output_url;
          },
          (outputUrl) => {
            if (outputUrl) finalUrl = outputUrl;
            unsubscribe();
            setTimeout(resolve, 300);
          },
          () => {
            unsubscribe();
            resolve();
          }
        );

        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 30000);
      });

      // Step D: Fallback to direct client generation if needed
      if (!finalUrl) {
        finalUrl = await generateFreeImage({
          prompt: promptToSend,
          model: "flux",
          aspectRatio: "1:1",
          referenceImage: resolvedRefUrl && resolvedRefUrl.startsWith("http") ? resolvedRefUrl : undefined,
        });
      }

      const cleanUrl = await stripWatermark(finalUrl);
      setCurrentImgUrl(cleanUrl);
      currentCanvasUrlRef.current = cleanUrl;

      // Step E: Save or update single entity for this remix chat session in Recent Generations
      const saved = await saveGeneration({
        prompt: sessionTitle.current,
        image_url: cleanUrl,
        model: "Flux Schnell (Remix)",
        aspect_ratio: "1:1",
        user_id: user?.id,
        user_email: profile.email,
        type: "REMIX",
      }, userKey, remixSessionId.current);

      if (saved?.id) {
        remixSessionId.current = saved.id;
      }

      const aiReply: ChatMsg = {
        role: "ai",
        content: `Remix generated with FLUX.1 engine (Anchor Weight: ${Math.round(styleWeight * 100)}%). Variation preserved in this session.`,
        time: "Just now",
      };
      setMessages((p) => [...p, aiReply]);
    } catch (err: any) {
      console.warn("Remix generation error:", err);
      const aiReply: ChatMsg = {
        role: "ai",
        content: "Remix synthesis failed. Please try a different prompt or check connectivity.",
        time: "Just now",
      };
      setMessages((p) => [...p, aiReply]);
    } finally {
      setGenerating(false);
      setProgressMsg("Synthesizing Image Remix...");
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
                {progressMsg}
              </p>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                Anchor preservation active ({Math.round(styleWeight * 100)}%) · High fidelity diffusion
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
                src={(viewingOriginal ? referenceImage : currentImgUrl) || "/sample-art.jpg"}
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

              {/* Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(8px)",
                  border: viewingOriginal ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(0,212,255,0.3)",
                  fontSize: "11px",
                  color: viewingOriginal ? "#c084fc" : "#00d4ff",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Layers size={11} />
                <span>{viewingOriginal ? "Original Reference Artwork" : "Active Remix Canvas"}</span>
              </div>

              {/* Switch / Compare Toggle between Original and Remix */}
              {currentImgUrl && currentImgUrl !== referenceImage && (
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(10,14,24,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    padding: "2px",
                    gap: "2px",
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewingOriginal(false)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: !viewingOriginal ? "rgba(0,212,255,0.2)" : "transparent",
                      color: !viewingOriginal ? "#00d4ff" : "#94a3b8",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    Remix Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingOriginal(true)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: viewingOriginal ? "rgba(168,85,247,0.25)" : "transparent",
                      color: viewingOriginal ? "#c084fc" : "#94a3b8",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    Original Reference
                  </button>
                </div>
              )}
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
                  onClick={() => {
                    const cleanMod = mod.replace(/^\+\s*/, "");
                    setPromptMod((prev) => (prev.trim() ? `${prev.trim()}, ${cleanMod}` : cleanMod));
                  }}
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
              placeholder={
                basePromptRef.current
                  ? "Describe what to modify (e.g. Add a person behind, change lighting, anime style)..."
                  : "Describe what to change in the reference image..."
              }
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
