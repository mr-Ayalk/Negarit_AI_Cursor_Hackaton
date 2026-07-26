"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "./tokens";

export type FontMode = "mono" | "sans" | "hybrid";
export type FontSize = "sm" | "md" | "lg";

type ThemeContextValue = {
  theme: ThemeMode;
  font: FontMode;
  fontSize: FontSize;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setFont: (font: FontMode) => void;
  setFontSize: (size: FontSize) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "negarit-theme";
const FONT_KEY = "negarit-font";
const SIZE_KEY = "negarit-font-size";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#fafafa");
}

function applyFont(font: FontMode) {
  document.documentElement.setAttribute("data-font", font);
}

function applyFontSize(size: FontSize) {
  document.documentElement.setAttribute("data-font-size", size);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [font, setFontState] = useState<FontMode>("mono");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "dark";
    const savedFont = localStorage.getItem(FONT_KEY) as FontMode | null;
    const initialFont =
      savedFont === "mono" || savedFont === "sans" || savedFont === "hybrid"
        ? savedFont
        : "mono";
    const savedSize = localStorage.getItem(SIZE_KEY) as FontSize | null;
    const initialSize =
      savedSize === "sm" || savedSize === "md" || savedSize === "lg" ? savedSize : "md";
    setThemeState(initialTheme);
    setFontState(initialFont);
    setFontSizeState(initialSize);
    applyTheme(initialTheme);
    applyFont(initialFont);
    applyFontSize(initialSize);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  const setFont = useCallback((next: FontMode) => {
    setFontState(next);
    applyFont(next);
    localStorage.setItem(FONT_KEY, next);
  }, []);

  const setFontSize = useCallback((next: FontSize) => {
    setFontSizeState(next);
    applyFontSize(next);
    localStorage.setItem(SIZE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, font, fontSize, toggleTheme, setTheme, setFont, setFontSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
