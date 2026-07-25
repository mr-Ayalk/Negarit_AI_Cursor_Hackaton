"use client";

type Props = {
  open: boolean;
  label: string;
};

export function HallTransition({ open, label }: Props) {
  if (!open) return null;
  return (
    <div className="hall-transition" role="status" aria-live="polite">
      <div className="hall-transition-card">
        <div className="hall-transition-ripple" />
        <div className="hall-transition-ripple delay" />
        <p className="hall-transition-label">{label || "Moving…"}</p>
        <div className="hall-transition-steps">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
