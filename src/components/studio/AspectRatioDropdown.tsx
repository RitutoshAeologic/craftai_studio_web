'use client'

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Crop } from "lucide-react";
import { type AspectRatio } from "@/lib/api/generate";
import { ASPECT_OPTIONS, type AspectRatioOption } from "./AspectRatioFrameSelector";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

interface Props {
  selectedRatioId: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

export default function AspectRatioDropdown({
  selectedRatioId,
  onSelectRatio,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    ASPECT_OPTIONS.find((o) => o.id === selectedRatioId) || ASPECT_OPTIONS[0];

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
        id="btn-aspect-ratio-dropdown"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        title="Choose Aspect Ratio & Frame"
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
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533";
          }
        }}
      >
        {/* Miniature frame shape preview */}
        <div
          style={{
            width: "14px",
            height: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${Math.min(14, (currentOption.iconWidth / 24) * 14)}px`,
              height: `${Math.min(14, (currentOption.iconHeight / 24) * 14)}px`,
              border: `1.5px solid ${S.cyan}`,
              borderRadius: "2px",
            }}
          />
        </div>

        <span>{currentOption.ratioLabel}</span>
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
            padding: "6px",
            zIndex: 1000,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 212, 255, 0.1)",
            minWidth: "220px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ padding: "6px 8px 4px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Aspect Ratio & Frame
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {ASPECT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedRatioId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelectRatio(option.id);
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
                        background: "rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(18, (option.iconWidth / 26) * 18)}px`,
                          height: `${Math.min(18, (option.iconHeight / 26) * 18)}px`,
                          border: isSelected ? `2px solid ${S.cyan}` : "1.5px solid #94a3b8",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: isSelected ? 700 : 500 }}>
                        {option.ratioLabel}
                      </div>
                      <div style={{ fontSize: "11px", color: S.textMuted }}>
                        {option.subtitle} • {option.dimensions}
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

