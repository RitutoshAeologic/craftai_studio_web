'use client'

import React from "react";
import { Camera, Box, Sparkles, Zap, Film, Ban, Check } from "lucide-react";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

export interface ArtisticPreset {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  gradient: string;
  modifier: string;
}

export const ARTISTIC_PRESETS: ArtisticPreset[] = [
  {
    id: "realistic",
    name: "Realistic Photo",
    subtitle: "8K DSLR Optics",
    icon: Camera,
    gradient: "linear-gradient(135deg, #1e222d 0%, #11141c 100%)",
    modifier: "8k resolution, photorealistic, 85mm f/1.4 lens, Rembrandt studio lighting, fine skin textures, high fidelity DSLR photograph",
  },
  {
    id: "cartoon3d",
    name: "3D Cartoon",
    subtitle: "Cute Claymation",
    badge: "Pixar 3D",
    icon: Box,
    gradient: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)",
    modifier: "cute 3D cartoon style, Pixar 3D aesthetic, claymation render, smooth geometry, soft studio ambient occlusion, Blender octane render",
  },
  {
    id: "anime",
    name: "Anime / Manga",
    subtitle: "Makoto Shinkai",
    badge: "Anime",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    modifier: "Makoto Shinkai anime aesthetic, vibrant studio ghibli colors, hand-drawn anime key visual, volumetric light rays, 4k anime masterpiece",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    subtitle: "Neon Hologram",
    badge: "Cyber",
    icon: Zap,
    gradient: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
    modifier: "cyberpunk aesthetic, high-tech neon glow, reflective wet asphalt, volumetric rim lighting, futuristic holographic accents",
  },
  {
    id: "cinematic",
    name: "Cinematic Film",
    subtitle: "35mm Panavision",
    badge: "Film",
    icon: Film,
    gradient: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
    modifier: "cinematic still from 35mm film, anamorphic lens flare, moody color grading, Kodak Portra 400 grain, high dynamic range",
  },
  {
    id: "none",
    name: "Raw / Custom",
    subtitle: "Prompt As-Is",
    icon: Ban,
    gradient: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    modifier: "",
  },
];

interface Props {
  selectedPresetId: string;
  onSelectPreset: (preset: ArtisticPreset) => void;
  disabled?: boolean;
}

export default function ArtisticStylePresetBar({
  selectedPresetId,
  onSelectPreset,
  disabled = false,
}: Props) {
  const activePreset =
    ARTISTIC_PRESETS.find((p) => p.id === selectedPresetId) || ARTISTIC_PRESETS[0];

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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={14} style={{ color: S.cyan }} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Artistic Style Preset
          </span>
        </div>

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
          {activePreset.name}
        </span>
      </div>

      {/* Horizontal Carousel */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "6px",
          scrollbarWidth: "none",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        {ARTISTIC_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          const IconComponent = preset.icon;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              style={{
                flex: "0 0 135px",
                height: "82px",
                background: preset.gradient,
                border: isSelected ? `2px solid ${S.cyan}` : "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                cursor: "pointer",
                position: "relative",
                boxShadow: isSelected
                  ? "0 4px 16px rgba(0, 212, 255, 0.35), 0 0 0 1px rgba(0, 212, 255, 0.4)"
                  : "0 2px 8px rgba(0, 0, 0, 0.4)",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
            >
              {/* Top Row: Icon + Badge / Active Check */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <IconComponent size={13} />
                </div>

                {isSelected ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      background: S.cyan,
                      color: "#080c14",
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    <Check size={10} strokeWidth={3} />
                    <span>Active</span>
                  </div>
                ) : preset.badge ? (
                  <span
                    style={{
                      background: "rgba(0, 0, 0, 0.4)",
                      color: "#e2e8f0",
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      fontSize: "9px",
                      fontWeight: 600,
                    }}
                  >
                    {preset.badge}
                  </span>
                ) : null}
              </div>

              {/* Bottom: Name & Subtitle */}
              <div>
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "115px",
                  }}
                >
                  {preset.name}
                </div>
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "rgba(255, 255, 255, 0.75)",
                    lineHeight: 1.2,
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "115px",
                  }}
                >
                  {preset.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

