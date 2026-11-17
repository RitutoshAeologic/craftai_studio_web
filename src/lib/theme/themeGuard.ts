/**
 * CraftAI Studio — Central Theme & Color Schema Guard
 * 
 * Single source of truth for all styling, colors, and design tokens across
 * all screens (Studio, Explore, Library, Wallet, Tools, Profile, Navigation).
 * Changing tokens here dynamically updates CSS root variables and every linked component.
 */

export interface ThemeColorSchema {
  primary: string;           // Primary buttons, active tabs, highlights (#6366F1)
  primaryDark: string;       // Hover / active states (#4F46E5)
  primaryGlow: string;       // Primary button glow & focus rings
  surface: string;           // Main card backgrounds, modal sheets, canvas (#121218 / #FFFFFF)
  surfaceLight: string;      // Input fields, secondary cards, pill badges (bg-surface-muted)
  surfaceElevated?: string;  // Floating bars, tooltips, dropdowns (bg-surface-elevated)
  surfaceHover: string;      // Card hover background
  background: string;        // Root canvas background (bg-canvas)
  border: string;            // Card borders, dividers, outlines (border-default)
  borderLight: string;       // Subtle borders and dividers (border-subtle)
  textPrimary: string;       // Main headings, active inputs (text-primary)
  textSecondary: string;     // Subtitles, helper text, inactive chips (text-secondary)
  textMuted: string;         // Timestamps, counters, placeholder text (text-muted)
  textTertiary?: string;     // Disabled text, placeholders (text-tertiary)
  accentSuccess: string;     // Unlocked downloads, completed jobs (#10B981)
  accentWarning: string;     // Low credits warning, pending alerts (#F59E0B)
  accentError: string;       // Server errors, validation errors, liked heart (#EF4444)
  copilotAccent: string;     // Studio Copilot, quick modifiers (#06B6D4)
  purpleAccent: string;      // Pro / VIP membership tiers (#A855F7)

  // Glass & Theme Spec Tokens
  glassSurface?: string;
  glassBorder?: string;
  gradAiCosmic?: string;
  gradGlassSpecular?: string;
  isDark: boolean;

  // Legacy aliases for full backwards compatibility
  bg: string;
  card: string;
  cardBorder: string;
  panel: string;
  panelBorder: string;
  cyan: string;
  cyanDark: string;
  success: string;
  warning: string;
  error: string;
  purple: string;
}

export type ThemePresetName = "obsidian" | "aurora" | "defaultDark" | "cyberpunk";

export const THEME_PRESETS: Record<ThemePresetName, ThemeColorSchema> = {
  // ── Official Deep Obsidian Dark Theme (Design System Spec) ───────────────
  obsidian: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryGlow: "rgba(99, 102, 241, 0.25)",
    surface: "#161B26",
    surfaceLight: "#1F2636",
    surfaceElevated: "#121622",
    surfaceHover: "#1D2331",
    background: "#0B0D14",
    border: "#283245",
    borderLight: "#1C2230",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textTertiary: "#475569",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#EF4444",
    copilotAccent: "#06B6D4",
    purpleAccent: "#A855F7",
    glassSurface: "rgba(22, 27, 38, 0.80)",
    glassBorder: "rgba(255, 255, 255, 0.18)",
    gradAiCosmic: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #06B6D4 100%)",
    gradGlassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
    isDark: true,

    bg: "#0B0D14",
    card: "#161B26",
    cardBorder: "#283245",
    panel: "#161B26",
    panelBorder: "#283245",
    cyan: "#06B6D4",
    cyanDark: "#0891B2",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    purple: "#A855F7",
  },

  // ── Official Luminous Aurora Light Theme (Design System Spec) ─────────────
  aurora: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryGlow: "rgba(99, 102, 241, 0.25)",
    surface: "#FFFFFF",
    surfaceLight: "#F1F5F9",
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#F8FAFC",
    background: "#F8FAFC",
    border: "#E2E8F0",
    borderLight: "#EEF2F6",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    textTertiary: "#94A3B8",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#EF4444",
    copilotAccent: "#06B6D4",
    purpleAccent: "#A855F7",
    glassSurface: "rgba(255, 255, 255, 0.82)",
    glassBorder: "rgba(99, 102, 241, 0.20)",
    gradAiCosmic: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #06B6D4 100%)",
    gradGlassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(99, 102, 241, 0.1) 100%)",
    isDark: false,

    bg: "#F8FAFC",
    card: "#FFFFFF",
    cardBorder: "#E2E8F0",
    panel: "#FFFFFF",
    panelBorder: "#E2E8F0",
    cyan: "#06B6D4",
    cyanDark: "#0891B2",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    purple: "#A855F7",
  },

  // ── Cosmic Indigo Default Dark Preset ───────────────────────────────────
  defaultDark: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryGlow: "rgba(99, 102, 241, 0.25)",
    surface: "#121218",
    surfaceLight: "#1E1E2A",
    surfaceElevated: "#181824",
    surfaceHover: "#1A1A26",
    background: "#0B0B0F",
    border: "#2E2E3E",
    borderLight: "#1E1E2A",
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textTertiary: "#475569",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#EF4444",
    copilotAccent: "#38BDF8",
    purpleAccent: "#A855F7",
    glassSurface: "rgba(18, 18, 24, 0.88)",
    glassBorder: "rgba(255, 255, 255, 0.12)",
    gradAiCosmic: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #06B6D4 100%)",
    gradGlassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
    isDark: true,

    bg: "#0B0B0F",
    card: "#121218",
    cardBorder: "#1E1E2A",
    panel: "#121218",
    panelBorder: "#1E1E2A",
    cyan: "#38BDF8",
    cyanDark: "#0284C7",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    purple: "#A855F7",
  },

  // ── Cyberpunk Neon Preset ──────────────────────────────────────────────
  cyberpunk: {
    primary: "#00F2FE",
    primaryDark: "#00C2CF",
    primaryGlow: "rgba(0, 242, 254, 0.35)",
    surface: "#101424",
    surfaceLight: "#182035",
    surfaceElevated: "#141A30",
    surfaceHover: "#1D2845",
    background: "#080B14",
    border: "#223152",
    borderLight: "#18243E",
    textPrimary: "#FFFFFF",
    textSecondary: "#93A5C8",
    textMuted: "#54688E",
    textTertiary: "#3F5175",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#FF3366",
    copilotAccent: "#00F2FE",
    purpleAccent: "#D946EF",
    glassSurface: "rgba(16, 20, 36, 0.85)",
    glassBorder: "rgba(0, 242, 254, 0.25)",
    gradAiCosmic: "linear-gradient(135deg, #D946EF 0%, #6366F1 50%, #00F2FE 100%)",
    gradGlassSpecular: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)",
    isDark: true,

    bg: "#080B14",
    card: "#101424",
    cardBorder: "#18243E",
    panel: "#101424",
    panelBorder: "#18243E",
    cyan: "#00F2FE",
    cyanDark: "#00C2CF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#FF3366",
    purple: "#D946EF",
  },
};

// Global active schema state
let currentPreset: ThemePresetName = "defaultDark";
let activeColors: ThemeColorSchema = { ...THEME_PRESETS.defaultDark };
const listeners: Set<(colors: ThemeColorSchema) => void> = new Set();

/**
 * Injects CSS variables into :root so all Tailwind and vanilla CSS rules sync instantly.
 */
export function applyThemeToCssVariables(colors: ThemeColorSchema): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Toggle data-theme and Tailwind dark class on <html>
  if (colors.isDark) {
    root.setAttribute("data-theme", "dark");
    root.setAttribute("data-theme-preset", currentPreset);
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.setAttribute("data-theme", "light");
    root.setAttribute("data-theme-preset", currentPreset);
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }

  // 1. Brand Accents & Gradients (Specification Section 1 & 2)
  root.style.setProperty("--brand-primary", colors.primary);
  root.style.setProperty("--brand-secondary", "#8B5CF6");
  root.style.setProperty("--brand-vip", colors.purpleAccent);
  root.style.setProperty("--accent-cyan", colors.copilotAccent);
  root.style.setProperty("--accent-success", colors.accentSuccess);
  root.style.setProperty("--accent-warning", colors.accentWarning);
  root.style.setProperty("--accent-error", colors.accentError);

  if (colors.gradAiCosmic) {
    root.style.setProperty("--grad-ai-cosmic", colors.gradAiCosmic);
  }
  if (colors.gradGlassSpecular) {
    root.style.setProperty("--grad-glass-specular", colors.gradGlassSpecular);
  }

  // 2. Dynamic Semantic Spec Tokens (Specification Section 3)
  root.style.setProperty("--bg-canvas", colors.background);
  root.style.setProperty("--bg-surface", colors.surface);
  root.style.setProperty("--bg-surface-elevated", colors.surfaceElevated || colors.surface);
  root.style.setProperty("--bg-surface-muted", colors.surfaceLight);
  root.style.setProperty("--border-default", colors.border);
  root.style.setProperty("--border-subtle", colors.borderLight);
  root.style.setProperty("--glass-surface", colors.glassSurface || (colors.isDark ? "rgba(22, 27, 38, 0.80)" : "rgba(255, 255, 255, 0.82)"));
  root.style.setProperty("--glass-border", colors.glassBorder || (colors.isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(99, 102, 241, 0.20)"));
  root.style.setProperty("--text-primary", colors.textPrimary);
  root.style.setProperty("--text-secondary", colors.textSecondary);
  root.style.setProperty("--text-muted", colors.textMuted);
  root.style.setProperty("--text-tertiary", colors.textTertiary || colors.textMuted);

  // 3. Theme Guard Specific Vars & Aliases
  root.style.setProperty("--theme-primary", colors.primary);
  root.style.setProperty("--theme-primary-dark", colors.primaryDark);
  root.style.setProperty("--theme-primary-glow", colors.primaryGlow);
  root.style.setProperty("--theme-surface", colors.surface);
  root.style.setProperty("--theme-surface-light", colors.surfaceLight);
  root.style.setProperty("--theme-surface-hover", colors.surfaceHover);
  root.style.setProperty("--theme-background", colors.background);
  root.style.setProperty("--theme-border", colors.border);
  root.style.setProperty("--theme-border-light", colors.borderLight);
  root.style.setProperty("--theme-text-primary", colors.textPrimary);
  root.style.setProperty("--theme-text-secondary", colors.textSecondary);
  root.style.setProperty("--theme-text-muted", colors.textMuted);
  root.style.setProperty("--theme-success", colors.accentSuccess);
  root.style.setProperty("--theme-warning", colors.accentWarning);
  root.style.setProperty("--theme-error", colors.accentError);
  root.style.setProperty("--theme-copilot", colors.copilotAccent);
  root.style.setProperty("--theme-purple", colors.purpleAccent);

  // 4. Sync legacy CSS vars
  root.style.setProperty("--canvas", colors.background);
  root.style.setProperty("--surface", colors.surface);
  root.style.setProperty("--surface-hover", colors.surfaceHover);
  root.style.setProperty("--surface-border", colors.border);
  root.style.setProperty("--cyan", colors.copilotAccent);
  root.style.setProperty("--indigo", colors.primary);
}

/**
 * Switch the active theme system-wide.
 * Automatically updates CSS variables and notifies all React subscribers.
 */
export function setThemePreset(preset: ThemePresetName): void {
  if (!THEME_PRESETS[preset]) return;
  currentPreset = preset;
  activeColors = { ...THEME_PRESETS[preset] };
  applyThemeToCssVariables(activeColors);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("craftai_theme_preset", preset);
    } catch {}
  }
  listeners.forEach((listener) => listener(activeColors));
}

/**
 * Initialize theme from localStorage on client boot.
 */
export function initTheme(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem("craftai_theme_preset") as ThemePresetName;
    if (saved && THEME_PRESETS[saved]) {
      setThemePreset(saved);
      return;
    }
  } catch {}
  applyThemeToCssVariables(activeColors);
}

/**
 * Hook or subscriber for reactive theme changes.
 */
export function subscribeTheme(listener: (colors: ThemeColorSchema) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const colorsProxy = new Proxy({} as ThemeColorSchema, {
  get(_target, prop: string | symbol) {
    return (activeColors as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(activeColors);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(activeColors, prop);
  },
});

/**
 * Global theme object export.
 * `theme.colors` gives instant access to all design tokens across every component,
 * proxying dynamically to the active theme palette so it never gets stale.
 */
export const theme = {
  get colors(): ThemeColorSchema {
    return colorsProxy;
  },
  get preset(): ThemePresetName {
    return currentPreset;
  },
  setPreset: setThemePreset,
  init: initTheme,
};
