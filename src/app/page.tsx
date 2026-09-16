'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowUp,
  Image as ImageIcon,
  PenTool,
  Globe,
  Paperclip,
  Wand2,
  Cpu
} from "lucide-react";
import { saveGeneration } from "@/lib/supabase/db";

const QUICK_PROMPTS = [
  {
    icon: ImageIcon,
    label: "Create an image or sticker",
    prompt: "high quality vector sticker of a cute cybernetic red panda astronaut, holographic outline, vibrant colors",
  },
  {
    icon: Sparkles,
    label: "Surreal cosmic monolith landscape",
    prompt: "surreal cosmic landscape, glowing iridescent nebula clouds, glowing geometric obsidian monolith centered, reflections on dark water",
  },
  {
    icon: PenTool,
    label: "Cyberpunk samurai neon warrior",
    prompt: "cyberpunk warrior dark armor glowing neon eyes futuristic tokyo city night rain reflections 8k",
  },
  {
    icon: Globe,
    label: "Ghibli anime cottage on green hills",
    prompt: "storybook countryside cottage rolling green hills fluffy summer clouds studio ghibli anime aesthetic watercolor",
  },
];

const ENGINES = [
  { id: "flux", label: "Flux Schnell" },
  { id: "turbo", label: "SDXL Turbo" },
  { id: "sdxl", label: "Stable XL" },
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [engine, setEngine] = useState(ENGINES[0]);
  const [engineMenuOpen, setEngineMenuOpen] = useState(false);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(selectedPrompt?: string) {
    const textToUse = selectedPrompt || prompt;
    if (!textToUse.trim() || submitting) return;

    setSubmitting(true);
    // Seamlessly transition to Studio with prompt query parameter
    router.push(`/studio?prompt=${encodeURIComponent(textToUse.trim())}&engine=${engine.id}&autoGen=true`);
  }

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(20px, 4vw, 40px) clamp(14px, 3vw, 24px) 60px",
        position: "relative",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(600px, 90vw)",
          height: "350px",
          background: "radial-gradient(ellipse, rgba(0, 212, 255, 0.05) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Center Main Content */}
      <div style={{ width: "100%", maxWidth: "720px", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Headline matching ChatGPT style */}
        <h1
          style={{
            fontSize: "clamp(22px, 4.5vw, 36px)",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: "clamp(20px, 3vw, 32px)",
            fontFamily: "var(--font-outfit, Outfit, sans-serif)",
          }}
        >
          What would you like to create today?
        </h1>

        {/* Central Input Pill Bar */}
        <div
          style={{
            width: "100%",
            background: "#161d2b",
            border: "1px solid #222f4c",
            borderRadius: "20px",
            padding: "12px 14px 10px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 212, 255, 0.08)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Text input row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <textarea
              id="home-prompt-input"
              rows={2}
              value={prompt}
              disabled={submitting}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={submitting ? "Opening studio and generating artwork..." : "Ask anything or describe the artwork you want to create..."}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: submitting ? "#64748b" : "#f1f5f9",
                fontSize: "14px",
                lineHeight: "1.5",
                resize: "none",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                padding: "4px 0",
                cursor: submitting ? "not-allowed" : "text",
              }}
            />
          </div>

          {/* Bottom control pills row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Engine Selector Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setEngineMenuOpen(!engineMenuOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid #1e2533",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533"}
                >
                  <Cpu size={13} style={{ color: "#00d4ff" }} />
                  <span>{engine.label}</span>
                </button>

                {engineMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: 0,
                      background: "#161d2b",
                      border: "1px solid #222f4c",
                      borderRadius: "12px",
                      overflow: "hidden",
                      zIndex: 100,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                      minWidth: "150px",
                    }}
                  >
                    {ENGINES.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setEngine(e);
                          setEngineMenuOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 14px",
                          background: engine.id === e.id ? "rgba(0, 212, 255, 0.1)" : "transparent",
                          color: engine.id === e.id ? "#00d4ff" : "#cbd5e1",
                          border: "none",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Enhance Toggle Pill */}
              <button
                type="button"
                onClick={() => setAutoEnhance(!autoEnhance)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  background: autoEnhance ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  border: autoEnhance ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid #1e2533",
                  color: autoEnhance ? "#818cf8" : "#64748b",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Wand2 size={13} />
                <span>Auto-Enhance {autoEnhance ? "On" : "Off"}</span>
              </button>
            </div>

            {/* Submit Arrow Button */}
            <button
              id="home-submit-btn"
              type="button"
              onClick={() => handleSubmit()}
              disabled={!prompt.trim() || submitting}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: prompt.trim() && !submitting ? "#00d4ff" : "#1e2533",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: prompt.trim() && !submitting ? "pointer" : "not-allowed",
                color: prompt.trim() && !submitting ? "#000000" : "#64748b",
                transition: "all 0.15s",
                boxShadow: prompt.trim() && !submitting ? "0 0 16px rgba(0, 212, 255, 0.4)" : "none",
              }}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Quick Action Prompt Chips (Matching ChatGPT Screenshot) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
            gap: "10px",
            marginTop: "24px",
          }}
        >
          {QUICK_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                id={`chip-${idx}`}
                type="button"
                onClick={() => {
                  setPrompt(item.prompt);
                  handleSubmit(item.prompt);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: "#111827",
                  border: "1px solid #1e2533",
                  color: "#cbd5e1",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
                  (e.currentTarget as HTMLButtonElement).style.background = "#161d2b";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533";
                  (e.currentTarget as HTMLButtonElement).style.background = "#111827";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(0, 212, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} style={{ color: "#00d4ff" }} />
                </div>
                <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
