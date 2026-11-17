'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Palette } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

export default function TopBar() {
  const pathname = usePathname();
  const { profile, signOut } = useUser();
  const { colors, preset, setPreset } = useTheme();

  const getPageTitle = () => {
    if (pathname === "/") return "AI Chat Workspace";
    if (pathname.startsWith("/studio")) return "Studio · Prompt Master";
    if (pathname.startsWith("/explore")) return "Explore Gallery";
    if (pathname.startsWith("/remix")) return "Remix Lab";
    if (pathname.startsWith("/profile")) return "Creator Profile";
    return "";
  };

  return (
    <header
      style={{
        background: colors.background,
        borderBottom: `1px solid ${colors.borderLight}`,
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "0 20px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left section: Page Title / Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                color: colors.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* Right Section — Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Theme Guard Preset Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Palette size={14} style={{ color: colors.primary }} />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as any)}
              title="Theme Guard: Change system-wide theme palette"
              style={{
                background: colors.surfaceLight,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                fontSize: "11px",
                fontWeight: 600,
                padding: "5px 8px",
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

          <button
            title="Notifications"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "transparent",
              border: `1px solid ${colors.borderLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: colors.textMuted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = colors.textPrimary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted;
              (e.currentTarget as HTMLButtonElement).style.borderColor = colors.borderLight;
            }}
          >
            <Bell size={15} />
          </button>

          <Link
            href="/profile"
            id="topbar-user-profile-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {profile.initials}
            </div>
            <span
              className="topbar-user-name"
              style={{
                color: colors.textPrimary,
                fontSize: "13px",
                fontWeight: 500,
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile.name}
            </span>
          </Link>

          <button
            id="topbar-signout-btn"
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm("Are you sure you want to sign out?")) {
                signOut();
              }
            }}
            title="Sign Out of CraftAI Studio"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "32px",
              padding: "0 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#f87171",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239, 68, 68, 0.18)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239, 68, 68, 0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239, 68, 68, 0.25)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
