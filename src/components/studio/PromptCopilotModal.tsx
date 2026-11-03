'use client'

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Zap,
  Cpu,
  Brain,
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
} from "lucide-react";
import { compileChatDelta, type ChatDeltaResponse } from "@/lib/api/backend-client";
import { safeUUID } from "@/lib/utils/uuid";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

interface CopilotMessage {
  id: string;
  role: "user" | "copilot";
  text: string;
  timestamp: string;
  addedTags?: string[];
  removedTags?: string[];
  suggestedChips?: string[];
  modelUsed?: string;
}

const AI_ENGINES = [
  { id: "groq", label: "⚡ Groq LPU <0.8s" },
  { id: "gemini", label: "♊ Gemini 2.5 Creative" },
  { id: "claude", label: "🧠 Claude 3.5 Sonnet" },
  { id: "local", label: "🖥️ Local Offline" },
];

const QUICK_ACTION_CHIPS = [
  { label: "Change Background", prompt: "change background to misty snow mountains with dramatic rim lighting" },
  { label: "Change Theme", prompt: "change visual theme to cyberpunk neon aesthetic" },
  { label: "Studio Lighting", prompt: "apply Rembrandt dramatic studio lighting with volumetric soft rim glow" },
  { label: "Upscale 4K", prompt: "enhance with ultra-fine 4k textures, 85mm lens sharpness, masterpiece" },
];

const DEFAULT_SUGGESTION_CHIPS = [
  "Add Heavy Rain",
  "Moody Low-Key",
  "35mm Cinematic Lens",
  "Volumetric Smoke",
  "Golden Hour Rays",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  onApplyPrompt: (refinedPrompt: string) => void;
  onGenerateNow: (refinedPrompt: string) => void;
}

export default function PromptCopilotModal({
  isOpen,
  onClose,
  initialPrompt,
  onApplyPrompt,
  onGenerateNow,
}: Props) {
  const [activeBasePrompt, setActiveBasePrompt] = useState(initialPrompt || "Cinematic visual masterpiece");
  const [selectedEngine, setSelectedEngine] = useState("gemini");
  const [turnCount, setTurnCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}_${safeUUID().slice(0, 6)}`);
  const [suggestionChips, setSuggestionChips] = useState<string[]>(DEFAULT_SUGGESTION_CHIPS);

  const [messages, setMessages] = useState<CopilotMessage[]>(() => [
    {
      id: "msg_welcome",
      role: "copilot",
      text: initialPrompt.trim()
        ? "Active prompt loaded. Tell me what to modify (e.g. 'add rain', 'make it darker'), or tap a quick chip."
        : "Hello! Tell me what changes you want to make, or tap any 1-click action chip below.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedChips: DEFAULT_SUGGESTION_CHIPS,
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync initial prompt when modal opens
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setActiveBasePrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  async function handleSend(instructionToSend?: string) {
    const cleanInstruction = (instructionToSend || inputText).trim();
    if (!cleanInstruction || isLoading) return;

    if (turnCount >= 5) {
      alert("Refinement turn cap reached (5/5 turns). Please click 'Generate Now' or 'Use in Studio' to continue.");
      return;
    }

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    setInputText("");

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add user message
    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: cleanInstruction,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response: ChatDeltaResponse = await compileChatDelta({
        base_prompt: activeBasePrompt,
        user_instruction: cleanInstruction,
        turn_count: nextTurn,
        ai_model: selectedEngine,
        session_id: sessionId,
      });

      if (response && response.compiled_prompt) {
        setActiveBasePrompt(response.compiled_prompt);

        if (response.suggested_chips && response.suggested_chips.length > 0) {
          setSuggestionChips(response.suggested_chips);
        }

        const copilotMsg: CopilotMessage = {
          id: `copilot_${Date.now()}`,
          role: "copilot",
          text: `Prompt refined via ${response.model_used || selectedEngine}:\n\n"${response.compiled_prompt}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          addedTags: response.diff?.added,
          removedTags: response.diff?.removed,
          suggestedChips: response.suggested_chips,
          modelUsed: response.model_used,
        };

        setMessages((prev) => [...prev, copilotMsg]);
      }
    } catch (err: any) {
      console.error("[PromptCopilotModal] Refinement error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "copilot",
          text: `Refinement error: ${err?.message || "Delta compiler timed out"}. Please retry.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 3vw, 24px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0f17",
          border: `1.5px solid ${S.borderLight}`,
          borderRadius: "20px",
          width: "min(680px, 98vw)",
          height: "min(840px, 92vh)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 212, 255, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* ── TOP HEADER ── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${S.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#090c12",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${S.borderLight}`,
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: S.textSecondary,
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={16} style={{ color: S.cyan }} />
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Prompt Copilot
                </h2>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: S.textSecondary }}>
                Conversational Refinement Mode
              </p>
            </div>
          </div>

          {/* Turn Count Badge (0/5 Refines) */}
          <div
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              background: turnCount >= 5 ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 212, 255, 0.12)",
              border: turnCount >= 5 ? "1px solid rgba(239, 68, 68, 0.4)" : `1px solid rgba(0, 212, 255, 0.3)`,
              color: turnCount >= 5 ? "#ef4444" : S.cyan,
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {turnCount}/5 Refines
          </div>
        </div>

        {/* ── ACTIVE BASE PROMPT PINNED CARD ── */}
        <div style={{ padding: "14px 20px 10px", background: "#0c0f17", borderBottom: `1px solid ${S.borderLight}` }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${S.borderLight}`,
              borderRadius: "12px",
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              Active Base Prompt
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#f1f5f9",
                lineHeight: 1.45,
                maxHeight: "68px",
                overflowY: "auto",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              {activeBasePrompt}
            </p>
          </div>

          {/* AI Engine Switcher Pills */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginTop: "10px", paddingBottom: "2px" }}>
            {AI_ENGINES.map((eng) => {
              const isSelected = selectedEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => setSelectedEngine(eng.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: isSelected ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                    background: isSelected ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? S.cyan : S.textSecondary,
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {eng.label}
                </button>
              );
            })}
          </div>

          {/* Quick Action Chips Row */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginTop: "8px", paddingBottom: "2px" }}>
            {QUICK_ACTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSend(chip.prompt)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  border: `1px solid ${S.borderLight}`,
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
                  (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight;
                  (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1";
                }}
              >
                + {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CHAT MESSAGE STREAM ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isUser ? "#1e293b" : "rgba(0, 212, 255, 0.06)",
                    border: isUser ? "1px solid #334155" : `1px solid rgba(0, 212, 255, 0.25)`,
                    color: isUser ? "#ffffff" : "#e2e8f0",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>

                  {/* Diff Badges */}
                  {(msg.addedTags || msg.removedTags) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                      {msg.addedTags?.map((tag, i) => (
                        <span
                          key={`add_${i}`}
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(16, 185, 129, 0.18)",
                            color: S.success,
                            fontWeight: 600,
                          }}
                        >
                          + {tag}
                        </span>
                      ))}
                      {msg.removedTags?.map((tag, i) => (
                        <span
                          key={`rem_${i}`}
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(239, 68, 68, 0.18)",
                            color: S.error,
                            fontWeight: 600,
                          }}
                        >
                          - {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Quick Chips */}
                  {msg.suggestedChips && msg.suggestedChips.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
                      {msg.suggestedChips.map((chip, i) => (
                        <button
                          key={i}
                          disabled={isLoading}
                          onClick={() => handleSend(chip)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            background: "rgba(99, 102, 241, 0.18)",
                            border: "1px solid rgba(99, 102, 241, 0.35)",
                            color: "#c7d2fe",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: "10px", color: S.textMuted }}>
                  {isUser ? "You" : "Copilot"} • {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: S.cyan, fontSize: "12px", padding: "8px 0" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${S.cyan}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <span>Refining prompt via {selectedEngine}...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── BOTTOM INPUT & ACTION FOOTER ── */}
        <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${S.borderLight}`, background: "#090c12" }}>
          {/* Quick Suggestion Pills Bar */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "10px", paddingBottom: "2px" }}>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSend(chip)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${S.borderLight}`,
                  color: "#cbd5e1",
                  fontSize: "11px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#121622",
              border: `1px solid ${S.borderLight}`,
              borderRadius: "12px",
              padding: "4px 8px 4px 14px",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              value={inputText}
              disabled={isLoading || turnCount >= 5}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={turnCount >= 5 ? "Refinement cap reached. Click Generate Now!" : 'e.g. "rain add karo, lighting dark karo"'}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "13px",
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim() || turnCount >= 5}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: inputText.trim() ? S.cyan : "rgba(255, 255, 255, 0.05)",
                border: "none",
                color: inputText.trim() ? "#080c14" : S.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputText.trim() ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              <Send size={14} />
            </button>
          </div>

          {/* Action Hand-off Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={() => {
                onApplyPrompt(activeBasePrompt);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.06)",
                border: `1px solid ${S.borderLight}`,
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = S.borderLight)}
            >
              <span>← Use in Studio</span>
            </button>

            <button
              onClick={() => {
                onGenerateNow(activeBasePrompt);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
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
              <Sparkles size={14} />
              <span>✨ Generate Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

