"use client";

import type { MuseumLocation } from "@/lib/api";

type Props = {
  locations: MuseumLocation[];
  currentId: string | null;
  visitedIds: string[];
  signals: Record<string, number>;
  onSelect: (id: string) => void;
};

export function MuseumMap({ locations, currentId, visitedIds, signals, onSelect }: Props) {
  const halls = [...locations].sort((a, b) => a.order - b.order);

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1.05rem" }}>Beacon map</h3>
        <span className="muted small">Signal strength live</span>
      </div>
      <div className="radar">
        <div className="radar-ring" style={{ width: 90, height: 90 }} />
        <div className="radar-ring" style={{ width: 160, height: 160 }} />
        <div className="radar-ring" style={{ width: 230, height: 230 }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path
            d="M50 90 C 50 78, 28 75, 28 68 C 28 58, 72 60, 72 52 C 72 42, 50 48, 50 38 C 50 28, 50 18, 50 14"
            fill="none"
            stroke="rgba(211,90,36,0.45)"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
        </svg>
        {halls.map((loc) => {
          const active = loc.id === currentId;
          const visited = visitedIds.includes(loc.id);
          const signal = signals[loc.id] ?? 0;
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              title={`${loc.name} · signal ${Math.round(signal * 100)}%`}
              style={{
                position: "absolute",
                left: `${loc.coordinates.x}%`,
                top: `${loc.coordinates.y}%`,
                transform: "translate(-50%, -50%)",
                width: active ? 54 : 42,
                height: active ? 54 : 42,
                borderRadius: "50%",
                border: active ? "2px solid var(--accent-soft)" : "1px solid var(--line)",
                background: active
                  ? "var(--accent)"
                  : visited
                    ? "rgba(211,90,36,0.35)"
                    : `rgba(42,28,21,${0.6 + signal * 0.4})`,
                boxShadow: active ? `0 0 ${12 + signal * 20}px rgba(211,90,36,0.45)` : undefined,
                display: "grid",
                placeItems: "center",
                fontSize: "0.52rem",
                fontWeight: 700,
                textAlign: "center",
                padding: 3,
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              {loc.name.replace(" Hall", "").replace(" Court", "").replace("Museum ", "")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
