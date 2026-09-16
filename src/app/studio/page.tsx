'use client'

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronDown, Upload, Sparkles, Shield, Globe,
  Wand2, CheckCircle2, Zap, Bookmark, Check, User, Palette, Mountain, Plus,
  Image as ImageIcon, Lock, Camera, Copy, AlertCircle, RefreshCw, Layers, ArrowRight,
} from "lucide-react";
import { generateFreeImage, stripWatermark, type ImageModel, type AspectRatio } from "@/lib/api/generate";
import {
  dispatchGeneration,
  subscribeGenerationProgress,
  expandPrompt,
  compileChatDelta,
  uploadReferencePhoto,
  cleanupReferencePhoto,
} from "@/lib/api/backend-client";
import { saveGeneration, publishArtwork, savePrivateArtwork } from "@/lib/supabase/db";
import { useUser } from "@/context/UserContext";

/* ── Types & Constants ──────────────────────────────────────── */
type Model = { id: ImageModel; label: string; version: string };
type Ratio = { id: AspectRatio; label: string };
type AnchorMode = "character" | "style" | "scene";

const MODELS: Model[] = [
  { id: "flux",  label: "FLUX.1 Schnell", version: "v1.2" },
  { id: "turbo", label: "SDXL Turbo",     version: "v2.0" },
  { id: "sdxl",  label: "Stable Diffusion XL", version: "v1.0" },
];

const RATIOS: Ratio[] = [
  { id: "1:1",  label: "1:1 Square"   },
  { id: "16:9", label: "16:9 Wide"    },
  { id: "9:16", label: "9:16 Portrait"},
  { id: "4:5",  label: "4:5 Portrait" },
];

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:5": { width: 896, height: 1120 },
};

const LLM_ENGINES = [
  { id: "gemini", label: "Gemini 2.5 Flash (Live AI)" },
  { id: "groq",   label: "Groq Llama 3.3 (Fast)" },
  { id: "claude", label: "Claude 3.5 Sonnet (Pro)" },
];

const STYLE_BOOSTERS = [
  { label: "Cinematic Lighting", icon: "✨" },
  { label: "Photorealistic 8K", icon: "📸" },
  { label: "Cyberpunk Neon", icon: "🌆" },
  { label: "Studio Ghibli Anime", icon: "🎨" },
  { label: "Octane 3D Render", icon: "⚡" },
  { label: "Volumetric Fog", icon: "🌫️" },
  { label: "Unreal Engine 5", icon: "🎮" },
  { label: "Holographic Glow", icon: "🔮" },
];

const ANCHOR_TAGS = [
  "Woman Portrait",
  "Man Portrait",
  "Anime Character",
  "Cyberpunk Avatar",
  "Facial Likeness",
];

/* ── Shared style tokens matching Mobile & Web Spec ─────────── */
const S = {
  bg:          "#0b0b0f",
  panel:       "#121218",
  panelBorder: "#1e1e2a",
  card:        "#161d2b",
  cardBorder:  "#2e2e3e",
  cyan:        "#00d4ff",
  cyanDark:    "#00b8db",
  primary:     "#6366f1",
  primaryDark: "#4f46e5",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted:   "#64748b",
  success:     "#10b981",
  warning:     "#f59e0b",
  error:       "#ef4444",
};

interface ChatDeltaDiff {
  added: string[];
  removed: string[];
}

interface StudioChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "synthesizing" | "completed";
  diff?: ChatDeltaDiff;
  suggestedChips?: string[];
  deltaSummary?: string;
}

function StudioContent() {
  const router = useRouter();
  const { profile, user } = useUser();
  const userKey = user?.id || profile.email || "default";
  const searchParams = useSearchParams();

  // Query parameters from Explore or Home
  const queryPrompt = searchParams.get("prompt");
  const queryEngine = searchParams.get("engine");
  const autoGen = searchParams.get("autoGen");
  const querySessionId = searchParams.get("sessionId") || searchParams.get("genId");
  const queryImage = searchParams.get("imageUrl");
  const queryRemixId = searchParams.get("remixPromptId") || searchParams.get("remixId");
  const queryFaceLock = searchParams.get("faceLock") === "true";

  const activeSessionId = useRef<string | null>(querySessionId);
  const remixedFromPromptId = useRef<string | null>(queryRemixId);

  useEffect(() => {
    if (querySessionId) activeSessionId.current = querySessionId;
    if (queryRemixId) remixedFromPromptId.current = queryRemixId;
  }, [querySessionId, queryRemixId]);

  // Messages in Chat Copilot
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>(() => {
    const msgs: StudioChatMessage[] = [];
    if (queryPrompt) {
      msgs.push({
        id: "msg-init-user",
        role: "user",
        content: queryPrompt,
        timestamp: "Just now",
      });
      msgs.push({
        id: "msg-init-ai",
        role: "assistant",
        content: autoGen === "true"
          ? `Synthesizing your concept with ${queryEngine || "FLUX.1 Schnell"}...`
          : `Loaded prompt. You can enhance it with Gemini, converse with the Copilot, or lock your face likeness.`,
        timestamp: "Just now",
        status: autoGen === "true" ? "synthesizing" : "completed",
      });
    } else {
      msgs.push({
        id: "msg-welcome",
        role: "assistant",
        content: "Welcome to CraftAI Studio! Enter your concept below, enhance with Gemini, or speak to the Chat Copilot to refine anytime.",
        timestamp: "Just now",
        status: "completed",
        suggestedChips: ["Make it cinematic", "Add golden hour", "Cyberpunk neon street"],
      });
    }
    return msgs;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Model & Engine settings
  const [model, setModel] = useState<Model>(() => {
    if (queryEngine) {
      const found = MODELS.find((m) => m.id === queryEngine);
      if (found) return found;
    }
    return MODELS[0];
  });
  const [selectedEngine, setSelectedEngine] = useState<string>("gemini");
  const [ratio, setRatio] = useState<Ratio>(RATIOS[0]);

  // Generation & Progress states
  const [generating, setGenerating] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const isBusy = generating || imageLoading || isEnhancing;

  // Prompt Formula States (Rule 4 DRM: Clean prompt displayed, armed recipe sent to FLUX)
  const [promptRecipe, setPromptRecipe] = useState(
    queryPrompt || "surreal cosmic landscape, glowing iridescent nebula clouds, glowing geometric obsidian monolith centered"
  );
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState(
    queryPrompt || "surreal cosmic landscape, glowing iridescent nebula clouds, glowing geometric obsidian monolith centered"
  );
  const [armedMasterFormula, setArmedMasterFormula] = useState<string | null>(null);

  // Reference photos & Face Lock
  const [refImage, setRefImage] = useState<string | null>(queryImage || null);
  const [refName, setRefName] = useState<string>("");
  const [anchorMode, setAnchorMode] = useState<AnchorMode>("character");
  const [anchorSubject, setAnchorSubject] = useState<string>("");
  const [isFaceLockActive, setIsFaceLockActive] = useState<boolean>(queryFaceLock);
  const [faceAngleSlots, setFaceAngleSlots] = useState<{ front?: string; angle45?: string; profile?: string }>({});

  // Image & Feedback Notice States
  const fallbackMain = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";
  const [currentImage, setCurrentImage] = useState(
    queryImage || (
      queryPrompt
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(queryPrompt)}?model=flux&width=1024&height=1024&seed=7777&nologo=true`
        : fallbackMain
    )
  );
  const [saveNotice, setSaveNotice] = useState(false);
  const [publishNotice, setPublishNotice] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const [modelOpen, setModelOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const hasAutoGenerated = useRef<string | null>(null);

  // Resizable Right Panel Width (Draggable Assistant Panel)
  const [panelWidth, setPanelWidth] = useState<number>(380);
  const [isResizing, setIsResizing] = useState(false);
  const isDraggingRef = useRef(false);

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"canvas" | "assistant">("canvas");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("craftai_studio_panel_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 300 && val <= 800) setPanelWidth(val);
      }
    } catch {}

    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth < 960);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(300, Math.min(newWidth, Math.min(800, window.innerWidth - 350)));
      setPanelWidth(clamped);
      try {
        localStorage.setItem("craftai_studio_panel_width", String(clamped));
      } catch {}
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsResizing(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isBusy]);

  // Strip watermark from initial query preview
  useEffect(() => {
    if (currentImage && currentImage.includes("pollinations.ai")) {
      stripWatermark(currentImage).then((clean) => {
        if (clean && clean !== currentImage) setCurrentImage(clean);
      });
    }
  }, []);

  // Handle auto-generation from Home page
  useEffect(() => {
    if (queryPrompt && autoGen === "true" && hasAutoGenerated.current !== queryPrompt) {
      hasAutoGenerated.current = queryPrompt;
      executeGenerate(queryPrompt);
    }
  }, [queryPrompt, autoGen]);

  /* ── 1. Magic Enhance (Prompt Expansion via Gemini Flash) ─── */
  async function handleEnhance() {
    const raw = promptRecipe.trim();
    if (!raw || isBusy) return;

    setIsEnhancing(true);
    try {
      const res = await expandPrompt({
        raw_prompt: raw,
        aspect_ratio: ratio.id,
        ai_model: selectedEngine,
      });

      if (res?.master_prompt) {
        setArmedMasterFormula(res.master_prompt);
        // Add info message to chat
        setChatMessages((prev) => [
          ...prev,
          {
            id: `enhance-${Date.now()}`,
            role: "assistant",
            content: `✨ Master formula armed with ${res.model_used || "Gemini 2.5 Flash"}. Your clean prompt is ready for high-fidelity FLUX dispatch.`,
            timestamp: "Just now",
            status: "completed",
          },
        ]);
      }
    } catch (err) {
      console.warn("Enhance error:", err);
    } finally {
      setIsEnhancing(false);
    }
  }

  /* ── 2. Prompt Chat Copilot (Delta Instruction Compiler) ─── */
  async function handleChatDeltaSubmit(instruction: string) {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction || isBusy) return;

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    // Add user message immediately
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: cleanInstruction,
        timestamp: "Just now",
      },
      {
        id: aiMsgId,
        role: "assistant",
        content: "Compiling prompt delta...",
        timestamp: "Just now",
        status: "synthesizing",
      },
    ]);

    try {
      const baseToUse = lastGeneratedPrompt || promptRecipe;
      const res = await compileChatDelta({
        base_prompt: baseToUse,
        user_instruction: cleanInstruction,
        turn_count: 1,
        ai_model: "groq",
      });

      if (res?.compiled_prompt) {
        setPromptRecipe(res.compiled_prompt);
        setArmedMasterFormula(null); // Refined prompt becomes the new recipe

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: res.delta_summary || `Applied adjustments: "${cleanInstruction}"`,
                  status: "completed",
                  diff: res.diff,
                  suggestedChips: res.suggested_chips || ["Add Neon Reflections", "35mm Portrait Bokeh"],
                  deltaSummary: res.delta_summary,
                }
              : msg
          )
        );

        // Auto trigger generation with refined prompt
        executeGenerate(res.compiled_prompt);
      }
    } catch {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: `Could not compile prompt delta. Generating directly with: "${cleanInstruction}"`,
                status: "completed",
              }
            : msg
        )
      );
      executeGenerate(`${promptRecipe}, ${cleanInstruction}`);
    }
  }

  /* ── 3. Reference Image & Face-Lock Upload Handlers ──────── */
  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const res = await uploadReferencePhoto(file);
      setRefImage(res.url);
      setRefName(file.name);
      setAnchorSubject(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      setIsFaceLockActive(true);
    } catch (err) {
      console.warn("Upload reference error:", err);
    }
  };

  const handleFaceAngleUpload = async (file: File, angle: "front" | "angle45" | "profile") => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const res = await uploadReferencePhoto(file);
      setFaceAngleSlots((prev) => ({ ...prev, [angle]: res.url }));
      setRefImage(res.url);
      setIsFaceLockActive(true);
    } catch (err) {
      console.warn("Angle photo upload error:", err);
    }
  };

  /* ── 4. Style Booster Tag Toggling ───────────────────────── */
  const toggleBooster = (tag: string) => {
    const isApplied = promptRecipe.toLowerCase().includes(tag.toLowerCase());
    if (isApplied) {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let updated = promptRecipe.replace(new RegExp(`\\s*,\\s*${escaped}`, "gi"), "");
      updated = updated.replace(new RegExp(`${escaped}\\s*,?\\s*`, "gi"), "");
      updated = updated.replace(/\s*,\s*$/, "").replace(/^\s*,\s*/, "").trim();
      setPromptRecipe(updated);
    } else {
      const clean = promptRecipe.trim();
      const separator = clean.length > 0 && !clean.endsWith(",") ? ", " : " ";
      setPromptRecipe(clean ? `${clean}${separator}${tag}` : tag);
    }
  };

  /* ── 5. Main Generation Execution (FastAPI + WebSocket Stream) ── */
  async function executeGenerate(recipe: string) {
    const clean = recipe.trim();
    if (!clean || clean.length < 3 || isBusy) return;

    setGenerating(true);
    setImageLoading(true);
    setGenerationError(null);
    setProgressPercent(5);
    setProgressMessage("Preparing creative canvas...");

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: clean,
        timestamp: "Just now",
      },
      {
        id: aiMsgId,
        role: "assistant",
        content: `Synthesizing latents with ${model.label} (${ratio.label})...`,
        timestamp: "Just now",
        status: "synthesizing",
      },
    ]);

    // Prepare dispatch payload
    const { width, height } = ASPECT_DIMENSIONS[ratio.id];
    const faceUrls = Object.values(faceAngleSlots).filter(Boolean) as string[];
    if (refImage && !faceUrls.includes(refImage)) {
      faceUrls.push(refImage);
    }

    // Determine prompt to send (Secret Formula DRM: dispatch master recipe if armed)
    let promptToSend = armedMasterFormula || clean;
    if (refImage && !armedMasterFormula) {
      const subject = anchorSubject.trim() || refName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "character likeness";
      if (anchorMode === "character") {
        promptToSend = `Featuring character likeness: (${subject}), seamless integration into: ${clean}, detailed face, 8k masterpiece`;
      } else if (anchorMode === "style") {
        promptToSend = `In the visual aesthetic and art style of reference: (${subject}), applied to: ${clean}, 8k render`;
      } else {
        promptToSend = `Atmosphere inspired by reference: (${subject}), scene: ${clean}`;
      }
    }

    try {
      // Step A: Dispatch task to FastAPI backend
      const dispatchRes = await dispatchGeneration({
        prompt: promptToSend,
        face_reference_urls: faceUrls.length > 0 ? faceUrls : null,
        width,
        height,
        model: model.id,
        remixed_from_prompt_id: remixedFromPromptId.current,
      });

      const taskId = dispatchRes.task_id;
      let finalUrl = dispatchRes.direct_image_url;

      // Step B: Connect to WebSocket progress stream (with HTTP polling fallback)
      await new Promise<void>((resolve) => {
        const unsubscribe = subscribeGenerationProgress(
          taskId,
          (event) => {
            setProgressPercent(event.progress);
            setProgressMessage(event.message || "Diffusing image latents...");
            if (event.output_url) finalUrl = event.output_url;
          },
          (outputUrl) => {
            if (outputUrl) finalUrl = outputUrl;
            setProgressPercent(100);
            setProgressMessage("✨ Masterpiece ready! Rendering pixels...");
            unsubscribe();
            setTimeout(resolve, 400);
          },
          (errMsg) => {
            console.warn("WebSocket stream error, fallback:", errMsg);
            unsubscribe();
            resolve();
          }
        );

        // 35-second hard safety timeout
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 35000);
      });

      // Step C: Fallback to client generation if backend didn't provide direct URL
      if (!finalUrl) {
        finalUrl = await generateFreeImage({
          prompt: promptToSend,
          model: model.id,
          aspectRatio: ratio.id,
          referenceImage: refImage && refImage.startsWith("http") ? refImage : undefined,
        });
      }

      // Step D: Strip watermark
      const cleanUrl = await stripWatermark(finalUrl);
      setCurrentImage(cleanUrl);
      setLastGeneratedPrompt(clean);
      setArmedMasterFormula(null); // Reset armed formula on success

      // Save to Supabase jobs & local history
      const saved = await saveGeneration(
        {
          prompt: clean,
          image_url: cleanUrl,
          model: model.label,
          aspect_ratio: ratio.id,
          user_id: user?.id,
          user_email: profile.email,
        },
        userKey,
        activeSessionId.current
      );

      activeSessionId.current = saved.id;

      // Update AI message in chat
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: `Artwork generated with ${model.label}! Ready to refine or download in 4K.`,
                status: "completed",
              }
            : msg
        )
      );

      // Ephemeral face-lock photo auto-purge notice
      if (refImage && refImage.startsWith("http")) {
        cleanupReferencePhoto(refImage);
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setGenerationError(err?.message || "Synthesis encountered a problem. Click retry to run again.");
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: "Generation failed or timed out. Please try adjusting your prompt or click retry.",
                status: "completed",
              }
            : msg
        )
      );
    } finally {
      setGenerating(false);
      setProgressPercent(0);
      setProgressMessage("");
    }
  }

  function handleGenerate() {
    if (isBusy) return;
    const textToRun = promptRecipe.trim();
    if (!textToRun) return;
    if (isMobileOrTablet) setActiveMobileTab("canvas");
    executeGenerate(textToRun);
  }

  /* ── Save & Publish Handlers ──────────────────────────────── */
  async function handleSavePrivate() {
    if (!currentImage) return;
    await savePrivateArtwork({
      prompt: lastGeneratedPrompt || promptRecipe,
      image_url: currentImage,
      model: model.label,
      aspect_ratio: ratio.id,
    });
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  }

  async function handlePublishPublic() {
    if (!currentImage) return;
    await publishArtwork({
      prompt: lastGeneratedPrompt || promptRecipe,
      image_url: currentImage,
      model: model.label,
      aspect_ratio: ratio.id,
      author_name: profile.name,
      author_handle: profile.handle,
      author_avatar: profile.initials,
    });
    setPublishNotice(true);
    setTimeout(() => setPublishNotice(false), 3500);
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptRecipe);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  return (
    <div style={{ height: "100%", width: "100%", background: S.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Mobile/Tablet View Switcher ────────────────────── */}
      {isMobileOrTablet && (
        <div style={{
          display: "flex",
          borderBottom: `1px solid ${S.panelBorder}`,
          background: S.panel,
          padding: "6px 12px",
          gap: "8px",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveMobileTab("canvas")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: activeMobileTab === "canvas" ? `1px solid ${S.primary}` : "1px solid transparent",
              background: activeMobileTab === "canvas" ? "rgba(99,102,241,0.18)" : "transparent",
              color: activeMobileTab === "canvas" ? "#ffffff" : S.textSecondary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ImageIcon size={14} />
            Canvas Preview
          </button>
          <button
            onClick={() => setActiveMobileTab("assistant")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: activeMobileTab === "assistant" ? `1px solid ${S.primary}` : "1px solid transparent",
              background: activeMobileTab === "assistant" ? "rgba(99,102,241,0.18)" : "transparent",
              color: activeMobileTab === "assistant" ? "#ffffff" : S.textSecondary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} />
            Copilot &amp; Prompt
            {isBusy && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: S.cyan }} />
            )}
          </button>
        </div>
      )}

      {/* ══ TOP CONSISTENT CHARACTER / FACE-LOCK BAR (InstantID Tier 1) ══ */}
      <div
        style={{
          background: "#0d0d14",
          borderBottom: `1px solid ${S.panelBorder}`,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Camera size={14} style={{ color: isFaceLockActive ? S.success : S.textSecondary }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: S.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              InstantID Face-Lock
            </span>
          </div>

          {/* 3 Face Reference Angle Slots */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {(["front", "angle45", "profile"] as const).map((angle) => {
              const label = angle === "front" ? "Front" : angle === "angle45" ? "45°" : "Profile";
              const photo = faceAngleSlots[angle];
              return (
                <label
                  key={angle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: photo ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)",
                    border: photo ? "1px solid rgba(16, 185, 129, 0.4)" : `1px solid ${S.cardBorder}`,
                    color: photo ? S.success : S.textSecondary,
                    fontSize: "11px",
                    cursor: isBusy ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                  title={`Upload ${label} photo`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isBusy}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFaceAngleUpload(e.target.files[0], angle);
                    }}
                  />
                  {photo ? <Check size={10} /> : <Plus size={10} />}
                  <span>{label}</span>
                </label>
              );
            })}
          </div>

          {isFaceLockActive && (
            <span style={{
              fontSize: "11px",
              color: S.success,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(16, 185, 129, 0.1)",
              padding: "3px 8px",
              borderRadius: "9999px",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}>
              🟢 Tier 1 Face-Lock Active • Zero Retention Privacy
            </span>
          )}
        </div>

        {/* Explore Creator Remix Attribution if active */}
        {remixedFromPromptId.current && (
          <div style={{
            fontSize: "11px",
            color: S.primary,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "rgba(99, 102, 241, 0.12)",
            padding: "3px 10px",
            borderRadius: "9999px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}>
            <Sparkles size={12} />
            <span>Remix Royalty Split (40% Author Credit)</span>
          </div>
        )}
      </div>

      {/* ══ TWO COLUMN WORKSPACE ════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* ── LEFT CANVAS & CONTROLS ──────────────────────────── */}
        <div style={{
          flex: 1,
          display: isMobileOrTablet ? (activeMobileTab === "canvas" ? "flex" : "none") : "flex",
          flexDirection: "column",
          borderRight: isMobileOrTablet ? "none" : `1px solid ${S.panelBorder}`,
          background: S.bg,
          minWidth: 0,
          overflow: "hidden",
        }}>

          {/* Model & Aspect Ratio Toolbar */}
          <div style={{
            padding: "8px 16px",
            borderBottom: `1px solid ${S.panelBorder}`,
            background: "#080c14",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            opacity: isBusy ? 0.6 : 1,
            pointerEvents: isBusy ? "none" : "auto",
            transition: "opacity 0.2s",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Active Model
            </span>

            {/* Model Selector Pill */}
            <div style={{ position: "relative" }}>
              <button
                id="studio-model-selector"
                onClick={() => setModelOpen(!modelOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "5px 12px", borderRadius: "8px",
                  background: S.card, border: `1px solid ${S.cardBorder}`,
                  color: S.textPrimary, fontSize: "12px", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{model.label}</span>
                <ChevronDown size={13} style={{ color: S.textSecondary }} />
              </button>

              {modelOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0,
                  background: S.panel, border: `1px solid ${S.cardBorder}`,
                  borderRadius: "10px", padding: "6px", zIndex: 100,
                  minWidth: "200px", boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
                }}>
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m); setModelOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: "6px",
                        background: model.id === m.id ? "rgba(99,102,241,0.15)" : "transparent",
                        border: "none", color: model.id === m.id ? S.cyan : S.textPrimary,
                        fontSize: "12px", fontWeight: model.id === m.id ? 700 : 400,
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span>{m.label}</span>
                      <span style={{ fontSize: "11px", color: S.textMuted }}>{m.version}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: "1px", height: "18px", background: S.panelBorder }} />

            {/* Aspect Ratio Buttons */}
            {RATIOS.map((r) => (
              <button
                key={r.id}
                id={`ratio-${r.id.replace(":", "-")}`}
                onClick={() => setRatio(r)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: ratio.id === r.id ? `1px solid ${S.primary}` : `1px solid ${S.cardBorder}`,
                  background: ratio.id === r.id ? S.primary : "transparent",
                  color: ratio.id === r.id ? "#ffffff" : S.textSecondary,
                  fontSize: "11px",
                  fontWeight: ratio.id === r.id ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Canvas with Live Progress Card & Image Display */}
          <div style={{
            flex: 1,
            background: "#080c14",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "20px",
          }}>
            {/* Live Progress Card (WebSocket stream) */}
            {generating && (
              <div
                style={{
                  width: "min(520px, 92%)",
                  background: "rgba(18, 18, 24, 0.95)",
                  border: `1px solid ${S.primary}`,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 0 40px rgba(99, 102, 241, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  zIndex: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: S.cyan, fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  <Sparkles size={14} />
                  <span>Studio Locked • Diffusion in Progress</span>
                </div>

                {/* Percentage Counter */}
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
                  {progressPercent}%
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: "#1e1e2a",
                  overflow: "hidden",
                  marginBottom: "12px",
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1 0%, #00d4ff 100%)",
                    transition: "width 0.3s ease",
                  }} />
                </div>

                <p style={{ margin: 0, fontSize: "13px", color: S.textSecondary }}>
                  {progressMessage || "Compiling diffusion latents..."}
                </p>
              </div>
            )}

            {/* Error Card with Retry Button */}
            {generationError && !generating && (
              <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                right: "20px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 15,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} />
                  <span>{generationError}</span>
                </div>
                <button
                  onClick={() => executeGenerate(lastGeneratedPrompt || promptRecipe)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Rendered Artwork Image */}
            <div style={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "calc(100vh - 160px)",
              display: generating ? "none" : "block",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 20px 48px rgba(0,0,0,0.8)",
              border: `1px solid ${S.cardBorder}`,
            }}>
              <img
                src={currentImage}
                alt="Generated artwork"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setCurrentImage(fallbackMain);
                  setImageLoading(false);
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 160px)",
                  objectFit: "contain",
                  display: "block",
                  clipPath: "inset(0 0 40px 0)",
                  marginBottom: "-40px",
                }}
              />
            </div>
          </div>

          {/* Action Row Under Canvas (Download 4K, Save, Publish) */}
          <div style={{
            padding: "10px 16px",
            borderTop: `1px solid ${S.panelBorder}`,
            background: S.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Go to Library detail */}
              <button
                onClick={() => router.push("/library")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${S.cardBorder}`,
                  color: S.textPrimary,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ImageIcon size={13} />
                Open Library
              </button>

              <button
                onClick={handleCopyPrompt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: `1px solid ${S.cardBorder}`,
                  color: S.textSecondary,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {copiedNotice ? <Check size={13} style={{ color: S.success }} /> : <Copy size={13} />}
                {copiedNotice ? "Copied!" : "Copy Prompt"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handleSavePrivate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: saveNotice ? "rgba(16,185,129,0.15)" : "transparent",
                  border: `1px solid ${saveNotice ? S.success : S.cardBorder}`,
                  color: saveNotice ? S.success : S.textPrimary,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {saveNotice ? <Check size={13} /> : <Bookmark size={13} />}
                {saveNotice ? "Saved to Cloud" : "Save to Cloud (Free)"}
              </button>

              <button
                onClick={handlePublishPublic}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: publishNotice ? "rgba(99,102,241,0.2)" : S.primary,
                  border: "none",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {publishNotice ? <Check size={13} /> : <Globe size={13} />}
                {publishNotice ? "Published to Explore!" : "+ Publish (Earn Royalties)"}
              </button>
            </div>
          </div>
        </div>

        {/* ── DRAGGABLE RESIZER HANDLE ────────────────────────── */}
        {!isMobileOrTablet && (
          <div
            onMouseDown={startResizing}
            style={{
              width: "6px",
              cursor: "col-resize",
              background: isResizing ? S.primary : "transparent",
              transition: "background 0.15s",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "2px", height: "32px", borderRadius: "1px", background: "rgba(255,255,255,0.2)" }} />
          </div>
        )}

        {/* ══ RIGHT PANEL: PROMPT COPILOT & ARMING CONTROLS ═════ */}
        <div
          style={{
            width: isMobileOrTablet ? "100%" : `${panelWidth}px`,
            minWidth: isMobileOrTablet ? "100%" : "300px",
            maxWidth: isMobileOrTablet ? "100%" : "800px",
            display: isMobileOrTablet ? (activeMobileTab === "assistant" ? "flex" : "none") : "flex",
            flexDirection: "column",
            background: S.panel,
            height: "100%",
            borderLeft: isMobileOrTablet ? "none" : `1px solid ${S.panelBorder}`,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${S.panelBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} style={{ color: S.cyan }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: S.textPrimary }}>
                Prompt Chat Copilot
              </span>
            </div>

            {/* Engine Selector Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setEngineOpen(!engineOpen)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${S.cardBorder}`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  color: S.textSecondary,
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <span>{selectedEngine.toUpperCase()}</span>
                <ChevronDown size={11} />
              </button>
              {engineOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  background: S.panel, border: `1px solid ${S.cardBorder}`,
                  borderRadius: "8px", padding: "4px", zIndex: 100, minWidth: "180px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
                }}>
                  {LLM_ENGINES.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => { setSelectedEngine(eng.id); setEngineOpen(false); }}
                      style={{
                        width: "100%", padding: "6px 10px", borderRadius: "4px",
                        background: selectedEngine === eng.id ? "rgba(99,102,241,0.2)" : "transparent",
                        border: "none", color: selectedEngine === eng.id ? S.cyan : S.textPrimary,
                        fontSize: "11px", textAlign: "left", cursor: "pointer",
                      }}
                    >
                      {eng.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversation Stream */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: "120px",
          }}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: "3px",
                }}
              >
                <div style={{
                  maxWidth: "92%",
                  padding: "9px 13px",
                  borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: msg.role === "user" ? "#1e293b" : "rgba(0, 212, 255, 0.05)",
                  border: msg.role === "user" ? "1px solid #334155" : "1px solid rgba(0, 212, 255, 0.2)",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: msg.role === "user" ? "#ffffff" : "#cbd5e1",
                }}>
                  {msg.content}

                  {/* Diff Badges if returned by Delta compiler */}
                  {msg.diff && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {msg.diff.added?.map((tag, idx) => (
                        <span key={idx} style={{ fontSize: "10px", background: "rgba(16,185,129,0.18)", color: S.success, padding: "2px 6px", borderRadius: "4px" }}>
                          + {tag}
                        </span>
                      ))}
                      {msg.diff.removed?.map((tag, idx) => (
                        <span key={idx} style={{ fontSize: "10px", background: "rgba(239,68,68,0.18)", color: S.error, padding: "2px 6px", borderRadius: "4px" }}>
                          - {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Chips */}
                  {msg.suggestedChips && msg.suggestedChips.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                      {msg.suggestedChips.map((chip, idx) => (
                        <button
                          key={idx}
                          disabled={isBusy}
                          onClick={() => handleChatDeltaSubmit(chip)}
                          style={{
                            fontSize: "10px",
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            background: "rgba(99,102,241,0.18)",
                            border: "1px solid rgba(99,102,241,0.35)",
                            color: "#c7d2fe",
                            cursor: isBusy ? "not-allowed" : "pointer",
                            fontWeight: 600,
                          }}
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "10px", color: S.textMuted }}>
                  {msg.role === "user" ? "You" : "Copilot"} · {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* ── BOTTOM CONTROLS & RECIPE INPUT ── */}
          <div style={{ flexShrink: 0, borderTop: `1px solid ${S.panelBorder}`, background: S.panel }}>
            {/* Style Boosters */}
            <div style={{ padding: "10px 16px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                  Style Boosters
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {STYLE_BOOSTERS.map((booster) => {
                  const isApplied = promptRecipe.toLowerCase().includes(booster.label.toLowerCase());
                  return (
                    <button
                      key={booster.label}
                      disabled={isBusy}
                      onClick={() => toggleBooster(booster.label)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 500,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.5 : 1,
                        border: isApplied ? `1px solid ${S.cyan}` : `1px solid ${S.cardBorder}`,
                        background: isApplied ? "rgba(0,212,255,0.14)" : "rgba(255,255,255,0.03)",
                        color: isApplied ? S.cyan : "#cbd5e1",
                      }}
                    >
                      <span>{booster.icon}</span>
                      <span>{booster.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Prompt Recipe Box */}
            <div style={{ padding: "8px 16px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: S.textSecondary, textTransform: "uppercase" }}>
                  Prompt Recipe
                </span>
                <span style={{ fontSize: "10px", color: S.textMuted }}>
                  {promptRecipe.length}/4000
                </span>
              </div>

              <textarea
                id="studio-prompt-recipe"
                value={promptRecipe}
                disabled={isBusy}
                onChange={(e) => setPromptRecipe(e.target.value)}
                rows={3}
                placeholder={isBusy ? "Synthesis in progress..." : "Describe your concept or enter conversational instructions..."}
                style={{
                  width: "100%",
                  background: isBusy ? "#0a0e18" : S.card,
                  border: `1px solid ${isBusy ? S.cardBorder : S.cardBorder}`,
                  borderRadius: "8px",
                  padding: "8px 10px",
                  color: isBusy ? S.textMuted : S.textPrimary,
                  fontSize: "12.5px",
                  lineHeight: "1.4",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                  minHeight: "64px",
                  opacity: isBusy ? 0.6 : 1,
                }}
              />

              {/* ✨ Option A: "AI Master Formula Armed" Indicator Pill */}
              {armedMasterFormula && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: `1px solid ${S.primary}`,
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#c7d2fe",
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={12} style={{ color: S.cyan }} />
                    <span>AI Master Formula Armed • Ready for FLUX</span>
                  </div>
                  <button
                    onClick={() => setArmedMasterFormula(null)}
                    title="Disarm Master Formula and return to clean prompt"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Action Toolbar under Box */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                <button
                  id="btn-enhance-prompt"
                  disabled={isBusy}
                  onClick={handleEnhance}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    color: S.cyan,
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  <Sparkles size={12} />
                  <span>{isEnhancing ? "Enhancing..." : "✨ Enhance with Gemini"}</span>
                </button>

                <button
                  id="btn-copilot-tweak"
                  disabled={isBusy}
                  onClick={() => handleChatDeltaSubmit(promptRecipe)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: `1px solid ${S.cardBorder}`,
                    color: S.textSecondary,
                    fontSize: "11px",
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  <span>Chat Copilot</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {/* Dynamic Credit Generate Button (Task Lockdown Protected) */}
            <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${S.panelBorder}`, background: "#0a0e18" }}>
              <button
                id="studio-generate-btn"
                onClick={handleGenerate}
                disabled={isBusy}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: isBusy ? "#1e293b" : S.primary,
                  border: "none",
                  borderRadius: "10px",
                  cursor: isBusy ? "not-allowed" : "pointer",
                  color: isBusy ? S.textMuted : "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: isBusy ? "none" : "0 0 20px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.15s",
                }}
              >
                {isBusy ? (
                  <>
                    <div style={{
                      width: "14px", height: "14px", borderRadius: "50%",
                      border: `2px solid ${S.textMuted}`, borderTopColor: S.cyan,
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <span>Synthesizing ({progressPercent}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate Artwork (1 Credit)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#64748b" }}>Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}
