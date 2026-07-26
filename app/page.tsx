"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGuide } from "@/lib/guide-context";
import { SiteHeader } from "@/components/SiteHeader";
import { PatternBackground } from "@/ui";

const FEATURES = [
  {
    code: "01 · wifi",
    title: "WiFi halls",
    body: "Gateway, 5gna Ber, 6gna Ber, Emperor Hall, Victory Court — each zone speaks.",
  },
  {
    code: "02 · voice",
    title: "Voice in, voice out",
    body: "Ask aloud. Negarit + Addis AI answer in English or Amharic.",
  },
  {
    code: "03 · pay",
    title: "Zemen Gebeya",
    body: "Habesha clothing & traditional tools — checkout with Chapa.",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const { session, loading, error } = useGuide();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div>
      <SiteHeader />

      <section className="hero-surface" style={{ minHeight: "88dvh" }}>
        <PatternBackground variant="both" interactive fade />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.22,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <Image
            src="/negarit-drum.png"
            alt="Negarit war drum at Adwa"
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: "cover",
              objectPosition: "center 30%",
              filter: "grayscale(1) contrast(1.05)",
            }}
          />
        </div>

        <div
          className="wrap hero-copy"
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "88dvh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: "clamp(2.5rem, 8vh, 4rem)",
            paddingTop: "4rem",
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <p className="pill reveal" style={{ width: "fit-content", marginBottom: "1rem" }}>
            <span className="dot" />
            Adwa Museum · Live guide
          </p>
          <h1
            className="reveal reveal-delay-1"
            style={{
              fontSize: "clamp(2.8rem, 10vw, 5.2rem)",
              marginBottom: "0.85rem",
              letterSpacing: "-0.06em",
              maxWidth: 720,
            }}
          >
            Negarit AI
          </h1>
          <p
            className="muted prose reveal reveal-delay-2"
            style={{
              maxWidth: 460,
              marginBottom: "1.6rem",
              fontSize: "1.05rem",
              lineHeight: 1.55,
            }}
          >
            Your WiFi guide through Adwa. Walk a hall, hear its story, shop artifacts, tip the
            guide, and leave with a visit story.
          </p>
          {error && (
            <p style={{ color: "#ff6b6b", marginBottom: 12, fontSize: "0.85rem" }}>{error}</p>
          )}
          <div className="row reveal reveal-delay-3">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => router.push(session.setupComplete ? "/guide" : "/setup")}
            >
              {session.setupComplete ? "Continue visit →" : "Enter the museum →"}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/shop")}>
              Zemen Gebeya
            </button>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: "3rem", position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.code} className="panel panel-interactive feature-card">
              <p className="feature-code">{f.code}</p>
              <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>{f.title}</h2>
              <p className="muted small prose">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
