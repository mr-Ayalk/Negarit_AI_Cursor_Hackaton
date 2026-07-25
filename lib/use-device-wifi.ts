"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LiveWifiStatus = {
  ssid: string | null;
  connected: boolean;
  platform?: string;
  source?: string;
  error?: string;
  updatedAt: number;
  loading: boolean;
};

const EMPTY: LiveWifiStatus = {
  ssid: null,
  connected: false,
  updatedAt: 0,
  loading: true,
};

/**
 * Polls the local Next.js server for the device's current WiFi SSID
 * and refreshes when the browser reports connection changes.
 */
export function useDeviceWifi(pollMs = 2500) {
  const [status, setStatus] = useState<LiveWifiStatus>(EMPTY);
  const lastSsid = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wifi/current", { cache: "no-store" });
      const data = await res.json();
      const ssid = data.ssid ? String(data.ssid) : null;
      setStatus({
        ssid,
        connected: Boolean(data.connected && ssid),
        platform: data.platform,
        source: data.source,
        error: data.error,
        updatedAt: Date.now(),
        loading: false,
      });
      return { ssid, changed: ssid !== lastSsid.current };
    } catch (e) {
      setStatus((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Could not read WiFi",
        updatedAt: Date.now(),
      }));
      return { ssid: null, changed: false };
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (!alive) return;
      const result = await refresh();
      if (result.ssid !== lastSsid.current) {
        lastSsid.current = result.ssid;
      }
    };

    void tick();
    const id = setInterval(tick, pollMs);

    const onNet = () => void tick();
    window.addEventListener("online", onNet);
    window.addEventListener("offline", onNet);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    conn?.addEventListener?.("change", onNet);

    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("online", onNet);
      window.removeEventListener("offline", onNet);
      conn?.removeEventListener?.("change", onNet);
    };
  }, [pollMs, refresh]);

  return { ...status, refresh };
}
