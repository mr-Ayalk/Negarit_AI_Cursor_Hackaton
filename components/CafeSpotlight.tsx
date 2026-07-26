"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, type CoffeePlace } from "@/lib/api";

/** Featured partner cafe strip — Mekonen Baklava @ Piazza */
export function CafeSpotlight({ compact }: { compact?: boolean }) {
  const [place, setPlace] = useState<CoffeePlace | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .coffee()
      .then((res) => {
        if (!alive) return;
        const featured =
          res.places.find((p) => p.featured) ||
          res.places.find((p) => p.id === "mekonen-baklava") ||
          res.places[0] ||
          null;
        setPlace(featured);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!place) return null;

  return (
    <article className={`cafe-spotlight ${compact ? "cafe-spotlight--compact" : ""}`}>
      <div className="cafe-spotlight__media">
        {place.image ? (
          <Image
            src={place.image}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
        ) : null}
        <div className="cafe-spotlight__veil" />
      </div>
      <div className="cafe-spotlight__body">
        <p className="pill" style={{ width: "fit-content", marginBottom: "0.65rem" }}>
          Cafe · {place.area || "Addis"}
        </p>
        <h2 className="cafe-spotlight__title">{place.name}</h2>
        <p className="muted small" style={{ marginBottom: "0.45rem" }}>
          {place.nameAm}
          {place.areaAm ? ` · ${place.areaAm}` : ""}
        </p>
        <p className="prose small muted" style={{ maxWidth: 380, marginBottom: "0.85rem" }}>
          {place.reason}
        </p>
        <div className="row" style={{ gap: "0.5rem" }}>
          <span className="cafe-spotlight__meta">{place.specialty}</span>
          <span className="cafe-spotlight__meta">{place.priceRange}</span>
        </div>
      </div>
    </article>
  );
}
