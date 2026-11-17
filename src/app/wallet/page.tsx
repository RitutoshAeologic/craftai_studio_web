'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Gift,
  History,
  Loader2,
} from "lucide-react";
import {
  fetchWallet,
  fetchCreditPackages,
  fetchWalletLedger,
  CANONICAL_CREDIT_PACKAGES,
  type Wallet,
  type CreditPackage,
  type WalletLedgerItem,
} from "@/lib/supabase/db";
import { useRazorpayCheckout } from "@/lib/hooks/useRazorpayCheckout";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

function formatLedgerDate(isoStr: string) {
  try {
    const d = new Date(isoStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
}

export default function WalletPage() {
  const { profile, user } = useUser();
  const { colors: S } = useTheme();
  const userKey = user?.id || profile.email || "default";

  const [wallet, setWallet] = useState<Wallet>({
    user_id: userKey,
    credits: 100,
    purchased_balance: 80,
    earned_royalty_balance: 20,
  });
  const [packages, setPackages] = useState<CreditPackage[]>(CANONICAL_CREDIT_PACKAGES);
  const [ledgerItems, setLedgerItems] = useState<WalletLedgerItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const { startCheckout, isProcessing } = useRazorpayCheckout();

  const loadAllData = async () => {
    try {
      const [w, pkgs, ledger] = await Promise.all([
        fetchWallet(userKey),
        fetchCreditPackages(),
        fetchWalletLedger(userKey),
      ]);
      setWallet(w);
      if (Array.isArray(pkgs) && pkgs.length > 0) setPackages(pkgs);
      if (Array.isArray(ledger)) setLedgerItems(ledger);
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleUpdate = () => {
      fetchWallet(userKey).then(setWallet);
      fetchWalletLedger(userKey).then(setLedgerItems);
    };
    window.addEventListener("craftai_wallet_updated", handleUpdate);
    return () => window.removeEventListener("craftai_wallet_updated", handleUpdate);
  }, [userKey]);

  const handlePurchase = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
    startCheckout(
      pkg,
      {
        id: user?.id || userKey,
        email: profile.email || "creator@craftai.studio",
        name: profile.name || "CraftAI Creator",
      },
      (res) => {
        setPurchaseSuccess(`Payment successful! +${totalCredits} Credits added to your balance.`);
        setTimeout(() => setPurchaseSuccess(null), 5000);
        loadAllData();
      },
      (err) => {
        console.warn("[Razorpay Checkout Failed]", err);
      }
    );
  };

  return (
    <div style={{ minHeight: "100%", background: S.background, display: "flex", flexDirection: "column", padding: "clamp(16px, 4vw, 36px)" }}>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: S.textPrimary, display: "flex", alignItems: "center", gap: "10px" }}>
            <Coins size={24} style={{ color: S.cyan }} />
            Wallet &amp; Credits Ledger
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: S.textSecondary }}>
            Manage your usable studio credits, track creator remix earnings, and top up via Razorpay.
          </p>
        </div>

        {/* ── Balance Card with Dual Breakdown (Purchased vs Earned Royalty) ── */}
        <div
          style={{
            background: S.isDark
              ? "linear-gradient(135deg, #121218 0%, #1e1e2e 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
            border: `1px solid ${S.borderLight}`,
            borderRadius: "18px",
            padding: "24px clamp(16px, 3vw, 28px)",
            boxShadow: S.isDark ? "0 12px 36px rgba(0,0,0,0.6)" : "0 12px 32px rgba(15, 23, 42, 0.08)",
            marginBottom: "32px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Main Balance */}
          <div>
            <span style={{ fontSize: "12px", color: S.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              Total Usable Credits
            </span>
            <div style={{ fontSize: "40px", fontWeight: 800, color: S.cyan, marginTop: "4px", display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span>{Number(wallet?.credits ?? 100).toFixed(1)}</span>
              <span style={{ fontSize: "16px", color: S.textMuted, fontWeight: 500 }}>Credits</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textMuted }}>
              ≈ ${(Number(wallet?.credits ?? 100) * 0.1).toFixed(2)} USD value
            </p>
          </div>

          {/* Purchased Balance */}
          <div
            style={{
              padding: "12px 16px",
              background: S.isDark ? "rgba(255,255,255,0.03)" : S.surfaceLight,
              borderRadius: "12px",
              border: `1px solid ${S.borderLight}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: S.primary, fontSize: "12px", fontWeight: 600 }}>
              <CreditCard size={14} />
              <span>Purchased Balance</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: S.textPrimary, marginTop: "4px" }}>
              {Number(wallet?.purchased_balance ?? 80).toFixed(1)} Cr
            </div>
            <span style={{ fontSize: "11px", color: S.textMuted, display: "block", marginTop: "2px" }}>
              Bought via Razorpay Gateway
            </span>
          </div>

          {/* Earned Royalty Balance */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(16, 185, 129, 0.08)",
              borderRadius: "12px",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: S.success, fontSize: "12px", fontWeight: 600 }}>
              <Sparkles size={14} />
              <span>Earned Royalty Balance</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: S.success, marginTop: "4px" }}>
              +{Number(wallet?.earned_royalty_balance ?? 20).toFixed(1)} Cr
            </div>
            <span style={{ fontSize: "11px", color: S.textMuted, display: "block", marginTop: "2px" }}>
              Community prompt remix earnings
            </span>
          </div>
        </div>

        {/* Purchase Success Toast */}
        {purchaseSuccess && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: S.success,
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{purchaseSuccess}</span>
          </div>
        )}

        {/* ── Top-Up Packages ─────────────────────────────────── */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: S.textPrimary, margin: 0 }}>
              Dynamic Razorpay Top-Up Packages
            </h2>
            <span style={{ fontSize: "12px", color: S.textMuted }}>
              Instant Atomic Credit Fulfillment
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {packages.map((pkg) => {
              const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
              const perCredit = (pkg.price_inr / totalCredits).toFixed(2);

              return (
                <div
                  key={pkg.id}
                  style={{
                    background: S.card,
                    border: pkg.is_popular ? `1.5px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    boxShadow: pkg.is_popular ? "0 8px 30px rgba(0, 212, 255, 0.18)" : "none",
                  }}
                >
                  {/* Popular Pill */}
                  {pkg.is_popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-11px",
                        right: "20px",
                        background: S.cyan,
                        color: "#000",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.textPrimary }}>
                        {pkg.name}
                      </h3>
                      <span style={{ fontSize: "11px", color: S.textMuted }}>₹{perCredit}/cr</span>
                    </div>

                    <div style={{ margin: "14px 0" }}>
                      <span style={{ fontSize: "30px", fontWeight: 800, color: S.textPrimary }}>
                        ₹{pkg.price_inr}
                      </span>
                      <span style={{ fontSize: "13px", color: S.textSecondary, marginLeft: "6px" }}>
                        / {totalCredits} Credits
                      </span>
                    </div>

                    {pkg.bonus_credits > 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: S.success,
                          padding: "3px 8px",
                          background: "rgba(16, 185, 129, 0.1)",
                          borderRadius: "6px",
                          marginBottom: "10px",
                          display: "inline-block",
                        }}
                      >
                        +{pkg.bonus_credits} Bonus Credits Included
                      </div>
                    )}

                    {pkg.badge && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: pkg.is_popular ? S.cyan : S.textSecondary,
                          padding: "4px 8px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "6px",
                          marginBottom: "16px",
                        }}
                      >
                        {pkg.badge}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={isProcessing}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "10px",
                      background: pkg.is_popular ? S.cyan : S.primary,
                      border: "none",
                      color: pkg.is_popular ? "#000000" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                      opacity: isProcessing ? 0.7 : 1,
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Connecting Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} />
                        <span>Get {totalCredits} Credits</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Transaction History / Wallet Passbook Ledger ──────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: S.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={16} style={{ color: S.textSecondary }} />
              Wallet Passbook &amp; Activity Ledger
            </h2>
            <span style={{ fontSize: "12px", color: S.textMuted }}>
              Audited by PostgreSQL Ledger
            </span>
          </div>

          <div
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {ledgerItems.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: S.textMuted, fontSize: "13px" }}>
                No wallet transactions recorded yet.
              </div>
            ) : (
              ledgerItems.map((item, idx) => {
                const isCredit = item.amount >= 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: idx === ledgerItems.length - 1 ? "none" : `1px solid ${S.borderLight}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: isCredit ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isCredit ? S.success : "#f87171",
                        }}
                      >
                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>

                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: S.textPrimary }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: "11px", color: S.textMuted }}>
                          {formatLedgerDate(item.created_at)} ·{" "}
                          <span style={{ color: S.textSecondary, textTransform: "capitalize" }}>
                            {item.event_type.replace(/_/g, " ")}
                          </span>
                          {item.reference_id && (
                            <span style={{ marginLeft: "6px", color: S.cyan }}>
                              • Ref: {item.reference_id.slice(0, 16)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: isCredit ? S.success : S.textPrimary,
                        }}
                      >
                        {isCredit ? `+${item.amount}` : `${item.amount}`} Cr
                      </div>
                      <div style={{ fontSize: "11px", color: S.textMuted }}>
                        Balance: {item.balance_after} Cr
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
