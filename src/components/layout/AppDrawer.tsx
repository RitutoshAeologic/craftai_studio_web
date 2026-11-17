'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";
import { useUser } from "@/context/UserContext";
import {
  Sparkles,
  LayoutGrid,
  Wand2,
  Plus,
  FolderHeart,
  Coins,
  Sliders,
  Bookmark,
  LogOut,
  User,
} from "lucide-react";
import { fetchWallet } from "@/lib/supabase/db";
import { useTheme } from "@/context/ThemeContext";

export default function AppDrawer() {
  const { profile, user, signOut } = useUser();
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [walletCredits, setWalletCredits] = useState(100);

  const userKey = user?.id || profile.email || "default";

  useEffect(() => {
    fetchWallet(userKey).then((w) => setWalletCredits(w.credits));

    const handleUpdate = () => {
      fetchWallet(userKey).then((w) => setWalletCredits(w.credits));
    };

    window.addEventListener("craftai_wallet_updated", handleUpdate);
    return () => {
      window.removeEventListener("craftai_wallet_updated", handleUpdate);
    };
  }, [userKey]);

  const navItems = [
    { href: "/explore", label: "Explore Community", icon: LayoutGrid },
    { href: "/library", label: "Generation History & Library", icon: FolderHeart },
    { href: "/saved", label: "Saved Gallery", icon: Bookmark },
    { href: "/tools", label: "Creative Tools", icon: Sliders },
    { href: "/wallet", label: `Credits & Wallet (${walletCredits} Cr)`, icon: Coins },
    { href: "/remix", label: "Remix Lab", icon: Wand2 },
  ];

  const isActive = (item: typeof navItems[0]) => {
    return pathname.startsWith(item.href);
  };

  return (
    <aside
      aria-label="Sidebar Navigation"
      style={{
        width: "68px",
        minWidth: "68px",
        height: "100vh",
        background: colors.background,
        borderRight: `1px solid ${colors.borderLight}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 40,
        position: "sticky",
        top: 0,
        left: 0,
        overflow: "hidden",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Header / Logo ──────────────────────────────── */}
      <div
        style={{
          width: "100%",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${colors.borderLight}`,
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          title="CraftAI Studio Home"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 14px rgba(0, 212, 255, 0.35)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.06)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")}
          >
            <Sparkles size={18} color="white" />
          </div>
        </Link>
      </div>

      {/* ── New Generation Action Button ────────────────────── */}
      <div style={{ padding: "14px 0 10px", width: "100%", display: "flex", justifyContent: "center" }}>
        <button
          id="drawer-new-gen-btn"
          onClick={() => router.push("/studio")}
          title="New Prompt Session (Studio)"
          style={{
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            background: "rgba(0, 212, 255, 0.08)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
            color: "#00d4ff",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 212, 255, 0.18)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 212, 255, 0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0, 212, 255, 0.3)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Main Navigation Icons ──────────────────────────── */}
      <nav
        style={{
          width: "100%",
          padding: "6px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          flex: 1,
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`drawer-nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              title={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                textDecoration: "none",
                background: active ? (colors.isDark ? "rgba(99, 102, 241, 0.18)" : "rgba(99, 102, 241, 0.12)") : "transparent",
                border: active ? `1px solid ${colors.primary}66` : "1px solid transparent",
                color: active ? colors.primary : colors.textSecondary,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = colors.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLAnchorElement).style.color = colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = colors.textSecondary;
                }
              }}
            >
              <Icon
                size={19}
                style={{
                  color: active ? colors.primary : colors.textSecondary,
                }}
              />
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom User Profile Avatar & Menu ───────────────── */}
      <div
        style={{
          width: "100%",
          padding: "12px 0 16px",
          borderTop: `1px solid ${colors.borderLight}`,
          display: "flex",
          justifyContent: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          title={`${profile.name} · ${walletCredits} Credits`}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            border: userMenuOpen ? "2px solid #00d4ff" : "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "white",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
        >
          {profile.initials}
        </button>

        {/* User Popover Menu */}
        {userMenuOpen && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              left: "76px",
              width: "200px",
              background: colors.surfaceElevated || colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "8px",
              boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
              zIndex: 99,
            }}
          >
            <div style={{ padding: "6px 10px 8px", borderBottom: `1px solid ${colors.borderLight}`, marginBottom: "4px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{profile.name}</div>
              <div style={{ fontSize: "11px", color: colors.primary, fontWeight: 600 }}>{walletCredits} Credits</div>
            </div>

            <Link
              href="/wallet"
              onClick={() => setUserMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                color: colors.textSecondary,
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = colors.isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
            >
              <Coins size={14} style={{ color: colors.primary }} />
              <span>Wallet &amp; Top-up</span>
            </Link>

            <Link
              href="/library"
              onClick={() => setUserMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                color: colors.textSecondary,
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = colors.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
            >
              <FolderHeart size={14} style={{ color: colors.purpleAccent || "#a5b4fc" }} />
              <span>Generation History</span>
            </Link>

            <button
              onClick={() => {
                setUserMenuOpen(false);
                signOut();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                marginTop: "4px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
