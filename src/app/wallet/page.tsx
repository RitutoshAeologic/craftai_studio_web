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
} from "lucide-react";
import { fetchWallet, topUpCredits, type Wallet } from "@/lib/supabase/db";
import { useUser } from "@/context/UserContext";

const S = {
  bg:          "#0b0b0f",
  card:        "#121218",
  cardBorder:  "#1e1e2a",
  borderLight: "#2e2e3e",
  cyan:        "#00d4ff",
  primary:     "#6366f1",
  primaryDark: "#4f46e5",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted:   "#64748b",
  success:     "#10b981",
  purple:      "#a855f7",
};

interface Transaction {
  id: string;
  type: "debit" | "credit";
  amount: number;
  description: string;
  timestamp: string;
  badge: string;
}

export default function WalletPage() {
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";

  const [wallet, setWallet] = useState<Wallet>({
    user_id: userKey,
    credits: 100,
    purchased_balance: 80,
    earned_royalty_balance: 20,
  });
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx-1",
      type: "credit",
      amount: 40,
      description: "Creator Royalty Payout — Community Remixes",
      timestamp: "Today, 4:15 PM",
      badge: "Creator Royalty",
    },
    {
      id: "tx-2",
      type: "debit",
      amount: 2,
      description: "Lossless 4K Master Export Unlocked",
      timestamp: "Yesterday, 8:20 PM",
      badge: "4K Paywall",
    },
    {
      id: "tx-3",
      type: "debit",
      amount: 1,
      description: "FLUX.1 Schnell Generation Dispatch",
      timestamp: "Yesterday, 3:10 PM",
      badge: "Image Gen",
    },
    {
      id: "tx-4",
      type: "credit",
      amount: 50,
      description: "Starter Credit Pack Purchase",
      timestamp: "Sep 12, 2026",
      badge: "Stripe Checkout",
    },
  ]);

  useEffect(() => {
    fetchWallet(userKey).then(setWallet);
  }, [userKey]);

  const packages = [
    {
      id: "starter",
      title: "Starter Pack",
      credits: 50,
      price: "$4.99",
      perCredit: "$0.10 / credit",
      popular: false,
      badge: "Great for Beginners",
    },
    {
      id: "pro",
      title: "Pro Creator",
      credits: 200,
      price: "$14.99",
      perCredit: "$0.07 / credit",
      popular: true,
      badge: "Most Popular • 25% Off",
    },
    {
      id: "studio",
      title: "Studio Master",
      credits: 500,
      price: "$29.99",
      perCredit: "$0.06 / credit",
      popular: false,
      badge: "Best Value • 40% Off",
    },
  ];

  const handlePurchase = async (pkg: typeof packages[0]) => {
    setPurchasing(pkg.id);
    // Simulate instant checkout / Stripe webhook credit
    setTimeout(async () => {
      const updated = await topUpCredits(pkg.credits, userKey);
      setWallet(updated);

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "credit",
          amount: pkg.credits,
          description: `${pkg.title} Purchase (${pkg.price})`,
          timestamp: "Just now",
          badge: "Stripe Checkout",
        },
        ...prev,
      ]);

      setPurchasing(null);
      setPurchaseSuccess(`Successfully added +${pkg.credits} Credits to your wallet!`);
      setTimeout(() => setPurchaseSuccess(null), 4000);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100%", background: S.bg, display: "flex", flexDirection: "column", padding: "clamp(16px, 4vw, 36px)" }}>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: S.textPrimary, display: "flex", alignItems: "center", gap: "10px" }}>
            <Coins size={24} style={{ color: S.cyan }} />
            Wallet &amp; Credits Ledger
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: S.textSecondary }}>
            Manage your usable studio credits, track creator remix earnings, and top up safely.
          </p>
        </div>

        {/* ── Balance Card with Dual Breakdown (Purchased vs Earned Royalty) ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #121218 0%, #1e1e2e 100%)",
            border: `1px solid ${S.borderLight}`,
            borderRadius: "18px",
            padding: "24px clamp(16px, 3vw, 28px)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
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
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: `1px solid ${S.cardBorder}`,
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
              Bought via Stripe Checkout
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
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: S.textPrimary, marginBottom: "14px" }}>
            Top-Up Credit Packages
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  background: S.card,
                  border: pkg.popular ? `1.5px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: pkg.popular ? "0 8px 30px rgba(0, 212, 255, 0.18)" : "none",
                }}
              >
                {/* Popular Pill */}
                {pkg.popular && (
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
                    Popular
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.textPrimary }}>
                      {pkg.title}
                    </h3>
                    <span style={{ fontSize: "11px", color: S.textMuted }}>{pkg.perCredit}</span>
                  </div>

                  <div style={{ margin: "14px 0" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, color: S.textPrimary }}>
                      {pkg.price}
                    </span>
                    <span style={{ fontSize: "13px", color: S.textSecondary, marginLeft: "6px" }}>
                      / {pkg.credits} Credits
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: pkg.popular ? S.cyan : S.textSecondary,
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {pkg.badge}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={Boolean(purchasing)}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    background: pkg.popular ? S.cyan : S.primary,
                    border: "none",
                    color: pkg.popular ? "#000000" : "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: purchasing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s",
                  }}
                >
                  <CreditCard size={14} />
                  <span>{purchasing === pkg.id ? "Processing..." : `Get ${pkg.credits} Credits`}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction History ─────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: S.textPrimary, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={16} style={{ color: S.textSecondary }} />
            Recent Activity &amp; Royalty Earnings
          </h2>

          <div
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: idx === transactions.length - 1 ? "none" : `1px solid ${S.borderLight}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: tx.type === "credit" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: tx.type === "credit" ? S.success : "#f87171",
                    }}
                  >
                    {tx.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: S.textPrimary }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: "11px", color: S.textMuted }}>
                      {tx.timestamp} · <span style={{ color: S.textSecondary }}>{tx.badge}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: tx.type === "credit" ? S.success : S.textPrimary,
                  }}
                >
                  {tx.type === "credit" ? `+${tx.amount}` : `-${tx.amount}`} Cr
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
