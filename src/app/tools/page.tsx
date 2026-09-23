'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wand2,
  Scissors,
  SunMedium,
  Maximize2,
  Upload,
  Download,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Split,
  Eye,
  RefreshCw,
  Sun,
  Camera,
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
  Box,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { RelightPresetId } from "@/lib/utils/image-processing";
import { useUser } from "@/context/UserContext";
import { toolsApi, type ToolHistoryItem, type BaseToolResponse } from "@/lib/api/toolsApi";
import { ToolHistoryModal } from "@/components/tools/ToolHistoryModal";

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

type ToolTab =
  | "cutout"
  | "ai_background"
  | "ai_expand"
  | "upscale"
  | "product_detail"
  | "marketing_poster"
  | "relight";

const RELIGHT_PRESETS: {
  id: RelightPresetId;
  label: string;
  icon: string;
  desc: string;
  filter: string;
  badge: string;
}[] = [
  {
    id: "golden_hour",
    label: "Golden Hour Sunset",
    icon: "🌅",
    desc: "Warm amber sun flare and soft skin tones",
    filter: "brightness(1.06) contrast(1.08) saturate(1.28) sepia(0.2)",
    badge: "Warm 3200K Sunset Flare",
  },
  {
    id: "studio_neon",
    label: "Studio Cyber Neon",
    icon: "🌆",
    desc: "Vibrant cyan & magenta dual-rim highlights",
    filter: "contrast(1.22) saturate(1.3) brightness(0.96)",
    badge: "Dual Cyan/Magenta Rim",
  },
  {
    id: "rim_light",
    label: "Dramatic Rim Light",
    icon: "⚡",
    desc: "High-contrast edge separation for subjects",
    filter: "contrast(1.3) brightness(0.9)",
    badge: "Chiaroscuro Silhouette",
  },
  {
    id: "soft_bokeh",
    label: "85mm Portrait Bokeh",
    icon: "📸",
    desc: "Ultra-shallow depth of field blur & light discs",
    filter: "contrast(1.05) saturate(1.1)",
    badge: "85mm f/1.4 Lens Blur",
  },
];

/* ── Optical Lighting & Atmospheric Overlays (Zero-Token, Zero-CORS, 60fps) ── */
function OpticalLightingOverlay({
  preset,
  intensity = 0.85,
}: {
  preset: RelightPresetId;
  intensity?: number;
}) {
  if (preset === "golden_hour") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: intensity }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255, 175, 45, 0.45) 0%, rgba(255, 110, 20, 0.25) 50%, rgba(180, 50, 0, 0.12) 100%)",
            mixBlendMode: "color-burn",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 18% 14%, rgba(255, 255, 230, 0.88) 0%, rgba(255, 190, 60, 0.5) 25%, rgba(255, 120, 30, 0.25) 50%, transparent 75%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 180, 50, 0.22)",
            mixBlendMode: "soft-light",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(255, 215, 0, 0.35) 0%, transparent 28%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    );
  }

  if (preset === "studio_neon") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: intensity }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, transparent 35%, rgba(10, 5, 25, 0.75) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0, 229, 255, 0.72) 0%, rgba(0, 229, 255, 0.35) 16%, transparent 40%, transparent 60%, rgba(255, 0, 128, 0.35) 84%, rgba(255, 0, 128, 0.72) 100%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0, 180, 255, 0.35) 0%, transparent 25%, transparent 75%, rgba(230, 0, 110, 0.35) 100%)",
            mixBlendMode: "color-dodge",
          }}
        />
      </div>
    );
  }

  if (preset === "rim_light") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: intensity }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(5, 5, 10, 0.85) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.15) 10%, transparent 22%, transparent 78%, rgba(255, 255, 255, 0.15) 90%, rgba(255, 255, 255, 0.6) 100%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    );
  }

  if (preset === "soft_bokeh") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: intensity }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            maskImage: "radial-gradient(circle at 50% 48%, transparent 28%, black 72%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 48%, transparent 28%, black 72%)",
          }}
        />
      </div>
    );
  }

  return null;
}

function ToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryImage = searchParams.get("image");
  const queryAction = searchParams.get("action");
  const { user, profile } = useUser();

  const parseInitialTab = (): ToolTab => {
    if (queryAction === "ai_background" || queryAction === "background") return "ai_background";
    if (queryAction === "ai_expand" || queryAction === "expand") return "ai_expand";
    if (queryAction === "upscale") return "upscale";
    if (queryAction === "product_detail" || queryAction === "product") return "product_detail";
    if (queryAction === "marketing_poster" || queryAction === "poster") return "marketing_poster";
    if (queryAction === "relight") return "relight";
    return "cutout";
  };

  const [activeTab, setActiveTab] = useState<ToolTab>(parseInitialTab);

  // Source & Result Image States
  const [sourceImage, setSourceImage] = useState<string>(
    queryImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
  );
  const [cutoutOutput, setCutoutOutput] = useState<string | null>(null);
  const [toolOutput, setToolOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"slider" | "result" | "original">("slider");
  const [sliderPos, setSliderPos] = useState<number>(50);

  // AI Backgrounds State
  const [bgMode, setBgMode] = useState<"pure_white" | "smart" | "custom">("pure_white");
  const [customBackdrop, setCustomBackdrop] = useState<string>("Modern concrete podium with soft morning sunlight");
  const [bgRatio, setBgRatio] = useState<string>("1:1");
  const [bgQuality, setBgQuality] = useState<"1k" | "2k">("1k");

  // AI Expand State
  const [expandRatio, setExpandRatio] = useState<string>("16:9");
  const [expandQuality, setExpandQuality] = useState<"1k" | "2k">("1k");

  // Upscale State
  const [upscaleScale, setUpscaleScale] = useState<2 | 4>(2);
  const [isUpscaleActive, setIsUpscaleActive] = useState<boolean>(true);

  // Product Detail State
  const [productName, setProductName] = useState<string>("Minimalist Chrono Watch");
  const [prodRatio, setProdRatio] = useState<string>("4:5");
  const [prodLang, setProdLang] = useState<string>("English");

  // Marketing Poster State
  const [posterTopic, setPosterTopic] = useState<string>("Summer Cold Brew Iced Coffee Launch");
  const [posterHeadline, setPosterHeadline] = useState<string>("Cold. Bold. Refreshing.");
  const [posterCategory, setPosterCategory] = useState<string>("Commercial");
  const [posterRatio, setPosterRatio] = useState<string>("9:16");
  const [posterQuality, setPosterQuality] = useState<"1k" | "2k">("1k");

  // Relight States
  const [selectedRelightPreset, setSelectedRelightPreset] = useState<RelightPresetId>("golden_hour");
  const [relightIntensity, setRelightIntensity] = useState<number>(85);
  const [isRelightActive, setIsRelightActive] = useState<boolean>(true);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<ToolHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Auto-generate cutout for initial demo image so comparison slider works immediately
  useEffect(() => {
    let isMounted = true;
    if (!cutoutOutput && sourceImage && sourceImage.includes("unsplash.com")) {
      toolsApi.removeBackground(sourceImage, user?.id)
        .then((res) => {
          if (isMounted && res?.cutout_url && res.cutout_url !== sourceImage) {
            setCutoutOutput(res.cutout_url);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Dragging of Comparison Slider with Sub-Pixel Precision
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(Math.round(pct * 10) / 10);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handleSliderMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      handleSliderMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setCutoutOutput(null);
      setToolOutput(null);
      setErrorMessage(null);
      setViewMode("slider");
      setSliderPos(50);
    };
    reader.readAsDataURL(file);
  };

  // Open Tool History Modal
  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
      const items = await toolsApi.getHistory(user?.id || profile.email || "default", undefined, 20, 0);
      setHistoryItems(items);
      setHasMoreHistory(items.length >= 20);
    } catch (e) {
      console.warn("Failed to load history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load next paginated page of history
  const handleLoadMoreHistory = async () => {
    if (isLoadingHistory || !hasMoreHistory) return;
    setIsLoadingHistory(true);
    try {
      const offset = historyItems.length;
      const nextBatch = await toolsApi.getHistory(user?.id || profile.email || "default", undefined, 20, offset);
      if (nextBatch.length < 20) {
        setHasMoreHistory(false);
      }
      setHistoryItems((prev) => [...prev, ...nextBatch]);
    } catch (e) {
      console.warn("Failed to load more history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /* ── Unified Tool Execution Handler ────────────────────────── */
  const handleExecuteActiveTool = async () => {
    if (!sourceImage || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let res: BaseToolResponse;

      if (activeTab === "cutout") {
        res = await toolsApi.removeBackground(sourceImage, user?.id);
        const url = res.cutout_url || res.output_url || res.image_url;
        setCutoutOutput(url);
        setToolOutput(url);
        setViewMode("result");
      } else if (activeTab === "ai_background") {
        res = await toolsApi.generateAiBackground({
          imageUrl: sourceImage,
          mode: bgMode,
          customBackdrop: bgMode === "custom" ? customBackdrop : undefined,
          aspectRatio: bgRatio,
          quality: bgQuality,
          userId: user?.id,
        });
        const url = res.output_url || res.image_url;
        setToolOutput(url);
        setViewMode("slider");
        setSliderPos(50);
      } else if (activeTab === "ai_expand") {
        res = await toolsApi.expandImage({
          imageUrl: sourceImage,
          targetRatio: expandRatio,
          quality: expandQuality,
          userId: user?.id,
        });
        const url = res.output_url || res.image_url;
        setToolOutput(url);
        setViewMode("slider");
        setSliderPos(50);
      } else if (activeTab === "upscale") {
        res = await toolsApi.upscaleImage({
          imageUrl: sourceImage,
          scaleFactor: upscaleScale,
          userId: user?.id,
        });
        const url = res.output_url || res.image_url;
        setToolOutput(url);
        setIsUpscaleActive(true);
        setViewMode("slider");
        setSliderPos(50);
      } else if (activeTab === "product_detail") {
        res = await toolsApi.generateProductDetail({
          imageUrl: sourceImage,
          productName: productName.trim() || "Commercial Product",
          aspectRatio: prodRatio,
          language: prodLang,
          userId: user?.id,
        });
        const url = res.output_url || res.image_url;
        setToolOutput(url);
        setViewMode("result");
      } else if (activeTab === "marketing_poster") {
        res = await toolsApi.generateMarketingPoster({
          imageUrl: sourceImage,
          topic: posterTopic.trim() || "Promotional Launch",
          category: posterCategory,
          headline: posterHeadline.trim() || undefined,
          aspectRatio: posterRatio,
          quality: posterQuality,
          userId: user?.id,
        });
        const url = res.output_url || res.image_url;
        setToolOutput(url);
        setViewMode("result");
      }

      if (res! && res!.credits_deducted > 0) {
        window.dispatchEvent(new Event("craftai_wallet_updated"));
      }
    } catch (err: any) {
      console.error("Tool execution error:", err);
      setErrorMessage(err?.message || "Tool processing failed. Please check network or try a different image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Trigger
  const triggerDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    const ext = `${activeTab}.png`;
    a.download = `craftai-${ext}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activePresetObj = RELIGHT_PRESETS.find(p => p.id === selectedRelightPreset);

  const currentOutput =
    activeTab === "cutout"
      ? cutoutOutput
      : activeTab === "relight"
      ? sourceImage
      : toolOutput || sourceImage;

  const remixPromptTitle =
    activeTab === "cutout"
      ? "Refine transparent cutout"
      : activeTab === "ai_background"
      ? `Refine backdrop (${bgMode})`
      : activeTab === "ai_expand"
      ? `Expand canvas ${expandRatio}`
      : activeTab === "upscale"
      ? "Enhance 4K resolution"
      : activeTab === "product_detail"
      ? `Commercial showcase for ${productName}`
      : activeTab === "marketing_poster"
      ? `Marketing poster for ${posterTopic}`
      : `Relight with ${activePresetObj?.label || "optical lights"}`;

  return (
    <div
      style={{
        minHeight: "100%",
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        padding: "clamp(16px, 4vw, 36px)",
      }}
    >
      {/* Hidden SVG 4K Convolution Sharpening Filter */}
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <filter id="craftai-4k-sharpen">
            <feConvolveMatrix
              order="3 3"
              preserveAlpha="true"
              kernelMatrix="0 -0.85 0 -0.85 4.4 -0.85 0 -0.85 0"
            />
          </filter>
        </defs>
      </svg>

      <div style={{ maxWidth: "1160px", margin: "0 auto", width: "100%" }}>
        {/* ── Page Header ────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: S.textPrimary,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Wand2 size={24} style={{ color: S.cyan }} />
              Creative AI Tools Suite
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: S.textSecondary }}>
              Zero-token CPU cutout, contextual backdrops, generative canvas outpaint &amp; e-commerce generators.
            </p>
          </div>

          <button
            id="btn-open-tool-history"
            onClick={handleOpenHistory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${S.borderLight}`,
              color: S.textPrimary,
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <History size={15} style={{ color: S.cyan }} />
            <span>Audit History</span>
          </button>
        </div>

        {/* ── Tool Tabs (All 6 Skills + Optical Relight) ───────── */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: `1px solid ${S.cardBorder}`,
            paddingBottom: "12px",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => { setActiveTab("cutout"); setViewMode("slider"); setSliderPos(50); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "cutout" ? "rgba(168, 85, 247, 0.18)" : S.card,
              border: activeTab === "cutout" ? `1px solid ${S.purple}` : `1px solid ${S.borderLight}`,
              color: activeTab === "cutout" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "cutout" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Scissors size={15} style={{ color: S.purple }} />
            <span>Remove BG (Free)</span>
          </button>

          <button
            onClick={() => { setActiveTab("ai_background"); setViewMode("slider"); setSliderPos(50); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "ai_background" ? "rgba(0, 212, 255, 0.18)" : S.card,
              border: activeTab === "ai_background" ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
              color: activeTab === "ai_background" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "ai_background" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Sparkles size={15} style={{ color: S.cyan }} />
            <span>AI Backgrounds (0-10 Cr)</span>
          </button>

          <button
            onClick={() => { setActiveTab("ai_expand"); setViewMode("slider"); setSliderPos(50); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "ai_expand" ? "rgba(99, 102, 241, 0.18)" : S.card,
              border: activeTab === "ai_expand" ? `1px solid ${S.primary}` : `1px solid ${S.borderLight}`,
              color: activeTab === "ai_expand" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "ai_expand" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Layers size={15} style={{ color: "#a5b4fc" }} />
            <span>AI Expand (10 Cr)</span>
          </button>

          <button
            onClick={() => { setActiveTab("upscale"); setViewMode("slider"); setSliderPos(50); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "upscale" ? "rgba(16, 185, 129, 0.18)" : S.card,
              border: activeTab === "upscale" ? `1px solid ${S.success}` : `1px solid ${S.borderLight}`,
              color: activeTab === "upscale" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "upscale" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Maximize2 size={15} style={{ color: S.success }} />
            <span>Upscale 4K (2 Cr)</span>
          </button>

          <button
            onClick={() => { setActiveTab("product_detail"); setViewMode("result"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "product_detail" ? "rgba(244, 114, 182, 0.18)" : S.card,
              border: activeTab === "product_detail" ? "1px solid #f472b6" : `1px solid ${S.borderLight}`,
              color: activeTab === "product_detail" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "product_detail" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Box size={15} style={{ color: "#f472b6" }} />
            <span>Product Detail (10 Cr)</span>
          </button>

          <button
            onClick={() => { setActiveTab("marketing_poster"); setViewMode("result"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "marketing_poster" ? "rgba(251, 146, 60, 0.18)" : S.card,
              border: activeTab === "marketing_poster" ? "1px solid #fb923c" : `1px solid ${S.borderLight}`,
              color: activeTab === "marketing_poster" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "marketing_poster" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <FileText size={15} style={{ color: "#fb923c" }} />
            <span>Marketing Poster (10 Cr)</span>
          </button>

          <button
            onClick={() => { setActiveTab("relight"); setViewMode("slider"); setSliderPos(50); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: activeTab === "relight" ? "rgba(245, 158, 11, 0.18)" : S.card,
              border: activeTab === "relight" ? "1px solid #f59e0b" : `1px solid ${S.borderLight}`,
              color: activeTab === "relight" ? "#ffffff" : S.textSecondary,
              fontSize: "12.5px",
              fontWeight: activeTab === "relight" ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <SunMedium size={15} style={{ color: "#f59e0b" }} />
            <span>Portrait Relighting (Free)</span>
          </button>
        </div>

        {/* ── Error Banner ────────────────────────────────────── */}
        {errorMessage && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "#fca5a5",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fca5a5",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Main Workspace Grid ─────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* Left Canvas (Before / After Comparison or Preview) */}
          <div
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* View Mode Controls Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "5px",
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "#c7d2fe",
                    textTransform: "uppercase",
                  }}
                >
                  {activeTab.replace(/_/g, " ")}
                </span>
              </div>

              {/* Toggle Buttons: Split Slider vs Result Only */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "3px",
                  borderRadius: "8px",
                }}
              >
                <button
                  onClick={() => setViewMode("slider")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: "6px",
                    border: "none",
                    background: viewMode === "slider" ? S.borderLight : "transparent",
                    color: viewMode === "slider" ? "#ffffff" : S.textSecondary,
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Split size={12} />
                  <span>Compare</span>
                </button>

                <button
                  onClick={() => setViewMode("result")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: "6px",
                    border: "none",
                    background: viewMode === "result" ? S.borderLight : "transparent",
                    color: viewMode === "result" ? "#ffffff" : S.textSecondary,
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Eye size={12} />
                  <span>Result</span>
                </button>
              </div>
            </div>

            {/* Canvas Display Container */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "14px",
                overflow: "hidden",
                background: "#08080c",
                aspectRatio: "1/1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
                userSelect: "none",
                touchAction: "none",
                cursor: viewMode === "slider" ? "ew-resize" : "default",
              }}
            >
              {/* Image Rendering Logic */}
              {activeTab === "relight" ? (
                /* Optical Relight View */
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img
                    src={sourceImage}
                    alt="Original"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  {viewMode === "slider" ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${sliderPos}%`,
                        overflow: "hidden",
                        borderRight: "2px solid #f59e0b",
                      }}
                    >
                      <img
                        src={sourceImage}
                        alt="Relit"
                        style={{
                          width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: activePresetObj?.filter,
                        }}
                      />
                      <OpticalLightingOverlay preset={selectedRelightPreset} intensity={relightIntensity / 100} />
                    </div>
                  ) : (
                    <div style={{ position: "absolute", inset: 0 }}>
                      <img
                        src={sourceImage}
                        alt="Relit"
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: activePresetObj?.filter }}
                      />
                      <OpticalLightingOverlay preset={selectedRelightPreset} intensity={relightIntensity / 100} />
                    </div>
                  )}
                </div>
              ) : activeTab === "cutout" && cutoutOutput ? (
                /* Cutout View */
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {viewMode === "result" ? (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `linear-gradient(45deg, #181824 25%, transparent 25%), linear-gradient(-45deg, #181824 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #181824 75%), linear-gradient(-45deg, transparent 75%, #181824 75%)`,
                          backgroundSize: "20px 20px",
                          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                        }}
                      />
                      <img
                        src={cutoutOutput}
                        alt="Transparent Cutout"
                        style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src={sourceImage}
                        alt="Before"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: `${sliderPos}%`,
                          overflow: "hidden",
                          borderRight: `2px solid ${S.purple}`,
                          background: "#181824",
                        }}
                      >
                        <img
                          src={cutoutOutput}
                          alt="After Cutout"
                          style={{
                            width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : toolOutput ? (
                /* Generalized AI Output (AI Backgrounds, Expand, Upscale, Product Detail, Poster) */
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {viewMode === "result" ? (
                    <img
                      src={toolOutput}
                      alt="AI Tool Result"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <>
                      <img
                        src={sourceImage}
                        alt="Original Before"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: `${sliderPos}%`,
                          overflow: "hidden",
                          borderRight: `2px solid ${S.cyan}`,
                        }}
                      >
                        <img
                          src={toolOutput}
                          alt="Processed After"
                          style={{
                            width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Unprocessed Source Preview */
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img
                    src={sourceImage}
                    alt="Source"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}

              {/* Slider Handle */}
              {viewMode === "slider" && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${sliderPos}%`,
                    transform: "translate(-50%, -50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: `3px solid ${S.cyan}`,
                    boxShadow: "0 0 16px rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  <div style={{ display: "flex", gap: "2px", color: "#000" }}>
                    <ChevronLeft size={13} strokeWidth={3} />
                    <ChevronRight size={13} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: ⚡ Remix in Lab, Download & Upload */}
            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "16px", flexWrap: "wrap" }}>
              <Link
                href={`/remix?anchorImageUrl=${encodeURIComponent(currentOutput || sourceImage)}&initialPrompt=${encodeURIComponent(remixPromptTitle)}`}
                style={{
                  flex: 1,
                  minWidth: "170px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.5)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 0 16px rgba(99, 102, 241, 0.25)",
                }}
              >
                <Zap size={14} style={{ color: "#38bdf8" }} />
                <span>⚡ Remix in Lab (Chat)</span>
              </Link>

              <button
                onClick={() => triggerDownload(currentOutput || sourceImage)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${S.borderLight}`,
                  color: S.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
                <span>Download</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${S.borderLight}`,
                  color: S.textSecondary,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Upload size={14} />
                <span>Replace</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </div>

          {/* Right Panel: Tool Parameters & Execution Controls */}
          <div
            style={{
              background: S.card,
              border: `1px solid ${S.borderLight}`,
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* ── 1. REMOVE BACKGROUND CONTROLS ──────────────── */}
            {activeTab === "cutout" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: S.purple, fontSize: "14px", fontWeight: 700 }}>
                    <Scissors size={18} />
                    <span>Instant Transparent PNG Cutout</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    1-tap CPU background removal using U2-Net ONNX. 100% free with zero GPU token consumption.
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(168, 85, 247, 0.08)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "12px",
                    color: "#d8b4fe",
                  }}
                >
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                    🔒 Zero Object Hallucination Guarantee
                  </p>
                  Foreground subject pixels remain untouched. Alpha mask is extracted cleanly with anti-aliased edge feathering.
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : S.purple,
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(168, 85, 247, 0.35)",
                  }}
                >
                  <Scissors size={16} />
                  <span>{isProcessing ? "Extracting Foreground Cutout..." : "Remove Background (Free / 0 Cr)"}</span>
                </button>
              </>
            )}

            {/* ── 2. AI BACKGROUNDS CONTROLS ─────────────────── */}
            {activeTab === "ai_background" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: S.cyan, fontSize: "14px", fontWeight: 700 }}>
                    <Sparkles size={18} />
                    <span>AI Studio &amp; Contextual Backdrops</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    100% subject preservation: Foreground is isolated and composited onto a freshly synthesized backdrop with directional contact shadow.
                  </p>
                </div>

                {/* Mode Selector */}
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Backdrop Mode
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
                    {[
                      { id: "pure_white", label: "Studio White", price: "0 Cr (Free)" },
                      { id: "smart", label: "Smart Studio", price: "10 Cr" },
                      { id: "custom", label: "Custom Scene", price: "10 Cr" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setBgMode(m.id as any)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: "8px",
                          background: bgMode === m.id ? "rgba(0, 212, 255, 0.15)" : S.card,
                          border: bgMode === m.id ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                          color: bgMode === m.id ? "#ffffff" : S.textSecondary,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 700 }}>{m.label}</div>
                        <div style={{ fontSize: "10px", color: S.cyan, marginTop: "2px" }}>{m.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Backdrop Textarea */}
                {bgMode === "custom" && (
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                      Custom Scene Description
                    </span>
                    <textarea
                      value={customBackdrop}
                      onChange={(e) => setCustomBackdrop(e.target.value)}
                      rows={2}
                      placeholder="e.g. Modern concrete podium with soft morning sunlight and monstera leaves"
                      style={{
                        width: "100%",
                        background: "#080c14",
                        border: `1px solid ${S.borderLight}`,
                        borderRadius: "8px",
                        padding: "8px 10px",
                        color: S.textPrimary,
                        fontSize: "12px",
                        marginTop: "6px",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}

                {/* Aspect Ratio & Quality */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                      Aspect Ratio
                    </span>
                    <select
                      value={bgRatio}
                      onChange={(e) => setBgRatio(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080c14",
                        border: `1px solid ${S.borderLight}`,
                        borderRadius: "8px",
                        padding: "8px 10px",
                        color: S.textPrimary,
                        fontSize: "12px",
                        marginTop: "6px",
                      }}
                    >
                      <option value="Auto">Auto (Original)</option>
                      <option value="1:1">1:1 Square</option>
                      <option value="4:5">4:5 Portrait</option>
                      <option value="9:16">9:16 Story</option>
                      <option value="16:9">16:9 Widescreen</option>
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                      Quality Tier
                    </span>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      {["1k", "2k"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setBgQuality(q as any)}
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            borderRadius: "8px",
                            background: bgQuality === q ? "rgba(0, 212, 255, 0.15)" : S.card,
                            border: bgQuality === q ? `1px solid ${S.cyan}` : `1px solid ${S.borderLight}`,
                            color: bgQuality === q ? "#ffffff" : S.textSecondary,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {q.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : S.cyan,
                    border: "none",
                    color: "#000000",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Sparkles size={16} />
                  <span>
                    {isProcessing
                      ? "Synthesizing Studio Backdrop..."
                      : `Generate Backdrop (${bgMode === "pure_white" ? "Free 0 Cr" : "10 Credits"})`}
                  </span>
                </button>
              </>
            )}

            {/* ── 3. AI EXPAND CONTROLS ──────────────────────── */}
            {activeTab === "ai_expand" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a5b4fc", fontSize: "14px", fontWeight: 700 }}>
                    <Layers size={18} />
                    <span>Generative Canvas Outpainting</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    Extends canvas boundaries to any ratio while locking the original center content 100% untouched.
                  </p>
                </div>

                {/* Target Ratio Grid */}
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Target Outpaint Ratio
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "8px" }}>
                    {["16:9", "9:16", "1:1", "4:5", "3:4", "4:3", "2:3", "3:2"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setExpandRatio(r)}
                        style={{
                          padding: "8px 0",
                          borderRadius: "8px",
                          background: expandRatio === r ? "rgba(99, 102, 241, 0.2)" : S.card,
                          border: expandRatio === r ? `1px solid ${S.primary}` : `1px solid ${S.borderLight}`,
                          color: expandRatio === r ? "#ffffff" : S.textSecondary,
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "12px",
                    color: "#c7d2fe",
                  }}
                >
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                    ✨ Seamless Edge Feathering
                  </p>
                  Atmospheric ambient canvas expansion with content-aware texture synthesis and soft edge blending.
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : S.primary,
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  <Layers size={16} />
                  <span>
                    {isProcessing ? "Expanding Canvas Boundary..." : `Expand Canvas (${expandQuality === "2k" ? "14 Credits" : "10 Credits"})`}
                  </span>
                </button>
              </>
            )}

            {/* ── 4. UPSCALE 4K CONTROLS ─────────────────────── */}
            {activeTab === "upscale" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: S.success, fontSize: "14px", fontWeight: 700 }}>
                    <Maximize2 size={18} />
                    <span>4K Super-Resolution Detail Upscaler</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    Lanczos + UnsharpMask micro-texture detail upscaler restoring ultra-clear lines up to 4096px.
                  </p>
                </div>

                {/* Scale Factor Selection */}
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Scale Factor Multiplier
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                    {[
                      { factor: 2, label: "2X Super HD", detail: "2048 × 2048 px" },
                      { factor: 4, label: "4X Master Ultra", detail: "4096 × 4096 px" },
                    ].map((s) => (
                      <button
                        key={s.factor}
                        onClick={() => setUpscaleScale(s.factor as any)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          background: upscaleScale === s.factor ? "rgba(16, 185, 129, 0.15)" : S.card,
                          border: upscaleScale === s.factor ? `1px solid ${S.success}` : `1px solid ${S.borderLight}`,
                          color: upscaleScale === s.factor ? "#ffffff" : S.textSecondary,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>{s.label}</div>
                        <div style={{ fontSize: "11px", color: S.success, marginTop: "2px" }}>{s.detail}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : S.success,
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Maximize2 size={16} />
                  <span>{isProcessing ? "Synthesizing 4K..." : "Upscale Image (2 Credits)"}</span>
                </button>
              </>
            )}

            {/* ── 5. PRODUCT DETAIL CONTROLS ─────────────────── */}
            {activeTab === "product_detail" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f472b6", fontSize: "14px", fontWeight: 700 }}>
                    <Box size={18} />
                    <span>Product Detail E-Commerce Hero</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    Isolates merchandise photo and mounts onto luxury commercial showroom stage with directional lighting.
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Product Title / Name
                  </span>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Obsidian Matte Minimalist Chrono Watch"
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: `1px solid ${S.borderLight}`,
                      borderRadius: "8px",
                      padding: "10px",
                      color: S.textPrimary,
                      fontSize: "12.5px",
                      marginTop: "6px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                      Aspect Ratio
                    </span>
                    <select
                      value={prodRatio}
                      onChange={(e) => setProdRatio(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080c14",
                        border: `1px solid ${S.borderLight}`,
                        borderRadius: "8px",
                        padding: "8px 10px",
                        color: S.textPrimary,
                        fontSize: "12px",
                        marginTop: "6px",
                      }}
                    >
                      <option value="4:5">4:5 Amazon / Shopify</option>
                      <option value="1:1">1:1 Square</option>
                      <option value="9:16">9:16 Story / Reel</option>
                      <option value="16:9">16:9 Banner</option>
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                      Language
                    </span>
                    <select
                      value={prodLang}
                      onChange={(e) => setProdLang(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080c14",
                        border: `1px solid ${S.borderLight}`,
                        borderRadius: "8px",
                        padding: "8px 10px",
                        color: S.textPrimary,
                        fontSize: "12px",
                        marginTop: "6px",
                      }}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : "#f472b6",
                    border: "none",
                    color: "#000000",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(244, 114, 182, 0.3)",
                  }}
                >
                  <Box size={16} />
                  <span>{isProcessing ? "Rendering Commercial Showcase..." : "Generate Product Detail (10 Credits)"}</span>
                </button>
              </>
            )}

            {/* ── 6. MARKETING POSTER CONTROLS ───────────────── */}
            {activeTab === "marketing_poster" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fb923c", fontSize: "14px", fontWeight: 700 }}>
                    <FileText size={18} />
                    <span>Marketing Poster &amp; Commercial Promos</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    Generates promotional advertising graphics with typography layouts from a single topic line.
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Campaign Topic
                  </span>
                  <input
                    type="text"
                    value={posterTopic}
                    onChange={(e) => setPosterTopic(e.target.value)}
                    placeholder="e.g. Summer Cold Brew Iced Coffee Launch"
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: `1px solid ${S.borderLight}`,
                      borderRadius: "8px",
                      padding: "10px",
                      color: S.textPrimary,
                      fontSize: "12.5px",
                      marginTop: "6px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Headline (Optional)
                  </span>
                  <input
                    type="text"
                    value={posterHeadline}
                    onChange={(e) => setPosterHeadline(e.target.value)}
                    placeholder="e.g. Cold. Bold. Refreshing."
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: `1px solid ${S.borderLight}`,
                      borderRadius: "8px",
                      padding: "10px",
                      color: S.textPrimary,
                      fontSize: "12.5px",
                      marginTop: "6px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                    Category
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {["Commercial", "Beverage", "Fashion", "Hiring", "Flash Sale", "Event", "Promotion"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPosterCategory(cat)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: posterCategory === cat ? "rgba(251, 146, 60, 0.2)" : S.card,
                          border: posterCategory === cat ? "1px solid #fb923c" : `1px solid ${S.borderLight}`,
                          color: posterCategory === cat ? "#ffffff" : S.textSecondary,
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExecuteActiveTool}
                  disabled={isProcessing}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: isProcessing ? "#1e1e2a" : "#fb923c",
                    border: "none",
                    color: "#000000",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 20px rgba(251, 146, 60, 0.3)",
                  }}
                >
                  <FileText size={16} />
                  <span>
                    {isProcessing ? "Synthesizing Promotional Poster..." : `Generate Poster (${posterQuality === "2k" ? "14 Credits" : "10 Credits"})`}
                  </span>
                </button>
              </>
            )}

            {/* ── 7. PORTRAIT RELIGHTING CONTROLS ────────────── */}
            {activeTab === "relight" && (
              <>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontSize: "14px", fontWeight: 700 }}>
                    <SunMedium size={18} />
                    <span>Portrait Relighting &amp; Depth Bokeh</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.textSecondary, lineHeight: 1.5 }}>
                    Zero-token, 60 FPS client optical blend layers simulating physical camera lighting and focal depth.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {RELIGHT_PRESETS.map((p) => {
                    const isSelected = selectedRelightPreset === p.id && isRelightActive;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedRelightPreset(p.id);
                          setIsRelightActive(true);
                          setViewMode("slider");
                          setSliderPos(50);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: isSelected ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? "1px solid #f59e0b" : `1px solid ${S.borderLight}`,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: isSelected ? "#f59e0b" : S.textPrimary, display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: S.textSecondary, marginTop: "4px" }}>
                            {p.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: "#f59e0b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#000",
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Lighting Intensity Slider */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${S.borderLight}`,
                    borderRadius: "12px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: S.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sun size={14} style={{ color: "#f59e0b" }} />
                      Lighting Strength
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>
                      {relightIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={relightIntensity}
                    onChange={(e) => setRelightIntensity(Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: "#f59e0b",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tool History Modal */}
      <ToolHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        isLoading={isLoadingHistory}
        hasMore={hasMoreHistory}
        onLoadMore={handleLoadMoreHistory}
        onSelectImage={(url) => {
          setSourceImage(url);
          setToolOutput(null);
          setCutoutOutput(null);
          setViewMode("result");
        }}
      />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#64748b" }}>Loading Creative Tools...</div>}>
      <ToolsContent />
    </Suspense>
  );
}
