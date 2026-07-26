"use client";

import { useEffect, useRef } from "react";
import { useDeviceWifi } from "@/lib/use-device-wifi";

type Props = {
  compact?: boolean;
  onSsidChange?: (ssid: string | null, prev: string | null) => void;
};

export function WifiStatusCard({ compact, onSsidChange }: Props) {
  const wifi = useDeviceWifi(2000);
  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (wifi.loading) return;
    if (prev.current === undefined) {
      prev.current = wifi.ssid;
      onSsidChange?.(wifi.ssid, null);
      return;
    }
    if (prev.current !== wifi.ssid) {
      const old = prev.current;
      prev.current = wifi.ssid;
      onSsidChange?.(wifi.ssid, old);
    }
  }, [wifi.loading, wifi.ssid, onSsidChange]);

  if (compact) {
    return (
      <div className="pill" title={wifi.error || wifi.source || "WiFi"}>
        <span className="dot" style={{ background: wifi.connected ? "var(--ok)" : "var(--accent)" }} />
        {wifi.loading ? "Reading WiFi…" : wifi.ssid || "No WiFi SSID"}
      </div>
    );
  }

  return (
    <div className="panel stack" style={{ gap: "0.55rem" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="muted small">Connected WiFi</p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
          onClick={() => wifi.refresh()}
        >
          Refresh
        </button>
      </div>
      <div className="row" style={{ alignItems: "center", gap: "0.65rem" }}>
        <span
          className="dot"
          style={{
            background: wifi.connected ? "var(--ok)" : "var(--accent)",
            width: 10,
            height: 10,
          }}
        />
        <p style={{ fontFamily: "var(--font-mono-stack)", fontSize: "1.2rem", wordBreak: "break-word", letterSpacing: "-0.03em" }}>
          {wifi.loading ? "Detecting…" : wifi.ssid || "Not connected to WiFi"}
        </p>
      </div>
      <p className="muted small">
        {wifi.connected
          ? "Live — updates automatically when you switch networks."
          : wifi.error || "Connect this PC to WiFi, then wait a second."}
      </p>
    </div>
  );
}
