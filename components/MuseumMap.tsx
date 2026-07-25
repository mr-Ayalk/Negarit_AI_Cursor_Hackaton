"use client";

import { useEffect, useMemo, useState } from "react";
import type { MuseumLocation } from "@/lib/api";

type Props = {
  locations: MuseumLocation[];
  currentId: string | null;
  previousId?: string | null;
  visitedIds: string[];
  signals: Record<string, number>;
  onSelect: (id: string) => void;
  animating?: boolean;
};

export function MuseumMap({
  locations,
  currentId,
  previousId,
  visitedIds,
  signals,
  onSelect,
  animating,
}: Props) {
  const halls = useMemo(
    () => [...locations].sort((a, b) => a.order - b.order),
    [locations]
  );

  const current = halls.find((h) => h.id === currentId);
  const previous = halls.find((h) => h.id === previousId);

  const [marker, setMarker] = useState({ x: 50, y: 92 });
  const [pathOn, setPathOn] = useState(false);

  useEffect(() => {
    if (!current) return;
    if (previous && animating) {
      setMarker({ x: previous.coordinates.x, y: previous.coordinates.y });
      setPathOn(true);
      const t = requestAnimationFrame(() => {
        setMarker({ x: current.coordinates.x, y: current.coordinates.y });
      });
      const clear = setTimeout(() => setPathOn(false), 1200);
      return () => {
        cancelAnimationFrame(t);
        clearTimeout(clear);
      };
    }
    setMarker({ x: current.coordinates.x, y: current.coordinates.y });
  }, [current, previous, animating, currentId]);

  const pathD =
    previous && current
      ? `M${previous.coordinates.x} ${previous.coordinates.y} L${current.coordinates.x} ${current.coordinates.y}`
      : "";

  return (
    <div className={`panel map-panel ${animating ? "is-routing" : ""}`}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1.05rem" }}>WiFi zone map</h3>
        <span className="muted small">
          {animating ? "Routing…" : "Tap a hall to walk"}
        </span>
      </div>
      <div className="radar">
        <div className="radar-sweep" />
        <div className="radar-ring" style={{ width: 90, height: 90 }} />
        <div className="radar-ring" style={{ width: 160, height: 160 }} />
        <div className="radar-ring" style={{ width: 230, height: 230 }} />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="map-path-svg"
        >
          <path
            d="M50 90 C 50 78, 28 75, 28 68 C 28 58, 72 60, 72 52 C 72 42, 50 48, 50 38 C 50 28, 50 18, 50 14"
            fill="none"
            stroke="rgba(211,90,36,0.35)"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            className="map-route-base"
          />
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              className={pathOn ? "map-route-active" : "map-route-idle"}
            />
          )}
        </svg>

        {halls.map((loc) => {
          const active = loc.id === currentId;
          const visited = visitedIds.includes(loc.id);
          const signal = signals[loc.id] ?? 0;
          return (
            <button
              key={loc.id}
              className={`map-node ${active ? "is-active" : ""} ${visited ? "is-visited" : ""}`}
              onClick={() => onSelect(loc.id)}
              title={`${loc.name} · signal ${Math.round(signal * 100)}%`}
              style={{
                left: `${loc.coordinates.x}%`,
                top: `${loc.coordinates.y}%`,
                ["--sig" as string]: String(0.6 + signal * 0.4),
              }}
            >
              <span className="map-node-pulse" />
              <span className="map-node-label">
                {loc.name.replace(" Hall", "").replace(" Court", "").replace("Museum ", "")}
              </span>
            </button>
          );
        })}

        {currentId && (
          <div
            className={`visitor-marker ${animating ? "is-moving" : ""}`}
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
