'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, PanelLeftOpen, LogOut, Palette } from "lucide-react";
import { useDrawer } from "@/context/DrawerContext";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

export default function TopBar() {
  const pathname = usePathname();
  const { isOpen, toggleDrawer } = useDrawer();
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
        {/* Left section: Drawer toggle (when collapsed) & Page Title / Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isOpen && (
            <button
              id="topbar-drawer-toggle"
              onClick={toggleDrawer}
              title="Expand Sidebar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #1e2533",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
                (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533";
                (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              }}
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                color: "#f1f5f9",
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
              <option value="defaultDark">Theme: Indigo (Default)</option>
              <option value="cyberpunk">Theme: Cyberpunk</option>
              <option value="obsidian">Theme: Obsidian</option>
            </select>
          </div>

          <button
            title="Notifications"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #1e2533",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#334155";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2533";
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
                color: "#e2e8f0",
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
