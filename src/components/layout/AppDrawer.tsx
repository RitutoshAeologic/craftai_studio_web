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
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Image as ImageIcon,
  LogOut,
  ChevronRight,
  FolderHeart,
  Coins,
  Sliders,
} from "lucide-react";
import { fetchGenerations, deleteGeneration, fetchWallet, type Generation } from "@/lib/supabase/db";

export default function AppDrawer() {
  const { isOpen, toggleDrawer, setIsOpen } = useDrawer();
  const { profile, user, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [walletCredits, setWalletCredits] = useState(100);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userKey = user?.id || profile.email || "default";

  useEffect(() => {
    // Load generation history associated with this user
    fetchGenerations(userKey).then(setGenerations);
    fetchWallet(userKey).then((w) => setWalletCredits(w.credits));

    const handleUpdate = () => {
      fetchGenerations(userKey).then(setGenerations);
      fetchWallet(userKey).then((w) => setWalletCredits(w.credits));
    };

    window.addEventListener("craftai_generations_updated", handleUpdate);
    window.addEventListener("craftai_wallet_updated", handleUpdate);
    return () => {
      window.removeEventListener("craftai_generations_updated", handleUpdate);
      window.removeEventListener("craftai_wallet_updated", handleUpdate);
    };
  }, [userKey]);

  const navItems = [
    { href: "/explore", label: "Explore Community", icon: LayoutGrid },
    { href: "/library", label: "Cloud Library", icon: FolderHeart },
    { href: "/tools", label: "Creative Tools", icon: Sliders },
    { href: "/wallet", label: "Credits & Wallet", icon: Coins },
    { href: "/remix", label: "Remix Lab", icon: Wand2 },
  ];

  const isActive = (item: typeof navItems[0]) => {
    return pathname.startsWith(item.href);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // On mobile, if drawer is closed, don't render or take space
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isOpen && (
        <div
          id="drawer-mobile-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 89,
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? "min(300px, 85vw)" : (isOpen ? "260px" : "68px"),
          minWidth: isMobile ? "auto" : (isOpen ? "260px" : "68px"),
          height: "100vh",
          background: "#0a0e18",
          borderRight: "1px solid #1e2533",
          display: "flex",
          flexDirection: "column",
          transition: isMobile ? "none" : "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: isMobile ? 90 : 40,
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          bottom: isMobile ? 0 : "auto",
          boxShadow: isMobile ? "0 0 50px rgba(0, 0, 0, 0.85)" : "none",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
      {/* ── Top Header of Drawer ───────────────────────────── */}
      <div
        style={{
          padding: isOpen ? "12px 16px" : "12px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: isOpen ? "space-between" : "center",
          borderBottom: "1px solid #161d2b",
          height: "56px",
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          title="CraftAI Studio"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 12px rgba(0, 212, 255, 0.3)",
            }}
          >
            <Sparkles size={16} color="white" />
          </div>
          {isOpen && (
            <span
              style={{
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              CraftAI Studio
            </span>
          )}
        </Link>

        {isOpen && (
          <button
            id="drawer-toggle-btn"
            onClick={toggleDrawer}
            title="Collapse Sidebar"
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
              flexShrink: 0,
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
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* ── New Generation CTA Button ──────────────────────── */}
      <div style={{ padding: isOpen ? "14px 14px 10px" : "14px 8px 10px" }}>
        <button
          id="drawer-new-gen-btn"
          onClick={() => {
            handleLinkClick();
            router.push("/");
          }}
          title="New Prompt Session"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "flex-start" : "center",
            gap: "10px",
            padding: isOpen ? "10px 14px" : "10px 0",
            borderRadius: "10px",
            background: "rgba(0, 212, 255, 0.08)",
            border: "1px solid rgba(0, 212, 255, 0.25)",
            color: "#00d4ff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 212, 255, 0.16)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0, 212, 255, 0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0, 212, 255, 0.25)";
          }}
        >
          <Plus size={16} style={{ flexShrink: 0 }} />
          {isOpen && <span>New Generation</span>}
        </button>
      </div>

      {/* ── Main Navigation Links ──────────────────────────── */}
      <nav style={{ padding: "0 10px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              id={`drawer-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              title={!isOpen ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: isOpen ? "10px 12px" : "10px 0",
                justifyContent: isOpen ? "flex-start" : "center",
                borderRadius: "8px",
                textDecoration: "none",
                background: active ? "rgba(79, 70, 229, 0.18)" : "transparent",
                border: active ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                color: active ? "#ffffff" : "#94a3b8",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
                }
              }}
            >
              <Icon
                size={17}
                style={{
                  color: active ? "#00d4ff" : "#64748b",
                  flexShrink: 0,
                }}
              />
              {isOpen && (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Recent Generations Section ─────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
        {isOpen && (
          <div
            style={{
              padding: "8px 6px 6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#475569",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <History size={12} />
            <span>Recent Generations</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {generations.length === 0 ? (
            isOpen ? (
              <div style={{ padding: "14px 10px", textAlign: "center", color: "#475569", fontSize: "12px", fontStyle: "italic" }}>
                No recent generations
              </div>
            ) : null
          ) : (
            generations.slice(0, 15).map((gen) => (
              <div
                key={gen.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
                  if (btn) btn.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
                  if (btn) btn.style.opacity = "0";
                }}
              >
                <button
                  onClick={() => {
                    handleLinkClick();
                    router.push(`/studio?prompt=${encodeURIComponent(gen.prompt)}&sessionId=${gen.id}`);
                  }}
                  title={gen.prompt}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: isOpen ? "8px 10px" : "8px 0",
                    justifyContent: isOpen ? "flex-start" : "center",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: "12px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#161d2b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {gen.image_url ? (
                      <img
                        src={gen.image_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon size={11} color="#64748b" />
                    )}
                  </div>
                  {isOpen && (
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        paddingRight: "24px",
                      }}
                    >
                      {gen.prompt}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <button
                    className="del-btn"
                    title="Remove from history"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Optimistic removal: remove immediately from UI
                      setGenerations((prev) => prev.filter((g) => g.id !== gen.id));
                      await deleteGeneration(gen.id, userKey);
                    }}
                    style={{
                      position: "absolute",
                      right: "4px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "4px",
                      color: "#f87171",
                      cursor: "pointer",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      opacity: 0,
                      transition: "opacity 0.15s, background 0.15s, color 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#ef4444";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(239, 68, 68, 0.15)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Bottom Profile Pill ────────────────────────────── */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid #161d2b",
          position: "relative",
        }}
      >
        <div
          onClick={() => {
            handleLinkClick();
            router.push("/profile");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px",
            borderRadius: "10px",
            cursor: "pointer",
            background: "transparent",
            transition: "all 0.15s",
            justifyContent: isOpen ? "flex-start" : "center",
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
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
          {isOpen && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap" }}>
                {profile.name}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}>
                Pro Creator · {walletCredits} Credits
              </p>
            </div>
          )}
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
              }}
              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* User Popover Menu */}
        {userMenuOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "10px",
              right: "10px",
              background: "#161d2f",
              border: "1px solid #2a3b5c",
              borderRadius: "12px",
              padding: "6px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
              zIndex: 50,
            }}
          >
            <Link
              href="/wallet"
              onClick={() => setUserMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                color: "#00d4ff",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,255,0.08)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
            >
              <Coins size={14} />
              Wallet ({walletCredits} Cr)
            </Link>
            <Link
              href="/profile"
              onClick={() => setUserMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
            >
              View Profile
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
                padding: "8px 12px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
