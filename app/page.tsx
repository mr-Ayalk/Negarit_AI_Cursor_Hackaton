"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGuide } from "@/lib/guide-context";
import { SiteHeader } from "@/components/SiteHeader";

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
      <section className="hero-plane">
        <Image
          src="/negarit-drum.png"
          alt="Negarit war drum at Adwa"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 32%" }}
        />
        <div className="hero-scrim" />
        <div
          className="wrap hero-copy"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <p className="brand-mark">Negarit AI</p>
          <h1 className="hero-title">Walk Adwa. Hear it speak.</h1>
          <p className="hero-lede">
            A living guide through the Victory Memorial — WiFi halls, spoken stories, and Chapa
            for the shop and tip.
          </p>
          {error && <p style={{ color: "#c45c26", marginBottom: 10 }}>{error}</p>}
          <div className="row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => router.push(session.setupComplete ? "/guide" : "/setup")}
            >
              {session.setupComplete ? "Continue visit" : "Begin visit"}
            </button>
          </div>
        </div>
      </section>

      <section className="wrap strip">
        <p className="strip-line">
          Gateway → 5gna Ber → 6gna Ber → Emperor Hall → Victory Court
        </p>
        <p className="muted small" style={{ maxWidth: 420 }}>
          Ask in English or Amharic. Negarit answers with museum knowledge — Addis AI for Amharic,
          ElevenLabs for voice.
        </p>
      </section>
    </div>
  );
}
