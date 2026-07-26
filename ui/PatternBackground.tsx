"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";

type PatternVariant = "dots" | "grid" | "both";

type Props = {
  variant?: PatternVariant;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Fade edges for hero sections */
  fade?: boolean;
};

/**
 * Vercel-style geometric pattern with optional mouse spotlight.
 */
export function PatternBackground({
  variant = "both",
  interactive = true,
  className = "",
  style,
  fade = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 40 });
  const raf = useRef(0);

  const onMove = useCallback(
    (e: ReactMouseEvent | MouseEvent) => {
      if (!interactive || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setPos({ x, y }));
    },
    [interactive]
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div
      ref={ref}
      className={`ui-pattern ${fade ? "ui-pattern--fade" : ""} ${className}`}
      style={
        {
          ...style,
          "--mx": `${pos.x}%`,
          "--my": `${pos.y}%`,
        } as CSSProperties
      }
      onMouseMove={interactive ? onMove : undefined}
      aria-hidden
    >
      {(variant === "grid" || variant === "both") && <div className="ui-pattern__grid" />}
      {(variant === "dots" || variant === "both") && <div className="ui-pattern__dots" />}
      {interactive && <div className="ui-pattern__glow" />}
      <div className="ui-pattern__noise" />
    </div>
  );
}
