"use client";

import Image from "next/image";
import type { CoffeePlace } from "@/lib/api";

type Props = {
  open: boolean;
  message: string;
  place: CoffeePlace | null;
  onClose: () => void;
};

export function RefreshmentModal({ open, message, place, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: "center" }}>
      <div className="sheet cafe-sheet stack" onClick={(e) => e.stopPropagation()}>
        <p className="pill">
          <span className="dot" />
          Partner cafe
        </p>

        {place?.image && (
          <div className="cafe-sheet__media">
            <Image
              src={place.image}
              alt={place.name}
              fill
              sizes="440px"
              style={{ objectFit: "cover", objectPosition: "center 40%" }}
              priority
            />
            <div className="cafe-sheet__media-fade" />
          </div>
        )}

        <h3 style={{ fontSize: "1.25rem", letterSpacing: "-0.03em" }}>Time for a pause?</h3>
        <p className="muted prose small">{message}</p>

        {place && (
          <div className="cafe-card">
            <div className="cafe-card__top">
              <div>
                <p className="cafe-card__name">{place.name}</p>
                <p className="muted small">
                  {place.nameAm}
                  {place.areaAm ? ` · ${place.areaAm}` : ""}
                </p>
              </div>
              {(place.area || place.featured) && (
                <span className="cafe-card__tag">
                  {place.featured ? "Featured" : place.area}
                </span>
              )}
            </div>
            {(place.area || place.areaAm) && (
              <p className="cafe-card__area">
                {place.area}
                {place.areaAm ? ` · ${place.areaAm}` : ""}
              </p>
            )}
            <p className="small" style={{ marginTop: 8 }}>
              {place.specialty} · {place.priceRange}
            </p>
            <p className="muted small">
              {place.distance} · open until {place.openUntil}
            </p>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={onClose}>
          Continue exploring
        </button>
      </div>
    </div>
  );
}
