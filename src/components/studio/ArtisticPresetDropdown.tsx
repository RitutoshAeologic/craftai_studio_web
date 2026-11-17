'use client'

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import { ARTISTIC_PRESETS, type ArtisticPreset } from "./ArtisticStylePresetBar";
import { theme } from "@/lib/theme/themeGuard";
import { useTheme } from "@/context/ThemeContext";

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
  const { colors: S } = useTheme();
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
          background: selectedPresetId !== "none" ? (S.isDark ? "rgba(0, 212, 255, 0.12)" : "rgba(6, 182, 212, 0.12)") : S.surface,
          border: selectedPresetId !== "none" ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
          color: selectedPresetId !== "none" ? S.cyan : S.textSecondary,
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
              selectedPresetId !== "none" ? S.cyan : S.borderLight;
          }
        }}
      >
        <Sparkles size={13} style={{ color: selectedPresetId !== "none" ? S.cyan : S.textMuted }} />
        <span>{activePreset.name}</span>
        <ChevronDown size={13} style={{ color: S.textSecondary, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: S.surfaceElevated || S.surface,
            border: `1px solid ${S.borderLight}`,
            borderRadius: "14px",
            padding: "6px",
            zIndex: 1000,
            boxShadow: S.isDark
              ? "0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 212, 255, 0.1)"
              : "0 16px 40px rgba(15, 23, 42, 0.15)",
            minWidth: "230px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ padding: "6px 8px 4px", fontSize: "11px", fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                    background: isSelected ? (S.isDark ? "rgba(0, 212, 255, 0.15)" : "rgba(99, 102, 241, 0.12)") : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isSelected ? S.primary : S.textPrimary,
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = S.surfaceLight;
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

