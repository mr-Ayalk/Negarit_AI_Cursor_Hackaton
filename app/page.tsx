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
    setShow(true);
  }, []);

  return (
    <div>
      <SiteHeader />
      <section style={{ position: "relative", minHeight: "82dvh" }}>
        <Image
          src="/negarit-drum.png"
          alt="Negarit drum"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 35%" }}
        />
        <div className="hero-scrim" />
        <div
          className="wrap"
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "82dvh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: "2.4rem",
            paddingTop: "3rem",
            opacity: show ? 1 : 0,
            transition: "opacity 0.45s ease",
          }}
        >
          <p className="pill" style={{ width: "fit-content", marginBottom: "0.75rem" }}>
            Adwa Museum · Live guide
          </p>
          <h1 style={{ fontSize: "clamp(2.7rem, 9vw, 4.2rem)", marginBottom: "0.7rem" }}>
            Negarit AI
          </h1>
          <p className="muted" style={{ maxWidth: 440, marginBottom: "1.4rem", fontSize: "1.05rem" }}>
            Your WiFi guide through Adwa. Walk a hall, hear its story, shop artifacts, tip the
            guide, and leave with a visit story.
          </p>
          {error && <p style={{ color: "#e8a090", marginBottom: 10 }}>{error}</p>}
          <div className="row">
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={() => router.push(session.setupComplete ? "/guide" : "/setup")}
            >
              {session.setupComplete ? "Continue visit" : "Enter the museum"}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/setup")}>
              Setup
            </button>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: "2.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.9rem" }}>
          {[
            ["WiFi halls", "Gateway, 5gna Ber, 6gna Ber, Emperor Hall, Victory Court — each zone speaks."],
            ["Voice in, voice out", "Ask aloud. Negarit + Addis AI answer in English or Amharic."],
            ["Shop & tip", "Buy hall artifacts or tip the guide with Telebirr."],
          ].map(([t, b]) => (
            <div key={t} className="panel">
              <h2 style={{ fontSize: "1.15rem", marginBottom: 6 }}>{t}</h2>
              <p className="muted small">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
