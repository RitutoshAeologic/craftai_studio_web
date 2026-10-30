/**
 * CraftAI Studio — Creative AI Tools API Client
 * Compatible with FastAPI v2.1.0 backend (/api/v1/prompt-engineering/tools and /api/v1/tools)
 * Features automatic camelCase -> snake_case serialization, JWT auth, and tunnel tolerance.
 */

import { createClient } from "@/lib/supabase/client";

// Normalize base URL to always target the FastAPI Gateway (Port 8000 by default)
const rawBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

export const API_BASE = rawBase.replace(/\/+$/, "").endsWith("/api/v1")
  ? rawBase.replace(/\/+$/, "")
  : `${rawBase.replace(/\/+$/, "")}/api/v1`;

let customAuthToken: string | null = null;

export const setAuthToken = (token?: string) => {
  customAuthToken = token || null;
};

async function getRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "Bypass-Tunnel-Reminder": "true",
  };

  if (customAuthToken) {
    headers["Authorization"] = `Bearer ${customAuthToken}`;
    return headers;
  }

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

// ── Types ─────────────────────────────────────────────────────────────
export interface BaseToolResponse {
  task_id: string;
  status: "completed" | "failed" | string;
  output_url: string;
  image_url: string;
  url: string;
  cutout_url?: string;
  credits_deducted: number;
  tokens_consumed: number;
  latency_ms?: number;
  error_message?: string;
  mode?: string;
  target_ratio?: string;
  resolution?: string;
  original_resolution?: string;
  upscaled_resolution?: string;
  engine?: string;
  is_free?: boolean;
  product_name?: string;
  topic?: string;
  headline?: string;
}

export interface AiBackgroundPayload {
  imageUrl?: string;
  image_url?: string;
  mode?: "pure_white" | "smart" | "custom" | string;
  customBackdrop?: string;
  custom_backdrop?: string;
  aspectRatio?: "Auto" | "1:1" | "4:5" | "9:16" | "16:9" | string;
  aspect_ratio?: string;
  quality?: "1k" | "2k";
  userId?: string;
  user_id?: string;
}

export interface AiExpandPayload {
  imageUrl?: string;
  image_url?: string;
  targetRatio?: "16:9" | "9:16" | "1:1" | "4:5" | "3:4" | "4:3" | "2:3" | "3:2" | string;
  target_ratio?: string;
  quality?: "1k" | "2k";
  userId?: string;
  user_id?: string;
}

export interface UpscaleParams {
  imageUrl?: string;
  image_url?: string;
  imageId?: string;
  image_id?: string;
  scale?: 2 | 4;
  scaleFactor?: 2 | 4 | number | string;
  scale_factor?: 2 | 4 | number | string;
  mode?: "photo" | "portrait" | "anime" | "fast" | string;
  userId?: string;
  user_id?: string;
}

export type UpscalePayload = UpscaleParams;

export interface UpscaleResponse {
  task_id: string;
  status: "completed" | "failed" | string;
  scale: number;
  mode: string;
  original_resolution: string;
  upscaled_resolution: string;
  output_url: string;
  image_url: string;
  tokens_consumed?: number;
  is_free?: boolean;
  engine: string;
}

export interface ProductDetailPayload {
  imageUrl?: string;
  image_url?: string;
  productName?: string;
  product_name?: string;
  aspectRatio?: string;
  aspect_ratio?: string;
  language?: string;
  quality?: "1k" | "2k";
  userId?: string;
  user_id?: string;
}

export interface MarketingPosterPayload {
  imageUrl?: string;
  image_url?: string;
  topic?: string;
  category?: "Beverage" | "Fashion" | "Hiring" | "Flash Sale" | "Event" | "Commercial" | "Promotion" | string;
  headline?: string;
  aspectRatio?: "4:5" | "9:16" | "1:1" | "16:9" | string;
  aspect_ratio?: string;
  language?: string;
  quality?: "1k" | "2k";
  userId?: string;
  user_id?: string;
}

export interface ObjectEraserPayload {
  imageUrl?: string;
  image_url?: string;
  maskBase64?: string;
  mask_base64?: string;
  maskUrl?: string;
  mask_url?: string;
  userId?: string;
  user_id?: string;
}

export interface ColorizerPayload {
  imageUrl?: string;
  image_url?: string;
  saturation?: number;
  userId?: string;
  user_id?: string;
}

export interface VisionScanResponse {
  extracted_prompt: string;
  detected_style: string;
  lighting_optics: string;
  model_used: string;
}

export interface ToolHistoryItem {
  id: string;
  user_id: string;
  tool_type: string;
  input_image_url?: string;
  output_image_url: string;
  parameters?: Record<string, any>;
  credits_consumed: number;
  latency_ms?: number;
  status: string;
  created_at: string;
}

/**
 * Normalizes any frontend payload object to strict snake_case expected by FastAPI
 */
function normalizePayload(body: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    // Map camelCase keys to snake_case
    switch (key) {
      case "imageUrl":
        normalized["image_url"] = value;
        break;
      case "imageId":
        normalized["image_id"] = value;
        break;
      case "customBackdrop":
        normalized["custom_backdrop"] = value;
        break;
      case "aspectRatio":
        normalized["aspect_ratio"] = value;
        break;
      case "targetRatio":
        normalized["target_ratio"] = value;
        break;
      case "productName":
        normalized["product_name"] = value;
        break;
      case "maskBase64":
        normalized["mask_base64"] = value;
        break;
      case "maskUrl":
        normalized["mask_url"] = value;
        break;
      case "scaleFactor":
        normalized["scale_factor"] = value;
        break;
      case "userId":
        normalized["user_id"] = value;
        break;
      default:
        normalized[key] = value;
    }
  }
  return normalized;
}

async function handleToolRequest<T extends BaseToolResponse>(
  endpoint: string,
  rawBody: Record<string, any>
): Promise<T> {
  const headers = await getRequestHeaders();
  const body = normalizePayload(rawBody);

  // Both direct /tools and /prompt-engineering/tools are supported by the backend
  const url = `${API_BASE}/prompt-engineering/tools${endpoint}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      // Guarantee triple URL parity fallback
      if (!data.image_url) data.image_url = data.output_url || data.url || "";
      if (!data.output_url) data.output_url = data.image_url || data.url || "";
      if (!data.url) data.url = data.output_url || data.image_url || "";
      return data;
    }

    let errorDetail = `Tool request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail =
        errJson.message ||
        (Array.isArray(errJson.detail) ? errJson.detail.map((d: any) => d.msg).join(", ") : errJson.detail) ||
        errJson.error ||
        errorDetail;
    } catch {}

    throw new Error(errorDetail);
  } catch (err: any) {
    console.warn(`[toolsApi${endpoint}] Network / execution error:`, err);
    throw err;
  }
}

// ── Standalone Upscale Functions ──────────────────────────────────────
export async function upscaleImage({
  imageUrl,
  image_url,
  imageId,
  image_id,
  scale = 2,
  mode = "photo",
  userId,
  user_id,
}: UpscaleParams): Promise<UpscaleResponse> {
  const headers = await getRequestHeaders();
  const url = `${API_BASE}/prompt-engineering/tools/upscale`;

  const body = {
    image_url: imageUrl || image_url,
    image_id: imageId || image_id,
    scale: scale,
    scale_factor: scale,
    mode: mode,
    user_id: userId || user_id,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errMessage = `Upscale failed: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errMessage = errJson.message || errJson.detail || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  const data = (await res.json()) as UpscaleResponse;
  if (!data.image_url) data.image_url = data.output_url || "";
  if (!data.output_url) data.output_url = data.image_url || "";
  return data;
}

export async function upscaleWithFetch(
  imageUrl: string,
  scale: 2 | 4 = 2,
  mode: "photo" | "portrait" | "anime" | "fast" = "photo"
): Promise<string> {
  const data = await upscaleImage({ imageUrl, scale, mode });
  return data.output_url || data.image_url;
}

// ── API Methods ────────────────────────────────────────────────────────
export const toolsApi = {
  // 1. Remove Background (Free / 0 Cr)
  removeBackground: async (
    imageUrl: string,
    userId?: string
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/remove-background", {
      image_url: imageUrl,
      user_id: userId,
    });
  },

  // 2. AI Backgrounds (pure_white 0 Cr, smart 10 Cr, custom 10 Cr)
  generateAiBackground: async (
    payload: AiBackgroundPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/ai-background", payload);
  },

  // 3. AI Expand Outpainting (10 Cr)
  expandImage: async (payload: AiExpandPayload): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/ai-expand", payload);
  },

  // 4. Upscale Super-Resolution (Zero-Token Free Tool)
  upscaleImage: async (
    payload: UpscalePayload
  ): Promise<UpscaleResponse & BaseToolResponse> => {
    const scale =
      payload.scale ||
      (typeof payload.scaleFactor === "number" ? (payload.scaleFactor as 2 | 4) : 2);
    const body = {
      image_url: payload.imageUrl || payload.image_url,
      image_id: payload.imageId || payload.image_id,
      scale: scale,
      scale_factor: payload.scale_factor || scale,
      mode: payload.mode || "photo",
      user_id: payload.userId || payload.user_id,
    };
    return handleToolRequest<UpscaleResponse & BaseToolResponse>("/upscale", body);
  },

  // 5. Product Detail Showcase (10 Cr)
  generateProductDetail: async (
    payload: ProductDetailPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/product-detail", payload);
  },

  // 6. Marketing Promotional Poster (10 Cr)
  generateMarketingPoster: async (
    payload: MarketingPosterPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/marketing-poster", payload);
  },

  // 7. Magic Object Eraser (LaMa FFC Neural Inpainting - Sub-second & 0 Cr)
  eraseObject: async (
    payload: ObjectEraserPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/remove-object", {
      image_url: payload.imageUrl || payload.image_url,
      mask_base64: payload.maskBase64 || payload.mask_base64,
      mask_url: payload.maskUrl || payload.mask_url,
      user_id: payload.userId || payload.user_id,
    });
  },

  // 8. Vintage Photo Colorizer (DDColor Neural Restorer - Sub-second & 0 Cr)
  colorizePhoto: async (
    payload: ColorizerPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/colorize", {
      image_url: payload.imageUrl || payload.image_url,
      saturation: payload.saturation ?? 1.2,
      user_id: payload.userId || payload.user_id,
    });
  },

  // 9. Multimodal Aesthetic Vision Scanner
  scanVision: async (imageUrl: string): Promise<VisionScanResponse> => {
    const headers = await getRequestHeaders();
    const url = `${API_BASE}/vision-scan`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) {
      throw new Error(`Vision scanner failed: ${res.statusText}`);
    }
    return (await res.json()) as VisionScanResponse;
  },

  // 10. Tool Presets (Relight, Blur, Custom Preset)
  editPreset: async (params: {
    imageId?: string;
    image_id?: string;
    imageUrl?: string;
    image_url?: string;
    action: "relight" | "change_background" | "upscale" | string;
    targetPreset?: string;
    target_preset?: string;
    lockSubject?: boolean;
    lock_subject?: boolean;
  }): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/edit-preset", {
      image_id: params.imageId || params.image_id,
      image_url: params.imageUrl || params.image_url,
      action: params.action,
      target_preset: params.targetPreset || params.target_preset,
      lock_subject: params.lockSubject ?? params.lock_subject ?? true,
    });
  },

  // Tool History
  getHistory: async (
    userId: string,
    toolType?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ToolHistoryItem[]> => {
    if (!userId || userId === "undefined" || userId === "null") {
      return [];
    }
    const headers = await getRequestHeaders();
    const query = new URLSearchParams({
      user_id: userId,
      limit: String(limit),
      offset: String(offset),
    });
    if (toolType) query.append("tool_type", toolType);

    const url = `${API_BASE}/prompt-engineering/tools/history?${query.toString()}`;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        return (await res.json()) as ToolHistoryItem[];
      }
    } catch (err) {
      console.warn("[toolsApi.getHistory] Error fetching history:", err);
    }
    return [];
  },
};
