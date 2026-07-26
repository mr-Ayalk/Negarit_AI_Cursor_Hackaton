export type MuseumLocation = {
  id: string;
  name: string;
  nameAm: string;
  beaconId: string;
  beaconName: string;
  order: number;
  type: string;
  coordinates: { x: number; y: number };
  welcome: boolean;
  narrative: { en: string; am: string };
  guideScript: { en: string; am: string };
  stories?: { id: string; title: string; body: string }[];
  ads: AdItem[];
  amenities: string[];
};

export type AdItem = {
  id: string;
  productId: string;
  title: string;
  subtitle: string;
  image: string;
  priceETB: number;
  cta: string;
};

export type ShopProduct = {
  id: string;
  name: string;
  nameAm: string;
  description: string;
  priceETB: number;
  category: string;
  locationId?: string;
  image: string;
  imageFocus?: string;
  badge?: string;
};

export type CoffeePlace = {
  id: string;
  name: string;
  nameAm: string;
  distance: string;
  specialty: string;
  priceRange: string;
  openUntil: string;
  nearLocationId: string;
  reason: string;
  area?: string;
  areaAm?: string;
  image?: string;
  featured?: boolean;
};

export type VisitSession = {
  visitorName: string;
  language: "en" | "am";
  startedAt: string;
  visitedIds: string[];
  currentLocationId: string | null;
  bluetoothReady: boolean;
  setupComplete: boolean;
};

export type Payment = {
  id: string;
  txRef?: string;
  provider: string;
  status: string;
  amountETB: number;
  purpose: string;
  checkoutUrl?: string | null;
};

/** Same-origin Next.js API — works locally and on Vercel */
const API = process.env.NEXT_PUBLIC_API_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  locations: () => request<{ locations: MuseumLocation[] }>("/locations"),
  resolveBeacon: (beaconId: string, rssi?: number) =>
    request<{ matched: boolean; location: MuseumLocation; proximity: string }>(
      "/wifi/resolve",
      { method: "POST", body: JSON.stringify({ wifiId: beaconId, beaconId, rssi }) }
    ),
  translate: (text: string, from: "en" | "am", to: "en" | "am") =>
    request<{ translation: string; provider: string }>("/ai/translate", {
      method: "POST",
      body: JSON.stringify({ text, from, to }),
    }),
  welcome: (visitorName: string, language: string) =>
    request<{ text: string; tts: { durationMs: number }; location: MuseumLocation }>(
      "/ai/welcome",
      { method: "POST", body: JSON.stringify({ visitorName, language }) }
    ),
  guide: (payload: {
    visitorName: string;
    locationId: string;
    question?: string;
    language: string;
  }) =>
    request<{ reply: string; tts: { durationMs: number } }>("/ai/guide", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  tts: (text: string, language: "en" | "am" = "en") =>
    request<{
      durationMs: number;
      text: string;
      audioBase64?: string | null;
      mimeType?: string | null;
      provider?: string;
    }>("/ai/tts", {
      method: "POST",
      body: JSON.stringify({ text, language, provider: "elevenlabs" }),
    }),
  aiStatus: () =>
    request<{ addisAi: boolean; elevenLabs: boolean; wifiDetect: boolean }>("/ai/status"),
  stt: (
    language: string,
    audio?: { audioBase64: string; mimeType?: string }
  ) =>
    request<{ text: string; provider?: string }>("/ai/stt", {
      method: "POST",
      body: JSON.stringify({ language, ...audio }),
    }),
  refreshmentCheck: (payload: {
    visitMinutes: number;
    voiceLevel: number;
    currentLocationId?: string | null;
    language: string;
    force?: boolean;
  }) =>
    request<{
      suggest: boolean;
      message?: string;
      place?: CoffeePlace;
      tts?: { durationMs: number };
    }>("/ai/refreshment-check", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  summary: (visitorName: string, visitedLocationIds: string[], language: string) =>
    request<{
      blog: {
        title: string;
        subtitle?: string;
        body: string;
        highlights?: { location: string; line: string }[];
      };
      tts: { durationMs: number };
    }>("/ai/summary", {
      method: "POST",
      body: JSON.stringify({ visitorName, visitedLocationIds, language }),
    }),
  createPayment: (payload: {
    amountETB: number;
    purpose: string;
    productId?: string;
    visitorId?: string;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    description?: string;
  }) =>
    request<{ payment: Payment }>("/payments/chapa", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  confirmPayment: (id: string) =>
    request<{ payment: Payment }>(`/payments/${id}/confirm`, { method: "POST" }),
  verifyChapa: (txRef: string) =>
    request<{ payment: Payment }>("/payments/chapa/verify", {
      method: "POST",
      body: JSON.stringify({ tx_ref: txRef }),
    }),
  tip: (
    amountETB: number,
    opts?: { phone?: string; email?: string; firstName?: string; lastName?: string }
  ) =>
    request<{ payment: Payment; message: string }>("/tips", {
      method: "POST",
      body: JSON.stringify({ amountETB, ...opts }),
    }),
  coffee: (near?: string) =>
    request<{ places: CoffeePlace[] }>(
      near ? `/coffee?near=${encodeURIComponent(near)}` : "/coffee"
    ),
  products: (locationId?: string) =>
    request<{ products: ShopProduct[] }>(
      locationId
        ? `/products?locationId=${encodeURIComponent(locationId)}`
        : "/products"
    ),
};
