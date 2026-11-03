'use client'

import React from "react";
import { type AspectRatio } from "@/lib/api/generate";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

export interface AspectRatioOption {
  id: AspectRatio;
  name: string;
  subtitle: string;
  ratioLabel: string;
  iconWidth: number;
  iconHeight: number;
  dimensions: string;
}

export const ASPECT_OPTIONS: AspectRatioOption[] = [
  {
    id: "1:1",
    name: "Square",
    subtitle: "1:1 Post",
    ratioLabel: "Square (1:1)",
    iconWidth: 20,
    iconHeight: 20,
    dimensions: "1024×1024",
  },
  {
    id: "9:16",
    name: "Story",
    subtitle: "9:16 Reels",
    ratioLabel: "Story (9:16)",
    iconWidth: 14,
    iconHeight: 24,
    dimensions: "768×1344",
  },
  {
    id: "4:5",
    name: "Portrait",
    subtitle: "4:5 Feed",
    ratioLabel: "Portrait (4:5)",
    iconWidth: 16,
    iconHeight: 22,
    dimensions: "896×1120",
  },
  {
    id: "16:9",
    name: "Cinema",
    subtitle: "16:9 Wide",
    ratioLabel: "Cinema (16:9)",
    iconWidth: 26,
    iconHeight: 16,
    dimensions: "1344×768",
  },
];

interface Props {
  selectedRatioId: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

export default function AspectRatioFrameSelector({
  selectedRatioId,
  onSelectRatio,
  disabled = false,
}: Props) {
  const currentOption =
    ASPECT_OPTIONS.find((o) => o.id === selectedRatioId) || ASPECT_OPTIONS[0];

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Aspect Ratio &amp; Frame
        </span>

        <span
          style={{
            fontSize: "12px",
            color: S.cyan,
            fontWeight: 600,
            background: "rgba(0, 212, 255, 0.08)",
            padding: "2px 8px",
            borderRadius: "6px",
            border: "1px solid rgba(0, 212, 255, 0.2)",
          }}
        >
          {currentOption.ratioLabel}
        </span>
      </div>

      {/* 4-Card Selector Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        {ASPECT_OPTIONS.map((opt) => {
          const isSelected = opt.id === selectedRatioId;

          return (
            <button
              key={opt.id}
              onClick={() => onSelectRatio(opt.id)}
              style={{
                background: isSelected ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                border: isSelected ? `2px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                borderRadius: "12px",
                padding: "10px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 16px rgba(0, 212, 255, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {/* Aspect Ratio Box Icon */}
              <div
                style={{
                  width: `${opt.iconWidth}px`,
                  height: `${opt.iconHeight}px`,
                  borderRadius: "3px",
                  border: isSelected ? `2px solid ${S.cyan}` : "1.5px solid #94a3b8",
                  background: isSelected ? "rgba(0, 212, 255, 0.2)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              />

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? "#ffffff" : S.textPrimary,
                    lineHeight: 1.2,
                  }}
                >
                  {opt.name}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: isSelected ? S.cyan : S.textMuted,
                    lineHeight: 1.2,
                    marginTop: "2px",
                  }}
                >
                  {opt.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

