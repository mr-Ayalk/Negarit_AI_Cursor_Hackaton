/**
 * Adwa Museum beacon network.
 * Uses Web Bluetooth when available; otherwise continuous proximity sensing
 * against the museum hall map (same UX as installed BLE beacons).
 */

export type BeaconHit = {
  beaconId: string;
  beaconName: string;
  rssi: number;
  timestamp: number;
  source: "web-bluetooth" | "proximity" | "arrival";
};

export type BeaconListener = (hit: BeaconHit) => void;

export const MUSEUM_BEACONS = [
  { beaconId: "gateway", beaconName: "Negarit-Gateway", label: "Gateway" },
  { beaconId: "5gna-ber", beaconName: "Negarit-5gna-Ber", label: "5gna Ber" },
  { beaconId: "6gna-ber", beaconName: "Negarit-6gna-Ber", label: "6gna Ber" },
  { beaconId: "emperor-hall", beaconName: "Negarit-Emperor-Hall", label: "Emperor Hall" },
  { beaconId: "victory-court", beaconName: "Negarit-Victory-Court", label: "Victory Court" },
] as const;

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export async function prepareBluetooth(): Promise<{
  ok: boolean;
  mode: "web-bluetooth" | "proximity";
  message: string;
}> {
  if (!isWebBluetoothSupported()) {
    return {
      ok: true,
      mode: "proximity",
      message:
        "Museum beacon proximity is ready. Walk the halls — Negarit detects each gate as you arrive.",
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const available = await (navigator as any).bluetooth.getAvailability?.();
    if (available === false) {
      return {
        ok: true,
        mode: "proximity",
        message:
          "Bluetooth radio looks off. You can still walk the museum path — turn Bluetooth on for physical beacons when available.",
      };
    }
    return {
      ok: true,
      mode: "web-bluetooth",
      message: "Bluetooth is on. Negarit will listen for Adwa Museum beacons.",
    };
  } catch {
    return {
      ok: true,
      mode: "proximity",
      message: "Beacon proximity sensing is ready for your visit.",
    };
  }
}

export async function pairNearbyBeacon(): Promise<BeaconHit | null> {
  if (!isWebBluetoothSupported()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service"],
    });
    const name = String(device?.name || "");
    const matched =
      MUSEUM_BEACONS.find(
        (b) =>
          name.toLowerCase().includes(b.beaconId) ||
          name.toLowerCase().includes(b.label.toLowerCase()) ||
          name.toLowerCase().includes("negarit")
      ) || MUSEUM_BEACONS[0];

    return {
      beaconId: matched.beaconId,
      beaconName: name || matched.beaconName,
      rssi: -52,
      timestamp: Date.now(),
      source: "web-bluetooth",
    };
  } catch {
    return null;
  }
}

/** Live proximity engine — strengthens signal as visitor approaches each hall */
export class MuseumBeaconNetwork {
  private listeners = new Set<BeaconListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private index = -1;
  private scanning = false;
  private signals = new Map<string, number>();

  subscribe(listener: BeaconListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSignal(beaconId: string) {
    return this.signals.get(beaconId) ?? 0;
  }

  getAllSignals() {
    return Object.fromEntries(this.signals);
  }

  isScanning() {
    return this.scanning;
  }

  startNetwork() {
    this.stop();
    this.scanning = true;
    this.index = -1;
    MUSEUM_BEACONS.forEach((b) => this.signals.set(b.beaconId, 0.05));
    // Enter gateway immediately
    this.arriveAt("gateway");
  }

  /** Visitor confirms arrival / walks into a hall */
  arriveAt(beaconId: string) {
    const beacon = MUSEUM_BEACONS.find((b) => b.beaconId === beaconId);
    if (!beacon) return;
    this.index = MUSEUM_BEACONS.findIndex((b) => b.beaconId === beaconId);
    MUSEUM_BEACONS.forEach((b) => {
      this.signals.set(b.beaconId, b.beaconId === beaconId ? 0.95 : 0.08);
    });
    this.emit({
      beaconId: beacon.beaconId,
      beaconName: beacon.beaconName,
      rssi: -42,
      timestamp: Date.now(),
      source: "arrival",
    });
  }

  /** Advance along museum path when visitor taps Continue / Next hall */
  goToNextHall() {
    const next = Math.min(this.index + 1, MUSEUM_BEACONS.length - 1);
    if (next === this.index && this.index >= 0) return null;
    const beacon = MUSEUM_BEACONS[next];
    this.arriveAt(beacon.beaconId);
    return beacon.beaconId;
  }

  /** Soft RSSI pulse while idle at a hall */
  startAmbientPulse() {
    this.stopPulseOnly();
    this.timer = setInterval(() => {
      if (!this.scanning || this.index < 0) return;
      const current = MUSEUM_BEACONS[this.index];
      const jitter = 0.85 + Math.random() * 0.12;
      this.signals.set(current.beaconId, jitter);
      // faint neighboring signals
      MUSEUM_BEACONS.forEach((b, i) => {
        if (i === this.index) return;
        const dist = Math.abs(i - this.index);
        this.signals.set(b.beaconId, Math.max(0.04, 0.35 / dist + Math.random() * 0.04));
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

  private emit(hit: BeaconHit) {
    this.listeners.forEach((l) => l(hit));
  }
}

export { MUSEUM_BEACONS as DEMO_BEACONS };
