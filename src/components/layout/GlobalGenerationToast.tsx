'use client'

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useGeneration } from "@/context/GenerationContext";
import { theme } from "@/lib/theme/themeGuard";

const S = theme.colors;

export default function GlobalGenerationToast() {
  const router = useRouter();
  const { toastJob, dismissToast } = useGeneration();

  useEffect(() => {
    if (!toastJob) return;

    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      dismissToast();
    }, 8000);

    return () => clearTimeout(timer);
  }, [toastJob, dismissToast]);

  if (!toastJob) return null;

  const isSuccess = toastJob.status === "completed";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "420px",
        width: "calc(100vw - 40px)",
        background: "#0e111a",
        border: isSuccess ? `1.5px solid ${S.cyan}` : `1.5px solid ${S.error}`,
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(0, 212, 255, 0.2)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Thumbnail or Icon */}
      {isSuccess && toastJob.imageUrl ? (
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#161b26",
            border: `1px solid ${S.borderLight}`,
            flexShrink: 0,
          }}
        >
          <img
            src={toastJob.imageUrl}
            alt="Completed artwork"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: isSuccess ? S.success : S.error,
          }}
        >
          {isSuccess ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <Sparkles size={13} style={{ color: S.cyan }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
            {isSuccess ? "Artwork Ready! ✨" : "Generation Notice"}
          </span>
        </div>

        <p
          style={{
            margin: "0 0 8px",
            fontSize: "12px",
            color: S.textSecondary,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {isSuccess ? toastJob.prompt : toastJob.error || "Synthesis interrupted."}
        </p>

        {isSuccess && (
          <button
            onClick={() => {
              dismissToast();
              router.push(
                `/studio?prompt=${encodeURIComponent(toastJob.prompt)}&imageUrl=${encodeURIComponent(
                  toastJob.imageUrl || ""
                )}`
              );
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(0, 212, 255, 0.15)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              color: S.cyan,
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>Open in Studio</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={dismissToast}
        style={{
          background: "transparent",
          border: "none",
          color: S.textMuted,
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

