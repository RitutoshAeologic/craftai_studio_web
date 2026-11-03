'use client'

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Zap, X } from "lucide-react";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

export const STYLE_BOOSTERS = [
  { label: "Cinematic Lighting", icon: "✨", modifier: "cinematic dramatic lighting, volumetric rim light" },
  { label: "Photorealistic 8K", icon: "📸", modifier: "8k photorealistic, raw camera optics, highly detailed" },
  { label: "Cyberpunk Neon", icon: "🌆", modifier: "cyberpunk neon glow, wet reflections, synthwave palette" },
  { label: "Studio Ghibli Anime", icon: "🎨", modifier: "studio ghibli aesthetic, anime hand-painted visual" },
  { label: "Octane 3D Render", icon: "⚡", modifier: "octane 3D render, smooth raytracing, subsurface scattering" },
  { label: "Volumetric Fog", icon: "🌫️", modifier: "volumetric atmospheric fog, god rays, depth of field" },
  { label: "Unreal Engine 5", icon: "🎮", modifier: "unreal engine 5 lumen lighting, hyper-detailed textures" },
  { label: "Holographic Glow", icon: "🔮", modifier: "iridescent holographic glow, translucent crystal shards" },
];

interface Props {
  activeBoosters: string[];
  onToggleBooster: (boosterLabel: string) => void;
  onClearBoosters?: () => void;
  disabled?: boolean;
}

export default function StyleBoostersDropdown({
  activeBoosters,
  onToggleBooster,
  onClearBoosters,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCount = activeBoosters.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        id="btn-style-boosters-dropdown"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Style Boosters"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "9999px",
          background: activeCount > 0 ? "rgba(234, 179, 8, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: activeCount > 0 ? "1px solid rgba(234, 179, 8, 0.4)" : "1px solid #1e2533",
          color: activeCount > 0 ? "#facc15" : "#cbd5e1",
          fontSize: "12px",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#facc15";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              activeCount > 0 ? "rgba(234, 179, 8, 0.4)" : "#1e2533";
          }
        }}
      >
        <Zap size={13} style={{ color: activeCount > 0 ? "#facc15" : "#94a3b8" }} />
        <span>Boosters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <ChevronDown
          size={13}
          style={{
            color: S.textSecondary,
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: "#121722",
            border: "1px solid #222f4c",
            borderRadius: "14px",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(234, 179, 8, 0.15)",
            minWidth: "250px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px 8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Style Boosters {activeCount > 0 && `(${activeCount} Active)`}
            </span>
            {activeCount > 0 && onClearBoosters && (
              <button
                type="button"
                onClick={onClearBoosters}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: 0,
                }}
              >
                <X size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {STYLE_BOOSTERS.map((booster) => {
              const isApplied = activeBoosters.includes(booster.label);

              return (
                <button
                  key={booster.label}
                  type="button"
                  onClick={() => onToggleBooster(booster.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: isApplied ? "rgba(234, 179, 8, 0.12)" : "transparent",
                    border: isApplied ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isApplied ? "#fef08a" : "#cbd5e1",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isApplied) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isApplied) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{booster.icon}</span>
                    <span style={{ fontSize: "12.5px", fontWeight: isApplied ? 600 : 500 }}>
                      {booster.label}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: isApplied ? "1px solid #facc15" : "1px solid #475569",
                      background: isApplied ? "#facc15" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#000",
                    }}
                  >
                    {isApplied && <Check size={11} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

