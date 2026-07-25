"use client";

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
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <p className="pill">Refreshment</p>
        <h3 style={{ fontSize: "1.25rem" }}>Time for a pause?</h3>
        <p className="muted">{message}</p>
        {place && (
          <div className="panel" style={{ background: "var(--bg-elev)" }}>
            <p style={{ fontWeight: 700 }}>{place.name}</p>
            <p className="muted small">{place.nameAm}</p>
            <p className="small" style={{ marginTop: 8 }}>
              {place.specialty} · {place.priceRange}
            </p>
            <p className="muted small">{place.distance} · open until {place.openUntil}</p>
          </div>
        )}
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Continue exploring
        </button>
      </div>
    </div>
  );
}
