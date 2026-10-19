/**
 * CraftAI Studio — Creative AI Tools API Client
 * Compatible with FastAPI v1.4.0 backend (/api/v1/prompt-engineering/tools)
 * Features flexible camelCase/snake_case property aliasing, JWT auth, and ngrok tunnel tolerance.
 */

import { createClient } from "@/lib/supabase/client";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`
    : "http://127.0.0.1:8001/api/v1");

let customAuthToken: string | null = null;

export const setAuthToken = (token?: string) => {
  customAuthToken = token || null;
};

async function getRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
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
  imageUrl: string;
  mode?: "pure_white" | "smart" | "custom";
  customBackdrop?: string;
  aspectRatio?: "Auto" | "1:1" | "4:5" | "9:16" | "16:9" | string;
  quality?: "1k" | "2k";
  userId?: string;
}

export interface AiExpandPayload {
  imageUrl: string;
  targetRatio?: "16:9" | "9:16" | "1:1" | "4:5" | "3:4" | "4:3" | "2:3" | "3:2" | string;
  quality?: "1k" | "2k";
  userId?: string;
}

export interface UpscaleParams {
  imageUrl?: string;
  image_url?: string;
  imageId?: string;
  image_id?: string;
  scale?: 2 | 4;
  scaleFactor?: 2 | 4 | number | string;
  scale_factor?: 2 | 4 | number | string;
  mode?: "photo" | "portrait" | "anime" | "fast";
  userId?: string;
  user_id?: string;
}

export type UpscalePayload = UpscaleParams;

export interface UpscaleResponse {
  task_id: string;
  status: "completed" | "failed" | string;
  scale: number;
  mode: "photo" | "portrait" | "anime" | "fast" | string;
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
  productName?: string;
  aspectRatio?: string;
  language?: string;
  quality?: "1k" | "2k";
  userId?: string;
}

export interface MarketingPosterPayload {
  imageUrl?: string; // Optional product image to feature in hero section
  topic?: string;
  category?: "Beverage" | "Fashion" | "Hiring" | "Flash Sale" | "Event" | "Commercial" | "Promotion" | string;
  headline?: string;
  aspectRatio?: "4:5" | "9:16" | "1:1" | "16:9" | string;
  language?: string;
  quality?: "1k" | "2k";
  userId?: string;
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

async function handleToolRequest<T extends BaseToolResponse>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  const headers = await getRequestHeaders();
  const base = API_BASE.replace(/\/+$/, "");
  const url = base.endsWith("/api/v1")
    ? `${base}/prompt-engineering/tools${endpoint}`
    : `${base}/api/v1/prompt-engineering/tools${endpoint}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      // Ensure triple URL parity fallback
      if (!data.image_url) data.image_url = data.output_url || data.url || "";
      if (!data.output_url) data.output_url = data.image_url || data.url || "";
      if (!data.url) data.url = data.output_url || data.image_url || "";
      return data;
    }

    let errorDetail = `Tool request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || errJson.detail || errJson.error || errorDetail;
    } catch {}

    throw new Error(errorDetail);
  } catch (err: any) {
    console.warn(`[toolsApi${endpoint}] Network / execution error:`, err);
    throw err;
  }
}

// ── Standalone Upscale Functions matching Spec ─────────────────────────
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
  const base = API_BASE.replace(/\/+$/, "");
  const url = base.endsWith("/api/v1")
    ? `${base}/prompt-engineering/tools/upscale`
    : `${base}/api/v1/prompt-engineering/tools/upscale`;

  const headers = await getRequestHeaders();
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      image_url: imageUrl || image_url,
      image_id: imageId || image_id,
      scale: scale,
      scale_factor: scale,
      mode: mode,
      user_id: userId || user_id,
    }),
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
      imageUrl,
      userId,
    });
  },

  // 2. AI Backgrounds (pure_white 0 Cr, smart 10 Cr, custom 10 Cr)
  generateAiBackground: async (
    payload: AiBackgroundPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/ai-background", payload);
  },

  // 3. AI Expand (10 Cr / 14 Cr)
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

  // 5. Product Detail (10 Cr)
  generateProductDetail: async (
    payload: ProductDetailPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/product-detail", payload);
  },

  // 6. Marketing Poster (10 Cr / 14 Cr)
  generateMarketingPoster: async (
    payload: MarketingPosterPayload
  ): Promise<BaseToolResponse> => {
    return handleToolRequest<BaseToolResponse>("/marketing-poster", payload);
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

    const base = API_BASE.replace(/\/+$/, "");
    const url = base.endsWith("/api/v1")
      ? `${base}/prompt-engineering/tools/history?${query.toString()}`
      : `${base}/api/v1/prompt-engineering/tools/history?${query.toString()}`;

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
