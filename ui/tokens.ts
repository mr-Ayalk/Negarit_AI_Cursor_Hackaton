/**
 * Negarit UI design tokens — Vercel-inspired dark/light system.
 * CSS mirrors live in `ui/tokens.css` via the same variable names.
 */

export const colors = {
  light: {
    bg: "#fafafa",
    bgElev: "#f4f4f5",
    panel: "#ffffff",
    text: "#0a0a0a",
    muted: "#71717a",
    accent: "#0070f3",
    accentSoft: "#3291ff",
    ok: "#00c853",
    line: "rgba(0, 0, 0, 0.08)",
    glow: "rgba(0, 112, 243, 0.35)",
  },
  dark: {
    bg: "#000000",
    bgElev: "#0a0a0a",
    panel: "#111111",
    text: "#ededed",
    muted: "#888888",
    accent: "#0070f3",
    accentSoft: "#3291ff",
    ok: "#00c853",
    line: "rgba(255, 255, 255, 0.08)",
    glow: "rgba(0, 112, 243, 0.45)",
  },
} as const;

export const fonts = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
  display: "var(--font-mono)",
} as const;

export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const space = {
  max: "980px",
  pad: "clamp(1rem, 4vw, 1.5rem)",
} as const;

export type ThemeMode = "light" | "dark";
