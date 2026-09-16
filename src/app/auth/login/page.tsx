'use client'

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Sparkles, AlertCircle, X, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthNoticeProvider, setOauthNoticeProvider] = useState<"google" | "github" | null>(null);

  const supabase = createClient();

  function handleDemoLogin() {
    router.push("/studio");
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/studio");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function proceedOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    setOauthNoticeProvider(null);
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured. Please add your credentials to .env.local");
      setOauthLoading(null);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/studio` },
    });
  }

  function handleOAuth(provider: "google" | "github") {
    setOauthNoticeProvider(provider);
  }

  return (
    <>
      {/* Logo above card */}
      <div className="mb-8">
        <Logo size="lg" href="/studio" />
      </div>

      {/* Glassmorphic card */}
      <div
        className="w-full max-w-[440px] rounded-2xl top-accent-border animate-fade-in-up"
        style={{
          background: "#151d2f",
          border: "1px solid #222f4c",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,242,254,0.05)",
          padding: "40px 36px",
        }}
      >
        {/* Card Header */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-outfit, Outfit, sans-serif)" }}
          >
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Sign in to your AI Creator Workspace
          </p>
        </div>

        {/* 1-Click Instant Demo Login CTA */}
        <button
          id="demo-login-btn"
          type="button"
          onClick={handleDemoLogin}
          style={{
            width: "100%",
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(99, 102, 241, 0.2) 100%)",
            border: "1px solid rgba(0, 212, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#00d4ff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 25px rgba(0, 212, 255, 0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0, 212, 255, 0.4)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.2)";
          }}
        >
          <Sparkles size={16} style={{ color: "#00d4ff" }} />
          <span>⚡ 1-Click Demo Login (Alex Rivera)</span>
        </button>

        {/* Error Banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* Social OAuth buttons */}
        <div style={{
          marginBottom: "24px",
          padding: "16px",
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "12px",
        }}>
          <div className="flex flex-col gap-3">
            {/* Google */}
            <button
              id="login-google-btn"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 btn-ghost"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* GitHub */}
            <button
              id="login-github-btn"
              onClick={() => handleOAuth("github")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 btn-ghost"
            >
              {oauthLoading === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-label mb-6">or continue with email</div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#475569" }} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium" style={{ color: "#94a3b8" }}>
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs transition-colors duration-150"
                style={{ color: "#00f2fe" }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#475569" }} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full pl-10 pr-10 py-3 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
                style={{ color: "#475569" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-cyan w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold transition-colors duration-150"
            style={{ color: "#00f2fe" }}
          >
            Create one free
          </Link>
        </p>
      </div>

      {/* OAuth Setup Guidance Modal */}
      {oauthNoticeProvider && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "460px",
            background: "#161d2f",
            border: "1px solid #2a3b5c",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            position: "relative",
          }}>
            <button
              onClick={() => setOauthNoticeProvider(null)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "transparent", border: "none", color: "#94a3b8",
                cursor: "pointer", padding: "4px",
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertCircle size={20} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                  {oauthNoticeProvider === "google" ? "Google" : "GitHub"} OAuth Setup Notice
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                  Supabase Project: txiuwtrmfvceddqsjvhk
                </p>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "16px" }}>
              Social login with {oauthNoticeProvider === "google" ? "Google" : "GitHub"} requires enabling the provider in your Supabase Auth Console and providing client credentials.
            </p>

            <div style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid #222f4c",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
              fontSize: "12px",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#e2e8f0" }}>To enable real {oauthNoticeProvider}:</p>
              <ol style={{ margin: 0, paddingLeft: "18px" }}>
                <li>Open your Supabase Authentication dashboard</li>
                <li>Go to <strong>Providers &rarr; {oauthNoticeProvider === "google" ? "Google" : "GitHub"}</strong></li>
                <li>Enable provider and enter Client ID &amp; Secret</li>
              </ol>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#00d4ff",
                  border: "none",
                  color: "#000000",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 0 20px rgba(0,212,255,0.4)",
                }}
              >
                <Sparkles size={14} />
                Instant Demo Access as Alex Rivera
              </button>

              <button
                type="button"
                onClick={() => proceedOAuth(oauthNoticeProvider)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid #334155",
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Proceed to OAuth URL anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
