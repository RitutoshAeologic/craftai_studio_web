/**
 * Generates an RFC4122 v4 compliant UUID safely across all browser and server environments.
 * Specifically handles non-secure contexts (such as plain HTTP IP addresses) where
 * window.crypto.randomUUID is undefined.
 */
export function safeUUID(): string {
  if (typeof window !== "undefined") {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      try {
        return window.crypto.randomUUID();
      } catch {}
    }
  } else if (typeof globalThis !== "undefined" && globalThis.crypto && typeof (globalThis.crypto as any).randomUUID === "function") {
    try {
      return (globalThis.crypto as any).randomUUID();
    } catch {}
  }

  // RFC4122 v4 standard compliant fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
