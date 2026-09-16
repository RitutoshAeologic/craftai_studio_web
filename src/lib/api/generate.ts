/**
 * Free Image Generator — Pollinations.ai
 * 100% free, no API key required
 * Models: flux (FLUX.1 Schnell), turbo (SDXL Turbo), sdxl (Stable Diffusion XL)
 */

export type ImageModel = "flux" | "turbo" | "sdxl";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:5";

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:5": { width: 896, height: 1120 },
};

export async function generateFreeImage({
  prompt,
  model = "flux",
  aspectRatio = "1:1",
  seed,
  referenceImage,
}: {
  prompt: string;
  model?: ImageModel;
  aspectRatio?: AspectRatio;
  seed?: number;
  referenceImage?: string;
}): Promise<string> {
  const { width, height } = ASPECT_DIMENSIONS[aspectRatio];
  const finalSeed = seed ?? Math.floor(Math.random() * 1_000_000);
  const encodedPrompt = encodeURIComponent(prompt);

  let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=${width}&height=${height}&seed=${finalSeed}&nologo=true&enhance=true`;
  if (referenceImage && referenceImage.startsWith("http")) {
    url += `&image=${encodeURIComponent(referenceImage)}`;
  }
  return url;
}

export async function stripWatermark(url: string): Promise<string> {
  if (typeof window === "undefined" || !url || !url.startsWith("http")) return url;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Crop off the bottom of the image where the pollinations logo is located
        const cropHeight = Math.max(40, Math.round(img.naturalHeight * 0.045));
        canvas.width = img.naturalWidth;
        canvas.height = Math.max(100, img.naturalHeight - cropHeight);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            img,
            0, 0, img.naturalWidth, img.naturalHeight - cropHeight,
            0, 0, canvas.width, canvas.height
          );
          resolve(canvas.toDataURL("image/jpeg", 0.96));
          return;
        }
      } catch (e) {
        console.warn("Watermark strip fallback", e);
      }
      resolve(url);
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export function getModelLabel(model: ImageModel): string {
  const labels: Record<ImageModel, string> = {
    flux: "FLUX.1 Schnell",
    turbo: "SDXL Turbo",
    sdxl: "Stable Diffusion XL",
  };
  return labels[model];
}
