"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGuide } from "@/lib/guide-context";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/SiteHeader";

export default function SummaryPage() {
  const router = useRouter();
  const { session, speakText, locations } = useGuide();
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<{
    title: string;
    subtitle?: string;
    body: string;
    highlights?: { location: string; line: string }[];
  } | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.summary(
        session.visitorName || "Guest",
        session.visitedIds,
        session.language
      );
      setBlog(res.blog);
      await speakText(`${res.blog.title}. ${res.blog.body.slice(0, 240)}`, false);
    } catch (e) {
      setBlog({
        title: "Could not write your story",
        body: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const visitedNames = session.visitedIds
    .map((id) => locations.find((l) => l.id === id)?.name)
    .filter(Boolean);

  return (
    <div>
      <SiteHeader />
      <div className="wrap" style={{ paddingTop: "1.4rem", paddingBottom: "3rem", maxWidth: 700 }}>
        <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => router.push("/guide")}>
          ← Back to guide
        </button>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.15rem)", marginBottom: 8 }}>Your day at Adwa</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          Negarit writes one story from every hall you visited.
        </p>

        <div className="panel" style={{ marginBottom: 14 }}>
          <p className="small">
            Path:{" "}
            <strong style={{ color: "var(--accent-soft)" }}>
              {visitedNames.length ? visitedNames.join(" → ") : "No halls yet"}
            </strong>
          </p>
        </div>

        {!blog && (
          <div className="panel stack">
            <button className="btn btn-primary btn-block" onClick={generate} disabled={loading || !session.visitedIds.length}>
              {loading ? "Writing your story…" : "Generate visit story"}
            </button>
            {!session.visitedIds.length && (
              <p className="muted small">Visit at least one hall first.</p>
            )}
          </div>
        )}

        {blog && (
          <article className="panel">
            <h2 style={{ fontSize: "1.45rem", color: "var(--accent-soft)", marginBottom: 6 }}>
              {blog.title}
            </h2>
            {blog.subtitle && <p className="muted small" style={{ marginBottom: 14 }}>{blog.subtitle}</p>}
            {blog.body.split("\n\n").map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--font-b)",
                  fontSize: "1.02rem",
                  lineHeight: 1.7,
                  marginBottom: 14,
                }}
              >
                {p}
              </p>
            ))}
            {blog.highlights?.map((h) => (
              <div key={h.location} style={{ padding: "0.7rem 0", borderTop: "1px solid var(--line)" }}>
                <strong style={{ color: "var(--accent)" }}>{h.location}</strong>
                <p className="muted small" style={{ marginTop: 4 }}>{h.line}</p>
              </div>
            ))}
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={generate}>
                Rewrite
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({ title: blog.title, text: blog.body.slice(0, 280) });
                  } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(`${blog.title}\n\n${blog.body}`);
                    alert("Story copied to clipboard");
                  }
                }}
              >
                Share
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
