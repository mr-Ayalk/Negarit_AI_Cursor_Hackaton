"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  PatternBackground,
  useTheme,
  type FontMode,
  type FontSize,
  type ThemeMode,
} from "@/ui";

const THEMES: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "Bright white canvas" },
  { id: "dark", label: "Dark", hint: "Vercel-style black" },
];

const FONTS: { id: FontMode; label: string; sample: string; hint: string }[] = [
  {
    id: "mono",
    label: "Developer Mono",
    sample: "JetBrains Mono",
    hint: "Code-like UI — default",
  },
  {
    id: "sans",
    label: "Clean Sans",
    sample: "Space Grotesk",
    hint: "Softer reading for long text",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    sample: "Mono + Sans",
    hint: "Mono chrome, sans for prose",
  },
];

const SIZES: { id: FontSize; label: string; hint: string; sample: string }[] = [
  { id: "sm", label: "Small", hint: "Compact · 13px", sample: "Aa" },
  { id: "md", label: "Default", hint: "Balanced · 15px", sample: "Aa" },
  { id: "lg", label: "Large", hint: "Easy reading · 18px", sample: "Aa" },
];

export default function SettingsPage() {
  const { theme, font, fontSize, setTheme, setFont, setFontSize } = useTheme();

  return (
    <div>
      <SiteHeader />
      <section className="hero-surface settings-hero">
        <PatternBackground variant="grid" interactive fade />
        <div className="wrap settings-hero__content">
          <p className="pill" style={{ width: "fit-content", marginBottom: "0.85rem" }}>
            Appearance
          </p>
          <h1 className="settings-hero__title">Settings</h1>
          <p className="muted prose small" style={{ maxWidth: 420 }}>
            Control light mode, font family, and size. Choices save on this device.
          </p>
        </div>
      </section>

      <div className="wrap settings-page">
        <section className="settings-section panel">
          <div className="settings-section__head">
            <h2>Color mode</h2>
            <p className="muted small">Switch between light and dark.</p>
          </div>
          <div className="settings-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`settings-card settings-card--theme ${theme === t.id ? "is-active" : ""}`}
                data-preview={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
              >
                <span className="settings-card__swatch" aria-hidden>
                  <span className="settings-card__swatch-bg" />
                  <span className="settings-card__swatch-panel" />
                  <span className="settings-card__swatch-text" />
                </span>
                <span className="settings-card__label">{t.label}</span>
                <span className="muted small">{t.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section panel">
          <div className="settings-section__head">
            <h2>Font size</h2>
            <p className="muted small">Make text larger for easier reading on tour.</p>
          </div>
          <div className="settings-grid settings-grid--3 settings-size-grid">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-card settings-card--size settings-card--size-${s.id} ${fontSize === s.id ? "is-active" : ""}`}
                onClick={() => setFontSize(s.id)}
                aria-pressed={fontSize === s.id}
              >
                <span className="settings-card__size-sample" data-size={s.id}>
                  {s.sample}
                </span>
                <span className="settings-card__label">{s.label}</span>
                <span className="muted small">{s.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section panel">
          <div className="settings-section__head">
            <h2>Font</h2>
            <p className="muted small">Pick how Negarit looks and reads.</p>
          </div>
          <div className="settings-grid settings-grid--3">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`settings-card settings-card--font ${font === f.id ? "is-active" : ""}`}
                data-font-preview={f.id}
                onClick={() => setFont(f.id)}
                aria-pressed={font === f.id}
              >
                <span className="settings-card__sample" data-font-preview={f.id}>
                  Aa
                </span>
                <span className="settings-card__label">{f.label}</span>
                <span className="settings-card__meta">{f.sample}</span>
                <span className="muted small">{f.hint}</span>
              </button>
            ))}
          </div>
          <p className="settings-preview prose">
            Preview — Negarit AI guides you through Adwa. Ask aloud. Walk hall to hall.
          </p>
        </section>

        <div className="row" style={{ marginTop: "0.5rem", gap: "0.65rem" }}>
          <Link href="/guide" className="btn btn-primary">
            Back to guide
          </Link>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
