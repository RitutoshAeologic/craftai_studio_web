'use client'

/**
 * LLMConfigContext
 *
 * Provides the active Multi-LLM configuration fetched from:
 *   GET /api/v1/prompt-engineering/config
 *
 * The config is sourced from the Supabase `app_settings` table (key: "llm_config")
 * via the backend's ConfigService which uses a 60-second TTL cache.
 *
 * This context mirrors that TTL by polling every 60 seconds so the frontend
 * always stays in sync with any hot-reloaded provider switch made in Supabase.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  getLLMConfig,
  invalidateLLMConfigCache,
  type LLMConfig,
} from "@/lib/api/backend-client";

// ── Default config mirrors backend ConfigService defaults ──────────────────
export const DEFAULT_LLM_CONFIG: LLMConfig = {
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

// ── Polling interval mirrors backend 60-second ConfigService TTL ────────────
const POLL_INTERVAL_MS = 60_000;

// ── Context shape ───────────────────────────────────────────────────────────
interface LLMConfigContextType {
  /** The currently active LLM configuration. Starts as defaults, resolves async. */
  llmConfig: LLMConfig;
  /** True during the initial fetch only (not during background polling). */
  isLoadingConfig: boolean;
  /**
   * Forces an immediate cache-busted re-fetch from the backend.
   * Useful after an admin changes the provider in Supabase and wants
   * the UI to reflect the change without waiting for the next poll cycle.
   */
  refreshConfig: () => Promise<void>;
}

const LLMConfigContext = createContext<LLMConfigContextType>({
  llmConfig: DEFAULT_LLM_CONFIG,
  isLoadingConfig: true,
  refreshConfig: async () => {},
});

// ── Provider component ───────────────────────────────────────────────────────
export function LLMConfigProvider({ children }: { children: React.ReactNode }) {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const pollerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const fetchConfig = useCallback(async (bustCache = false) => {
    if (bustCache) invalidateLLMConfigCache();
    try {
      const config = await getLLMConfig();
      if (isMounted.current) {
        setLlmConfig(config);
      }
    } catch (err) {
      // getLLMConfig already swallows errors and returns defaults.
      // Nothing to do here.
      console.warn("[LLMConfigContext] fetchConfig error (should not reach here):", err);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    isMounted.current = true;

    (async () => {
      await fetchConfig();
      if (isMounted.current) {
        setIsLoadingConfig(false);
      }
    })();

    // Background polling every 60 seconds to keep in sync with Supabase changes
    pollerRef.current = setInterval(() => {
      // Background refreshes bust the client-side cache so we always hit the network
      fetchConfig(true);
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [fetchConfig]);

  const refreshConfig = useCallback(async () => {
    await fetchConfig(true);
  }, [fetchConfig]);

  return (
    <LLMConfigContext.Provider value={{ llmConfig, isLoadingConfig, refreshConfig }}>
      {children}
    </LLMConfigContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useLLMConfig() {
  return useContext(LLMConfigContext);
}

/**
 * Convenience hook: returns a human-readable label for the active provider.
 * Maps backend provider IDs to display names consistent with the Studio UI.
 */
export function useActiveProviderLabel(): string {
  const { llmConfig } = useLLMConfig();
  const labelMap: Record<string, string> = {
    gemini: "Gemini 2.5 Flash",
    groq: "Groq Llama 3",
    openai: "GPT-4o Mini",
    claude: "Claude 3.5 Sonnet",
    local: "Local (Offline)",
  };
  return (
    labelMap[llmConfig.active_provider] ??
    llmConfig.active_provider.charAt(0).toUpperCase() +
      llmConfig.active_provider.slice(1)
  );
}
