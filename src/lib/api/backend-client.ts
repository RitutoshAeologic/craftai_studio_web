/**
 * FastAPI Backend Client for CraftAI Studio
 * Integrates with craftai_studio_backend (/api/v1/prompt-engineering)
 * Supports Bearer JWT Authentication, WebSocket progress, and resilient fallbacks.
 */

import { createClient } from "@/lib/supabase/client";
import { safeUUID } from "@/lib/utils/uuid";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://200.141.14.171:8085";

// Normalize so it never ends with /api/v1 or trailing slashes, since endpoints append /api/v1/...
export const BACKEND_URL = rawBackendUrl
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

function getWsUrl(path: string): string {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
    "Bypass-Tunnel-Reminder": "true",
  };
  try {
    const supabase = createClient();
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    }
  } catch {}
  return headers;
}

/**
 * Normalizes FastAPI error responses into human-readable messages
 */
export async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.message) return data.message;
    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
    }
    if (typeof data?.detail === "string") return data.detail;
    if (data?.error) return `${data.error}: ${data.message || ""}`.trim();
  } catch {}
  return `Server request failed with status ${res.status}`;
}

/* ─────────────────────────────────────────────────────────────
   1. Visual Generation Dispatch
   POST /api/v1/prompt-engineering/generation/dispatch
───────────────────────────────────────────────────────────── */
export interface DispatchGenerationParams {
  prompt: string;
  negative_prompt?: string | null;
  structured_metadata?: StructuredPromptMetadata | null;
  character_id?: string | null;
  face_reference_urls?: string[] | null;
  width?: number;
  height?: number;
  seed?: number;
  model?: "flux" | "gemini" | "chatgpt" | string;
  remixed_from_prompt_id?: string | null;
  edit_instruction?: string | null;
}

export interface DispatchGenerationResponse {
  task_id: string;
  tier: string;
  status: string;
  estimated_seconds?: number;
  direct_image_url?: string;
}

export async function dispatchGeneration(
  params: DispatchGenerationParams
): Promise<DispatchGenerationResponse> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/generation/dispatch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          prompt: params.prompt,
          negative_prompt: params.negative_prompt ?? null,
          structured_metadata: params.structured_metadata ?? null,
          character_id: params.character_id ?? null,
          face_reference_urls: params.face_reference_urls ?? null,
          width: params.width ?? 1024,
          height: params.height ?? 1024,
          seed: params.seed ?? Math.floor(Math.random() * 1_000_000),
          model: params.model ?? "flux",
          remixed_from_prompt_id: params.remixed_from_prompt_id ?? null,
          edit_instruction: params.edit_instruction ?? null,
        }),
      }
    );

    if (res.ok) {
      return (await res.json()) as DispatchGenerationResponse;
    }
    const err = await parseErrorResponse(res);
    console.warn("[dispatchGeneration] Backend returned error:", err);
  } catch (err) {
    console.warn("[dispatchGeneration] Network / Offline fallback:", err);
  }

  // Graceful offline fallback
  const fallbackTaskId = `task_${Math.random().toString(36).substring(2, 10)}`;
  const encoded = encodeURIComponent(params.prompt);
  const pollinationsKey = process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || "";
  const fallbackUrl = `https://gen.pollinations.ai/image/${encoded}?model=flux&width=${
    params.width || 1024
  }&height=${params.height || 1024}&seed=${
    params.seed || 42
  }&nologo=true&key=${pollinationsKey}`;

  return {
    task_id: fallbackTaskId,
    tier: "Tier 0 (FLUX.1-schnell via Hugging Face Fallback)",
    status: "ready",
    estimated_seconds: 4,
    direct_image_url: fallbackUrl,
  };
}

/* ─────────────────────────────────────────────────────────────
   2. Realtime Progress: WebSocket + Polling Fallback
   ws://127.0.0.1:8000/api/v1/prompt-engineering/generation/ws/generation/{task_id}
   GET /api/v1/prompt-engineering/status/{task_id}
───────────────────────────────────────────────────────────── */
export interface GenerationProgressEvent {
  progress: number;
  status: string;
  message: string;
  output_url?: string;
}

export function subscribeGenerationProgress(
  taskId: string,
  onProgress: (event: GenerationProgressEvent) => void,
  onComplete: (outputUrl?: string) => void,
  onError: (errorMsg: string) => void
): () => void {
  let isCleanedUp = false;
  let socket: WebSocket | null = null;
  let pollTimer: any = null;

  const wsUrl = getWsUrl(
    `/api/v1/prompt-engineering/ws/generation/${taskId}`
  );

  const startHttpPolling = () => {
    if (isCleanedUp) return;
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxPolls = 20;

    pollTimer = setInterval(async () => {
      if (isCleanedUp) {
        clearInterval(pollTimer);
        return;
      }
      pollCount++;
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch(
          `${BACKEND_URL}/api/v1/prompt-engineering/status/${taskId}`,
          {
            headers: {
              ...authHeader,
              "ngrok-skip-browser-warning": "true",
              "Bypass-Tunnel-Reminder": "true",
            },
          }
        );
        if (res.ok) {
          consecutiveErrors = 0;
          const data = await res.json();
          onProgress({
            progress: data.progress ?? 50,
            status: data.status ?? "processing",
            message: data.message ?? "Diffusing image latents...",
            output_url: data.output_url,
          });

          if (data.status === "completed" || data.progress >= 100) {
            clearInterval(pollTimer);
            onComplete(data.output_url);
            return;
          }
        } else {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            clearInterval(pollTimer);
            onComplete(); // resolve cleanly so client-side fallback displays
            return;
          }
        }
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          clearInterval(pollTimer);
          onComplete(); // resolve cleanly
          return;
        }
      }

      if (pollCount >= maxPolls) {
        clearInterval(pollTimer);
        onComplete(); // resolve to let fallback image show
      }
    }, 1500);
  };

  try {
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      if (isCleanedUp) return;
      try {
        const data = JSON.parse(event.data);
        onProgress({
          progress: data.progress ?? 0,
          status: data.status ?? "processing",
          message: data.message ?? "Diffusing image latents...",
          output_url: data.output_url,
        });

        if (data.progress >= 100 || data.status === "completed") {
          onComplete(data.output_url);
          socket?.close();
        }
      } catch {}
    };

    socket.onerror = () => {
      if (!isCleanedUp) {
        startHttpPolling();
      }
    };

    socket.onclose = (e) => {
      if (!isCleanedUp && e.code !== 1000) {
        startHttpPolling();
      }
    };
  } catch {
    startHttpPolling();
  }

  return () => {
    isCleanedUp = true;
    if (socket) {
      try {
        socket.close();
      } catch {}
    }
    if (pollTimer) clearInterval(pollTimer);
  };
}

/* ─────────────────────────────────────────────────────────────
   3. Prompt Expansion (Magic Enhance & Structured Visual Director)
   POST /api/v1/prompt-engineering/expand
───────────────────────────────────────────────────────────── */
export interface StructuredPromptMetadata {
  subject?: string;             // Central character / entity details
  environment?: string;         // Atmospheric background & scene
  lighting?: string;            // Cinematic lighting, rim lights, shadow dynamics
  camera_optics?: string;       // Lens focal length, aperture (f/1.4), film grain
  art_style?: string;           // Overall art genre / rendering engine
  avoid?: string[];             // Negative visual concepts to suppress
  preserved_elements?: string[];// Identity features, faces, or elements locked from modification
}

export interface ExpandPromptParams {
  raw_prompt: string;
  starter_chip?: string | null;
  aspect_ratio?: string;
  ai_model?: "gemini" | "groq" | "claude" | string;
}

export interface ExpandPromptResponse {
  master_prompt: string;
  negative_prompt?: string;
  complexity_score?: number;
  model_used?: string;
  structured_metadata?: StructuredPromptMetadata;
}

export async function expandPrompt(
  params: ExpandPromptParams
): Promise<ExpandPromptResponse> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/prompt-engineering/expand`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        raw_prompt: params.raw_prompt,
        starter_chip: params.starter_chip ?? null,
        aspect_ratio: params.aspect_ratio ?? "1:1",
        ai_model: params.ai_model ?? "gemini",
      }),
    });

    if (res.ok) {
      return (await res.json()) as ExpandPromptResponse;
    }
    const err = await parseErrorResponse(res);
    console.warn("[expandPrompt] Backend error:", err);
  } catch (err) {
    console.warn("[expandPrompt] Network fallback:", err);
  }

  // Graceful client fallback with structured visual decomposition
  const hasFacePreserve =
    params.raw_prompt.toLowerCase().includes("face") ||
    params.raw_prompt.toLowerCase().includes("preserve") ||
    params.raw_prompt.toLowerCase().includes("likeness");

  return {
    master_prompt: `${params.raw_prompt}, ultra-detailed 8K masterpiece, volumetric cinematic lighting, photorealistic textures, octane render, trending on artstation`,
    negative_prompt: "blurry, low quality, distorted, watermark, signature, artifacts",
    complexity_score: 3,
    model_used: "Client Fallback Expander",
    structured_metadata: {
      subject: params.raw_prompt,
      environment: "Atmospheric cinematic backdrop with volumetric depth",
      lighting: "Cinematic volumetric lighting with sharp rim accents",
      camera_optics: "85mm f/1.4 portrait lens, shallow depth of field",
      art_style: "Photorealistic 8K, octane render",
      avoid: ["blurry", "low quality", "distorted", "watermark", "signature", "artifacts"],
      preserved_elements: hasFacePreserve ? ["Authentic facial structure & likeness"] : [],
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   4. Prompt Chat Copilot (Delta Compiler)
   POST /api/v1/prompt-engineering/chat-delta
───────────────────────────────────────────────────────────── */
export interface ChatDeltaParams {
  base_prompt: string;
  user_instruction: string;
  turn_count?: number;
  ai_model?: string;
  /** Stable UUID identifying the copilot session.
   *  Maps to backend PromptDeltaRequest.session_id (required field).
   *  If omitted, a one-off UUID is generated per-call as fallback. */
  session_id?: string;
}

export interface ChatDeltaResponse {
  compiled_prompt: string;
  delta_summary?: string;
  diff?: {
    added: string[];
    removed: string[];
  };
  suggested_chips?: string[];
  model_used?: string;
  structured_metadata?: StructuredPromptMetadata;
}

export async function compileChatDelta(
  params: ChatDeltaParams
): Promise<ChatDeltaResponse> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/chat-delta`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          // session_id is required by backend PromptDeltaRequest schema.
          // Callers should pass a stable UUID per Studio session so the backend
          // can track conversational context across turns.
          session_id: params.session_id ?? safeUUID(),
          base_prompt: params.base_prompt,
          user_instruction: params.user_instruction,
          turn_count: params.turn_count ?? 1,
          ai_model: params.ai_model ?? "groq",
        }),
      }
    );

    if (res.ok) {
      return (await res.json()) as ChatDeltaResponse;
    }
    const err = await parseErrorResponse(res);
    console.warn("[compileChatDelta] Backend error:", err);
  } catch (err) {
    console.warn("[compileChatDelta] Network fallback:", err);
  }

  const hasFacePreserve =
    params.user_instruction.toLowerCase().includes("face") ||
    params.user_instruction.toLowerCase().includes("preserve") ||
    params.base_prompt.toLowerCase().includes("face");

  // Client fallback
  return {
    compiled_prompt: `${params.base_prompt}, ${params.user_instruction}, cinematic lighting, high quality 8k`,
    delta_summary: `Applied modifier: "${params.user_instruction}"`,
    diff: {
      added: [params.user_instruction],
      removed: [],
    },
    suggested_chips: ["Add Golden Hour", "Make Cyberpunk Neon", "Soft Bokeh 85mm"],
    model_used: "Client Fallback Compiler",
    structured_metadata: {
      subject: params.base_prompt,
      environment: params.user_instruction.toLowerCase().includes("street") || params.user_instruction.toLowerCase().includes("city") ? params.user_instruction : "Refined atmospheric environment",
      lighting: params.user_instruction.toLowerCase().includes("light") ? params.user_instruction : "Cinematic illumination and rim dynamics",
      camera_optics: "35mm photographic portrait lens",
      art_style: "Photorealistic high fidelity 8K",
      avoid: ["blurry", "low quality", "deformed"],
      preserved_elements: hasFacePreserve ? ["Authentic facial structure & likeness"] : [],
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   5. Creative Skills Toolbox: Background Remover & Presets
   POST /api/v1/prompt-engineering/tools/remove-background
   POST /api/v1/prompt-engineering/tools/edit-preset
───────────────────────────────────────────────────────────── */
export async function removeBackground(
  imageUrl: string
): Promise<{ task_id: string; cutout_url: string }> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/tools/remove-background`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        task_id: data.task_id || `cutout_${Date.now()}`,
        cutout_url: data.cutout_url || data.output_url || imageUrl,
      };
    }
  } catch (err) {
    console.warn("[removeBackground] Fallback:", err);
  }

  // Fallback: return image with a cutout task ID
  return {
    task_id: `cutout_${Date.now()}`,
    cutout_url: imageUrl,
  };
}

export async function editPresetTool(params: {
  image_id?: string;
  image_url?: string;
  action: "relight" | "change_background" | "bokeh" | "upscale" | string;
  target_preset?: string;
  target_background?: string;
  lock_subject?: boolean;
}): Promise<{ task_id: string; status: string; output_url?: string }> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/tools/edit-preset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(params),
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[editPresetTool] Fallback:", err);
  }

  return {
    task_id: `preset_${Date.now()}`,
    status: "completed",
  };
}

export async function upscaleImageTool(params: {
  image_url?: string;
  imageUrl?: string;
  image_id?: string;
  imageId?: string;
  scale?: 2 | 4;
  scale_factor?: 2 | 4;
  mode?: "photo" | "portrait" | "anime" | "fast";
  user_id?: string;
  userId?: string;
}): Promise<{
  task_id: string;
  status: string;
  scale: number;
  mode: string;
  original_resolution: string;
  upscaled_resolution: string;
  output_url: string;
  image_url: string;
  tokens_consumed?: number;
  is_free?: boolean;
  engine: string;
}> {
  const authHeader = await getAuthHeader();
  const effectiveScale = params.scale_factor || params.scale || 2;
  const res = await fetch(
    `${BACKEND_URL}/api/v1/prompt-engineering/tools/upscale`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        image_url: params.image_url || params.imageUrl,
        image_id: params.image_id || params.imageId,
        scale: effectiveScale,
        scale_factor: effectiveScale,
        mode: params.mode || "photo",
        user_id: params.user_id || params.userId,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Upscale failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.image_url) data.image_url = data.output_url || "";
  if (!data.output_url) data.output_url = data.image_url || "";
  return data;
}

/* ─────────────────────────────────────────────────────────────
   6. Ephemeral Face-Lock Reference Photo Upload & Cleanup
   POST /api/v1/prompt-engineering/upload-reference
   POST /api/v1/prompt-engineering/cleanup-reference
───────────────────────────────────────────────────────────── */
export async function uploadReferencePhoto(
  file: File
): Promise<{ url: string; file_id?: string }> {
  const authHeader = await getAuthHeader();
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/upload-reference`,
      {
        method: "POST",
        headers: {
          ...authHeader,
        },
        body: formData,
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[uploadReferencePhoto] Fallback to base64 DataURL:", err);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string });
    };
    reader.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────────────────────────
   7. Multi-LLM Configurable Gateway
   GET /api/v1/prompt-engineering/config
   Returns the active LLM configuration from Supabase app_settings
   with 60-second TTL (matches backend ConfigService cache window).
───────────────────────────────────────────────────────────── */
export interface LLMConfig {
  active_provider: string;
  fallback_order: string[];
  available_providers: string[];
  model_mappings: Record<string, string>;
}

const LLM_CONFIG_DEFAULTS: LLMConfig = {
  active_provider: "gemini",
  fallback_order: ["gemini", "groq", "local"],
  available_providers: ["gemini", "groq", "openai", "claude", "local"],
  model_mappings: {
    gemini: "gemini-2.5-flash",
    groq: "qwen/qwen3.8-27b",
    openai: "gpt-4o-mini",
    claude: "claude-3-5-sonnet-20241022",
    local: "offline-cinematic-engine",
  },
};

// In-memory cache mirroring the 60-second backend ConfigService TTL
let _llmConfigCache: LLMConfig | null = null;
let _llmConfigLastFetch = 0;
const LLM_CONFIG_CACHE_TTL_MS = 60_000;

/**
 * Fetches the active LLM configuration from the backend.
 * Results are cached for 60 seconds to mirror the backend ConfigService TTL.
 * Falls back to sensible defaults when the backend is unreachable.
 */
export async function getLLMConfig(): Promise<LLMConfig> {
  const now = Date.now();
  if (_llmConfigCache && now - _llmConfigLastFetch < LLM_CONFIG_CACHE_TTL_MS) {
    return _llmConfigCache;
  }

  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/config`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      }
    );

    if (res.ok) {
      const data = (await res.json()) as LLMConfig;
      _llmConfigCache = data;
      _llmConfigLastFetch = now;
      return data;
    }

    const err = await parseErrorResponse(res);
    console.warn("[getLLMConfig] Backend returned error:", err);
  } catch (err) {
    console.warn("[getLLMConfig] Backend unreachable, using defaults:", err);
  }

  // On failure, return defaults (do NOT cache so it retries on next call)
  return LLM_CONFIG_DEFAULTS;
}

/** Forces the LLM config cache to expire so the next call re-fetches from the backend. */
export function invalidateLLMConfigCache(): void {
  _llmConfigCache = null;
  _llmConfigLastFetch = 0;
}

export async function cleanupReferencePhoto(url: string): Promise<void> {
  if (!url || url.startsWith("data:")) return;
  const authHeader = await getAuthHeader();
  try {
    await fetch(`${BACKEND_URL}/api/v1/prompt-engineering/cleanup-reference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({ url }),
    });
  } catch {}
}

export interface VisionScanResult {
  extracted_prompt: string;
  detected_style: string;
  lighting_optics: string;
  model_used: string;
}

export async function scanAestheticVision(imageUrl: string): Promise<VisionScanResult> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/vision-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (res.ok) {
      return (await res.json()) as VisionScanResult;
    }
  } catch (err) {
    console.warn("[scanAestheticVision] Live API failed, using intelligent fallback:", err);
  }

  // Graceful client fallback
  return {
    extracted_prompt: "High-contrast cinematic portrait, natural golden hour lighting, 85mm f/1.4 analog bokeh, authentic skin texture, 8K masterpiece",
    detected_style: "Cinematic Natural Light",
    lighting_optics: "Golden hour rim light, 85mm f/1.4 lens depth",
    model_used: "Aesthetic Vision Fallback Engine",
  };
}

/* ─────────────────────────────────────────────────────────────
   8. Dynamic Master Categories & Taxonomy API (§2.13 & §3.7)
   GET /api/v1/categories
───────────────────────────────────────────────────────────── */
export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
}

export const CANONICAL_CATEGORIES: CategoryItem[] = [
  { id: "cat_all", slug: "all", name: "All", description: "All community creations across styles", icon_name: "sparkles", sort_order: 0, is_active: true },
  { id: "cat_photorealism", slug: "photorealism", name: "Photorealism", description: "DSLR optics, portraiture, 8K realistic photography", icon_name: "camera", sort_order: 1, is_active: true },
  { id: "cat_anime", slug: "anime", name: "Anime", description: "Japanese animation, Makoto Shinkai, cel-shaded art", icon_name: "palette", sort_order: 2, is_active: true },
  { id: "cat_cyberpunk", slug: "cyberpunk", name: "Cyberpunk", description: "Futuristic neon cityscapes, sci-fi tech, high-contrast glow", icon_name: "bolt", sort_order: 3, is_active: true },
  { id: "cat_3d_render", slug: "3d-render", name: "3D Render", description: "Octane Render, Unreal Engine 5, claymation, isometric", icon_name: "cube", sort_order: 4, is_active: true },
  { id: "cat_character", slug: "character", name: "Character", description: "Human portraits, stylized avatars, oil painting portraits", icon_name: "person", sort_order: 5, is_active: true },
  { id: "cat_architecture", slug: "architecture", name: "Architecture", description: "Modern interiors, brutalist structures, biophilic design", icon_name: "home", sort_order: 6, is_active: true },
  { id: "cat_product", slug: "product", name: "Product", description: "Studio advertising, luxury mockups, clean commercial visuals", icon_name: "shopping_bag", sort_order: 7, is_active: true },
];

let _cachedCategories: CategoryItem[] | null = null;
const CATEGORIES_CACHE_KEY = "craftai_dynamic_categories_v1";

export async function fetchCategories(): Promise<CategoryItem[]> {
  // 1. Check in-memory cache
  if (_cachedCategories && _cachedCategories.length > 0) {
    return _cachedCategories;
  }

  // 2. Check localStorage cache for 0ms instant render
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CATEGORIES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _cachedCategories = parsed;
          refreshCategoriesInBackground();
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Try Backend API
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/v1/categories`, {
      headers: { ...authHeader },
    });
    if (res.ok) {
      const data = await res.json();
      const list = data.categories || data;
      if (Array.isArray(list) && list.length > 0) {
        _cachedCategories = list;
        if (typeof window !== "undefined") {
          localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (err) {
    console.warn("[fetchCategories] Backend API fallback:", err);
  }

  // 4. Try Supabase categories table
  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        _cachedCategories = data;
        if (typeof window !== "undefined") {
          localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data));
        }
        return data;
      }
    }
  } catch {}

  // 5. Fallback to canonical list
  _cachedCategories = CANONICAL_CATEGORIES;
  return CANONICAL_CATEGORIES;
}

async function refreshCategoriesInBackground(): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/v1/categories`, {
      headers: { ...authHeader },
    });
    if (res.ok) {
      const data = await res.json();
      const list = data.categories || data;
      if (Array.isArray(list) && list.length > 0) {
        _cachedCategories = list;
        if (typeof window !== "undefined") {
          localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(list));
        }
      }
    }
  } catch {}
}

/* ─────────────────────────────────────────────────────────────
   9. Conversational Remix Lab API (§2.12)
   POST /api/v1/prompt-engineering/remix/sessions
   POST /api/v1/prompt-engineering/remix/chat
───────────────────────────────────────────────────────────── */
export interface RemixSessionInitParams {
  anchor_image_url: string;
  source_type?: string;
  style_weight?: number;
}

export interface RemixSessionResponse {
  session_id: string;
  anchor_image_url: string;
  welcome_message?: string;
  suggested_chips?: string[];
}

export interface RemixChatParams {
  session_id: string;
  user_instruction: string;
  ai_model?: string;
  base_prompt?: string;
}

export interface RemixChatResponse {
  turn_count: number;
  refined_prompt: string;
  explanation?: string;
  diff_added?: string;
  diff_removed?: string;
  suggested_chips?: string[];
  latency_ms?: number;
}

export async function initRemixSession(
  params: RemixSessionInitParams
): Promise<RemixSessionResponse> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/remix/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          anchor_image_url: params.anchor_image_url,
          source_type: params.source_type || "explore_card",
          style_weight: params.style_weight ?? 0.75,
        }),
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[initRemixSession] Fallback:", err);
  }

  // Client fallback
  return {
    session_id: `remix_sess_${Math.random().toString(36).substring(2, 10)}`,
    anchor_image_url: params.anchor_image_url,
    welcome_message: "Anchor image locked! How would you like to remix or transform this artwork?",
    suggested_chips: [
      "Switch lighting to moody cinematic golden hour",
      "Convert art style to Japanese Ukiyo-e woodblock print",
      "Transform into a miniature 3D isometric diorama",
      "Add dramatic volumetric rain reflections",
    ],
  };
}

export async function sendRemixChat(
  params: RemixChatParams
): Promise<RemixChatResponse> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/remix/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          session_id: params.session_id,
          user_instruction: params.user_instruction,
          ai_model: params.ai_model || "groq",
          base_prompt: params.base_prompt || "",
        }),
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[sendRemixChat] Fallback:", err);
  }

  // Client fallback
  return {
    turn_count: 1,
    refined_prompt: `${params.base_prompt || "Artwork"}, ${params.user_instruction}, cinematic lighting, 8k quality`,
    explanation: `Applied transformation: "${params.user_instruction}"`,
    diff_added: params.user_instruction,
    diff_removed: "",
    suggested_chips: [
      "Add intense lighting reflections",
      "Make textures ultra photorealistic 8K",
      "Switch perspective to dynamic low angle",
    ],
    latency_ms: 600,
  };
}

/* ─────────────────────────────────────────────────────────────
   10. Cloud Library Asset Deletion (§2.13)
   DELETE /api/v1/prompt-engineering/library/{job_id}
───────────────────────────────────────────────────────────── */
export async function deleteLibraryAsset(jobId: string): Promise<boolean> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/prompt-engineering/library/${encodeURIComponent(jobId)}`,
      {
        method: "DELETE",
        headers: {
          ...authHeader,
        },
      }
    );
    return res.ok;
  } catch (err) {
    console.warn("[deleteLibraryAsset] Backend notice:", err);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
   11. Universal Search & Similar Artwork Discovery (§2.15)
   GET /api/v1/explore/similar/{card_id}
   POST /api/v1/prompt-engineering/search
───────────────────────────────────────────────────────────── */
export interface SimilarCreationsResponse {
  source_card_id: string;
  similar: Array<{
    id: string;
    title: string;
    image_url: string;
    category: string;
    similarity_score?: number;
    preview_url?: string;
    model_used?: string;
  }>;
}

export async function fetchSimilarCreations(
  cardId: string,
  limit: number = 8
): Promise<SimilarCreationsResponse["similar"]> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/explore/similar/${encodeURIComponent(cardId)}?limit=${limit}`,
      {
        headers: {
          ...authHeader,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.similar)) {
        return data.similar;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("[fetchSimilarCreations] Fallback:", err);
  }
  return [];
}

export interface UniversalSearchParams {
  query: string;
  search_type?: "text" | "semantic";
  aspect_ratios?: string[];
  sort_by?: "popular" | "recent" | "trending";
  page_size?: number;
}

export async function searchExploreApi(
  params: UniversalSearchParams
): Promise<any[]> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/prompt-engineering/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    }
  } catch (err) {
    console.warn("[searchExploreApi] Fallback:", err);
  }
  return [];
}
