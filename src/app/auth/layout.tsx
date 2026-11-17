'use client'

import type { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { colors, preset, setPreset } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-grid"
      style={{
        background: colors.background,
        color: colors.textPrimary,
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Top right theme switcher pill */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <Palette size={14} style={{ color: colors.primary }} />
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as any)}
          title="Theme Selector"
          style={{
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: "8px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="obsidian">Theme: Deep Obsidian (Dark)</option>
          <option value="aurora">Theme: Luminous Aurora (Light)</option>
          <option value="defaultDark">Theme: Cosmic Indigo (Default)</option>
          <option value="cyberpunk">Theme: Cyberpunk Neon</option>
        </select>
      </div>

      {/* Ambient glow orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: colors.isDark
            ? "radial-gradient(circle, rgba(0,242,254,0.06) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: colors.isDark
            ? "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
