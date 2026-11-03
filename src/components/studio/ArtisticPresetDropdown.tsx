'use client'

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import { ARTISTIC_PRESETS, type ArtisticPreset } from "./ArtisticStylePresetBar";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

interface Props {
  selectedPresetId: string;
  onSelectPreset: (preset: ArtisticPreset) => void;
  disabled?: boolean;
}

export default function ArtisticPresetDropdown({
  selectedPresetId,
  onSelectPreset,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePreset =
    ARTISTIC_PRESETS.find((p) => p.id === selectedPresetId) || ARTISTIC_PRESETS[0];
  const IconComponent = activePreset.icon;

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
        id="btn-artistic-preset-dropdown"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        title="Choose Artistic Style Preset"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "9999px",
          background: selectedPresetId !== "none" ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: selectedPresetId !== "none" ? "1px solid rgba(0, 212, 255, 0.35)" : "1px solid #1e2533",
          color: selectedPresetId !== "none" ? S.cyan : "#cbd5e1",
          fontSize: "12px",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = S.cyan;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              selectedPresetId !== "none" ? "rgba(0, 212, 255, 0.35)" : "#1e2533";
          }
        }}
      >
        <Sparkles size={13} style={{ color: selectedPresetId !== "none" ? S.cyan : "#94a3b8" }} />
        <span>{activePreset.name}</span>
        <ChevronDown size={13} style={{ color: S.textSecondary, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }} />
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
            padding: "6px",
            zIndex: 1000,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 212, 255, 0.1)",
            minWidth: "230px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ padding: "6px 8px 4px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Artistic Style Presets
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {ARTISTIC_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              const ItemIcon = preset.icon;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: isSelected ? "rgba(0, 212, 255, 0.12)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isSelected ? "#ffffff" : "#cbd5e1",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: preset.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ItemIcon size={14} style={{ color: "#ffffff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: isSelected ? 700 : 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{preset.name}</span>
                        {preset.badge && (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.15)",
                              color: "#f1f5f9",
                            }}
                          >
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: S.textMuted }}>
                        {preset.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={14} style={{ color: S.cyan, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

