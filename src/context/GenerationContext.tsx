'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveGeneration, type Generation } from "@/lib/supabase/db";
import { generateFreeImage, stripWatermark, type ImageModel, type AspectRatio } from "@/lib/api/generate";
import { dispatchGeneration, subscribeGenerationProgress } from "@/lib/api/backend-client";
import { safeUUID } from "@/lib/utils/uuid";

const ASPECT_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "9:16": { width: 768, height: 1344 },
  "4:5": { width: 896, height: 1120 },
  "16:9": { width: 1344, height: 768 },
};

export interface ActiveGenerationJob {
  id: string;
  prompt: string;
  model: string;
  modelId: ImageModel;
  aspectRatio: AspectRatio;
  status: "idle" | "generating" | "completed" | "error";
  progress: number;
  progressMessage: string;
  imageUrl?: string;
  error?: string;
  startedAt?: number;
}

interface GenerationContextType {
  activeJob: ActiveGenerationJob | null;
  isGenerating: boolean;
  toastJob: ActiveGenerationJob | null;
  dismissToast: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission | null>;
  startBackgroundGeneration: (params: {
    prompt: string;
    model: { id: ImageModel; label: string };
    aspectRatio: AspectRatio;
    seed?: number;
    referenceImage?: string;
    userKey?: string;
    userEmail?: string;
    userId?: string;
    stylePresetModifier?: string;
    onCompleted?: (imageUrl: string, job: ActiveGenerationJob) => void;
  }) => Promise<string | null>;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<ActiveGenerationJob | null>(null);
  const [toastJob, setToastJob] = useState<ActiveGenerationJob | null>(null);
  const isGenerating = activeJob?.status === "generating";

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }
    if (Notification.permission === "default") {
      try {
        const perm = await Notification.requestPermission();
        return perm;
      } catch (err) {
        console.warn("[GenerationContext] Notification permission request error:", err);
      }
    }
    return Notification.permission;
  }, []);

  const dismissToast = useCallback(() => {
    setToastJob(null);
  }, []);

  // Show system notification if supported & granted
  const sendSystemNotification = useCallback((job: ActiveGenerationJob) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const title = "CraftAI Studio — Artwork Ready! ✨";
        const body = `Your generation "${job.prompt.slice(0, 48)}..." has completed.`;
        const notif = new Notification(title, {
          body,
          icon: job.imageUrl || "/favicon.ico",
          badge: "/favicon.ico",
          tag: job.id,
        });

        notif.onclick = () => {
          window.focus();
          router.push(`/studio?prompt=${encodeURIComponent(job.prompt)}&imageUrl=${encodeURIComponent(job.imageUrl || "")}`);
          notif.close();
        };
      } catch (e) {
        console.warn("[GenerationContext] Failed to dispatch OS notification:", e);
      }
    }
  }, [router]);

  const startBackgroundGeneration = useCallback(
    async (params: {
      prompt: string;
      model: { id: ImageModel; label: string };
      aspectRatio: AspectRatio;
      seed?: number;
      referenceImage?: string;
      userKey?: string;
      userEmail?: string;
      userId?: string;
      stylePresetModifier?: string;
      onCompleted?: (imageUrl: string, job: ActiveGenerationJob) => void;
    }): Promise<string | null> => {
      // 1. Proactively request notification permission on generation start
      requestNotificationPermission().catch(() => {});

      const jobId = `job_${Date.now()}_${safeUUID().slice(0, 8)}`;
      const currentSeed = params.seed || Math.floor(Math.random() * 900_000) + 100_000;

      // Combine prompt with artistic style preset if selected
      let finalPrompt = params.prompt.trim();
      if (params.stylePresetModifier && !finalPrompt.toLowerCase().includes(params.stylePresetModifier.toLowerCase())) {
        finalPrompt = `${finalPrompt}, ${params.stylePresetModifier}`;
      }

      const newJob: ActiveGenerationJob = {
        id: jobId,
        prompt: finalPrompt,
        model: params.model.label,
        modelId: params.model.id,
        aspectRatio: params.aspectRatio,
        status: "generating",
        progress: 10,
        progressMessage: "Initializing inference gateway...",
        startedAt: Date.now(),
      };

      setActiveJob(newJob);

      let finalUrl: string | null = null;

      try {
        // Step A: Attempt backend dispatch
        try {
          const dims = ASPECT_SIZES[params.aspectRatio] || { width: 1024, height: 1024 };
          const dispatchRes = await dispatchGeneration({
            prompt: finalPrompt,
            model: params.model.id,
            width: dims.width,
            height: dims.height,
            seed: currentSeed,
            face_reference_urls: params.referenceImage ? [params.referenceImage] : null,
          });

          if (dispatchRes?.direct_image_url) {
            finalUrl = dispatchRes.direct_image_url;
          } else if (dispatchRes?.task_id) {
            // Subscribe to WS / polling progress
            await new Promise<void>((resolve) => {
              const unsubscribe = subscribeGenerationProgress(
                dispatchRes.task_id,
                (event) => {
                  setActiveJob((prev) =>
                    prev ? { ...prev, progress: event.progress, progressMessage: event.message } : null
                  );
                  if (event.output_url) {
                    finalUrl = event.output_url;
                  }
                },
                (outputUrl) => {
                  if (outputUrl) finalUrl = outputUrl;
                  unsubscribe();
                  resolve();
                },
                () => {
                  unsubscribe();
                  resolve();
                }
              );

              setTimeout(() => {
                unsubscribe();
                resolve();
              }, 30000);
            });
          }
        } catch (e) {
          console.warn("[GenerationContext] Backend dispatch fallback:", e);
        }

        // Step B: Client generation fallback if direct URL not returned
        if (!finalUrl) {
          setActiveJob((prev) => (prev ? { ...prev, progress: 45, progressMessage: "Rendering photorealistic canvas..." } : null));
          finalUrl = await generateFreeImage({
            prompt: finalPrompt,
            model: params.model.id,
            aspectRatio: params.aspectRatio,
            seed: currentSeed,
            referenceImage: params.referenceImage,
          });
        }

        // Step C: Watermark strip if needed
        let cleanUrl = finalUrl;
        if (finalUrl && finalUrl.includes("pollinations.ai")) {
          setActiveJob((prev) => (prev ? { ...prev, progress: 85, progressMessage: "Finalizing 4K color grade..." } : null));
          cleanUrl = await stripWatermark(finalUrl);
        }

        // Step D: Save to database & local storage
        if (cleanUrl) {
          await saveGeneration(
            {
              prompt: finalPrompt,
              image_url: cleanUrl,
              model: params.model.label,
              aspect_ratio: params.aspectRatio,
              user_id: params.userId,
              user_email: params.userEmail,
            },
            params.userKey || "default",
            jobId
          );
        }

        const completedJob: ActiveGenerationJob = {
          ...newJob,
          status: "completed",
          progress: 100,
          progressMessage: "Generation complete!",
          imageUrl: cleanUrl,
        };

        setActiveJob(completedJob);
        setToastJob(completedJob);

        // Send OS system notification
        sendSystemNotification(completedJob);

        if (params.onCompleted && cleanUrl) {
          params.onCompleted(cleanUrl, completedJob);
        }

        return cleanUrl;
      } catch (err: any) {
        console.error("[GenerationContext] Generation error:", err);
        const failedJob: ActiveGenerationJob = {
          ...newJob,
          status: "error",
          progress: 0,
          progressMessage: "Generation failed",
          error: err?.message || "Synthesis pipeline timed out.",
        };
        setActiveJob(failedJob);
        setToastJob(failedJob);
        return null;
      }
    },
    [requestNotificationPermission, sendSystemNotification]
  );

  return (
    <GenerationContext.Provider
      value={{
        activeJob,
        isGenerating,
        toastJob,
        dismissToast,
        requestNotificationPermission,
        startBackgroundGeneration,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error("useGeneration must be used within a GenerationProvider");
  }
  return context;
}
