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
  surface: string;           // Main card backgrounds, modal sheets, canvas (#121218)
  surfaceLight: string;      // Input fields, secondary cards, pill badges (#1E1E2A)
  surfaceHover: string;      // Card hover background (#1A1A26)
  background: string;        // Deep dark root background (#0B0B0F)
  border: string;            // Card borders, dividers, outlines (#2E2E3E)
  borderLight: string;       // Subtle borders and dividers (#1E1E2A)
  textPrimary: string;       // Main headings, active inputs (#FFFFFF)
  textSecondary: string;     // Subtitles, helper text, inactive chips (#94A3B8)
  textMuted: string;         // Timestamps, counters, placeholder text (#64748B)
  accentSuccess: string;     // Unlocked downloads, face-lock active, refunds (#10B981)
  accentWarning: string;     // Low credits warning, disarmed status (#F59E0B)
  accentError: string;       // Server errors, validation errors, liked heart (#EF4444)
  copilotAccent: string;     // Prompt Chat Copilot icon and badges (#38BDF8)
  purpleAccent: string;      // Subject Lock action icon and badges (#A855F7)

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

export type ThemePresetName = "defaultDark" | "cyberpunk" | "obsidian";

export const THEME_PRESETS: Record<ThemePresetName, ThemeColorSchema> = {
  // ── Official Theme (100% Mobile & Web Parity) ───────────────────────────
  defaultDark: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryGlow: "rgba(99, 102, 241, 0.25)",
    surface: "#121218",
    surfaceLight: "#1E1E2A",
    surfaceHover: "#1A1A26",
    background: "#0B0B0F",
    border: "#2E2E3E",
    borderLight: "#1E1E2A",
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#EF4444",
    copilotAccent: "#38BDF8",
    purpleAccent: "#A855F7",

    // Backwards-compatibility aliases
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
    surfaceHover: "#1D2845",
    background: "#080B14",
    border: "#223152",
    borderLight: "#18243E",
    textPrimary: "#FFFFFF",
    textSecondary: "#93A5C8",
    textMuted: "#54688E",
    accentSuccess: "#10B981",
    accentWarning: "#F59E0B",
    accentError: "#FF3366",
    copilotAccent: "#00F2FE",
    purpleAccent: "#D946EF",

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

  // ── Obsidian Pure Black Preset ─────────────────────────────────────────
  obsidian: {
    primary: "#818CF8",
    primaryDark: "#6366F1",
    primaryGlow: "rgba(129, 140, 248, 0.25)",
    surface: "#0A0A0E",
    surfaceLight: "#14141A",
    surfaceHover: "#181822",
    background: "#000000",
    border: "#262630",
    borderLight: "#181820",
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
    textMuted: "#52525B",
    accentSuccess: "#22C55E",
    accentWarning: "#EAB308",
    accentError: "#F43F5E",
    copilotAccent: "#38BDF8",
    purpleAccent: "#C084FC",

    bg: "#000000",
    card: "#0A0A0E",
    cardBorder: "#181820",
    panel: "#0A0A0E",
    panelBorder: "#181820",
    cyan: "#38BDF8",
    cyanDark: "#0284C7",
    success: "#22C55E",
    warning: "#EAB308",
    error: "#F43F5E",
    purple: "#C084FC",
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

  // Sync legacy CSS vars
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

/**
 * Global theme object export.
 * `theme.colors` gives instant access to all design tokens across every component.
 */
export const theme = {
  get colors(): ThemeColorSchema {
    return activeColors;
  },
  get preset(): ThemePresetName {
    return currentPreset;
  },
  setPreset: setThemePreset,
  init: initTheme,
};
