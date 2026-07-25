/**
 * Adwa Museum WiFi zone network.
 * Each hall has its own SSID (e.g. Adwa-5gna-Ber). Browsers cannot freely
 * read SSIDs for privacy, so Negarit uses:
 *  1) Online / connection readiness checks
 *  2) Live WiFi-zone proximity sensing mapped to museum halls
 *  3) Visitor arrival when they join / enter a hall zone
 */

export type WifiHit = {
  wifiId: string;
  ssid: string;
  rssi: number;
  timestamp: number;
  source: "wifi-zone" | "network-check" | "arrival";
};

export type WifiListener = (hit: WifiHit) => void;

export const MUSEUM_WIFI_ZONES = [
  { wifiId: "gateway", ssid: "ADWA-Staff", label: "Gateway", aliases: ["ADWA-Museum-Gateway", "Adwa-Museum-Gateway", "Negarit-Gateway"] },
  { wifiId: "5gna-ber", ssid: "ADWA-5gna-Ber", label: "5gna Ber", aliases: ["Adwa-5gna-Ber", "Negarit-5gna-Ber"] },
  { wifiId: "6gna-ber", ssid: "ADWA-6gna-Ber", label: "6gna Ber", aliases: ["Adwa-6gna-Ber", "Negarit-6gna-Ber"] },
  { wifiId: "emperor-hall", ssid: "ADWA-Emperor-Hall", label: "Emperor Hall", aliases: ["Adwa-Emperor-Hall", "Negarit-Emperor-Hall"] },
  { wifiId: "victory-court", ssid: "ADWA-Victory-Court", label: "Victory Court", aliases: ["Adwa-Victory-Court", "Negarit-Victory-Court"] },
] as const;

/** @deprecated alias while migrating UI */
export const MUSEUM_BEACONS = MUSEUM_WIFI_ZONES.map((z) => ({
  beaconId: z.wifiId,
  beaconName: z.ssid,
  label: z.label,
}));

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function prepareWifi(): Promise<{
  ok: boolean;
  mode: "wifi-zone" | "offline";
  message: string;
  connectionType?: string;
}> {
  if (typeof navigator === "undefined") {
    return { ok: true, mode: "wifi-zone", message: "WiFi zone sensing ready." };
  }

  if (!navigator.onLine) {
    return {
      ok: false,
      mode: "offline",
      message: "You appear offline. Connect to Adwa Museum WiFi, then continue.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const type = conn?.effectiveType || conn?.type || "wifi/unknown";

  return {
    ok: true,
    mode: "wifi-zone",
    connectionType: String(type),
    message: `Connected (${type}). Negarit reads your live WiFi name and guides you as it changes.`,
  };
}

/** Match a live SSID to a museum hall */
export function resolveSsid(ssid: string): WifiHit | null {
  const key = ssid.trim().toLowerCase();
  if (!key) return null;

  const zone = MUSEUM_WIFI_ZONES.find((z) => {
    const names = [z.ssid, z.wifiId, z.label, ...(z.aliases || [])].map((n) =>
      String(n).toLowerCase()
    );
    return names.some(
      (n) =>
        n === key ||
        key === n.replace(/\s+/g, "-") ||
        key.includes(z.wifiId) ||
        key.includes(z.label.toLowerCase().replace(/\s+/g, "-"))
    );
  });

  // Any ADWA-* / Adwa-* network maps to gateway if no exact hall match
  if (!zone && /^adwa[-_]/i.test(key)) {
    return {
      wifiId: "gateway",
      ssid: ssid.trim(),
      rssi: -48,
      timestamp: Date.now(),
      source: "network-check",
    };
  }

  if (!zone) return null;
  return {
    wifiId: zone.wifiId,
    ssid: ssid.trim(),
    rssi: -48,
    timestamp: Date.now(),
    source: "network-check",
  };
}

export class MuseumWifiNetwork {
  private listeners = new Set<WifiListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private index = -1;
  private scanning = false;
  private signals = new Map<string, number>();

  subscribe(listener: WifiListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSignal(wifiId: string) {
    return this.signals.get(wifiId) ?? 0;
  }

  getAllSignals() {
    return Object.fromEntries(this.signals);
  }

  isScanning() {
    return this.scanning;
  }

  startNetwork(startWifiId = "gateway") {
    this.stop();
    this.scanning = true;
    this.index = -1;
    MUSEUM_WIFI_ZONES.forEach((z) => this.signals.set(z.wifiId, 0.05));
    const id = MUSEUM_WIFI_ZONES.some((z) => z.wifiId === startWifiId)
      ? startWifiId
      : "gateway";
    this.arriveAt(id);
  }

  /** Resume sensing at a hall without resetting scan state incorrectly */
  resumeAt(wifiId: string) {
    this.scanning = true;
    const id = MUSEUM_WIFI_ZONES.some((z) => z.wifiId === wifiId) ? wifiId : "gateway";
    const zone = MUSEUM_WIFI_ZONES.find((z) => z.wifiId === id)!;
    this.index = MUSEUM_WIFI_ZONES.findIndex((z) => z.wifiId === id);
    MUSEUM_WIFI_ZONES.forEach((z) => {
      this.signals.set(z.wifiId, z.wifiId === id ? 0.9 : 0.08);
    });
    // Do not emit — avoid re-narrating on page refresh
    void zone;
  }

  arriveAt(wifiId: string) {
    const zone = MUSEUM_WIFI_ZONES.find((z) => z.wifiId === wifiId);
    if (!zone) return;
    this.index = MUSEUM_WIFI_ZONES.findIndex((z) => z.wifiId === wifiId);
    MUSEUM_WIFI_ZONES.forEach((z) => {
      this.signals.set(z.wifiId, z.wifiId === wifiId ? 0.96 : 0.08);
    });
    this.emit({
      wifiId: zone.wifiId,
      ssid: zone.ssid,
      rssi: -40,
      timestamp: Date.now(),
      source: "arrival",
    });
  }

  goToNextHall() {
    const next = Math.min(this.index + 1, MUSEUM_WIFI_ZONES.length - 1);
    if (next === this.index && this.index >= 0) return null;
    const zone = MUSEUM_WIFI_ZONES[next];
    this.arriveAt(zone.wifiId);
    return zone.wifiId;
  }

  startAmbientPulse() {
    this.stopPulseOnly();
    this.timer = setInterval(() => {
      if (!this.scanning || this.index < 0) return;
      const current = MUSEUM_WIFI_ZONES[this.index];
      const jitter = 0.86 + Math.random() * 0.12;
      this.signals.set(current.wifiId, jitter);
      MUSEUM_WIFI_ZONES.forEach((z, i) => {
        if (i === this.index) return;
        const dist = Math.abs(i - this.index);
        this.signals.set(z.wifiId, Math.max(0.04, 0.32 / dist + Math.random() * 0.04));
      });
    }, 900);
  }

  stop() {
    this.stopPulseOnly();
    this.scanning = false;
  }

  private stopPulseOnly() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private emit(hit: WifiHit) {
    this.listeners.forEach((l) => l(hit));
  }
}

/** Back-compat names used by older imports */
export const prepareBluetooth = prepareWifi;
export const pairNearbyBeacon = async () => null;
export class MuseumBeaconNetwork extends MuseumWifiNetwork {}
export type BeaconHit = WifiHit & { beaconId?: string; beaconName?: string };
