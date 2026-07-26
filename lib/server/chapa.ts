/**
 * Chapa payment gateway (server only).
 * Docs: https://developer.chapa.co — initialize + verify.
 */

export type PaymentRecord = {
  id: string;
  txRef: string;
  provider: "chapa";
  status: "pending" | "completed" | "failed" | "cancelled";
  amountETB: number;
  currency: string;
  purpose: string;
  productId: string | null;
  visitorId: string | null;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  description: string;
  checkoutUrl: string | null;
  createdAt: string;
  completedAt?: string;
  chapaStatus?: string;
  note: string;
};

const payments = new Map<string, PaymentRecord>();
const byTxRef = new Map<string, string>();

const CHAPA_BASE = "https://api.chapa.co/v1";

function secretKey() {
  return process.env.CHAPA_SECRET_KEY || "";
}

export function hasChapaKey() {
  return Boolean(secretKey());
}

export function publicKey() {
  return process.env.NEXT_PUBLIC_CHAPA_PUBLIC_KEY || "";
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function makeTxRef(purpose: string) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `negarit-${purpose.slice(0, 8)}-${stamp}-${rand}`.replace(/[^a-zA-Z0-9-]/g, "");
}

export async function initializeChapaPayment({
  amountETB,
  purpose,
  productId,
  visitorId,
  phone,
  email,
  firstName,
  lastName,
  description,
}: {
  amountETB: number;
  purpose: string;
  productId?: string;
  visitorId?: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  description?: string;
}): Promise<PaymentRecord> {
  const key = secretKey();
  if (!key) throw new Error("CHAPA_SECRET_KEY is not configured");
  if (!amountETB || amountETB < 1) throw new Error("amountETB must be at least 1");

  const id = crypto.randomUUID();
  const txRef = makeTxRef(purpose);
  const base = appBaseUrl();
  const title =
    purpose === "tip"
      ? "Negarit tip"
      : (description || "Museum shop").slice(0, 16);
  const desc = (description || "Adwa Museum purchase").slice(0, 50);

  const payload: Record<string, unknown> = {
    amount: String(Math.round(amountETB)),
    currency: "ETB",
    email: email || "visitor@negarit.ai",
    first_name: firstName || "Museum",
    last_name: lastName || "Visitor",
    tx_ref: txRef,
    callback_url: `${base}/api/payments/chapa/webhook`,
    return_url: `${base}/payment/return?tx_ref=${encodeURIComponent(txRef)}`,
    customization: {
      title,
      description: desc,
    },
  };

  if (phone && /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""))) {
    payload.phone_number = phone.replace(/\s+/g, "");
  }

  const res = await fetch(`${CHAPA_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.status !== "success") {
    const msg =
      json?.message ||
      json?.data?.message ||
      (typeof json === "string" ? json : null) ||
      `Chapa initialize failed (${res.status})`;
    let text = typeof msg === "string" ? msg : JSON.stringify(msg);
    if (/validation\.email|email/i.test(text)) {
      text = "Chapa rejected this email. Use a real address (e.g. Gmail or Yahoo).";
    }
    throw new Error(text);
  }

  const checkoutUrl = json?.data?.checkout_url as string | undefined;
  if (!checkoutUrl) throw new Error("Chapa did not return a checkout URL");

  const payment: PaymentRecord = {
    id,
    txRef,
    provider: "chapa",
    status: "pending",
    amountETB: Math.round(amountETB),
    currency: "ETB",
    purpose,
    productId: productId || null,
    visitorId: visitorId || null,
    phone: phone || null,
    email: (email as string) || "visitor@negarit.ai",
    firstName: firstName || "Museum",
    lastName: lastName || "Visitor",
    description: description || "Negarit AI payment",
    checkoutUrl,
    createdAt: new Date().toISOString(),
    note: "Awaiting Chapa checkout",
  };

  payments.set(id, payment);
  byTxRef.set(txRef, id);
  return payment;
}

export async function verifyChapaPayment(txRef: string): Promise<PaymentRecord | null> {
  const key = secretKey();
  if (!key) throw new Error("CHAPA_SECRET_KEY is not configured");
  if (!txRef) throw new Error("tx_ref is required");

  const res = await fetch(
    `${CHAPA_BASE}/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Chapa verify failed (${res.status})`);
  }

  let payment = getPaymentByTxRef(txRef);
  const statusRaw = String(json?.data?.status || json?.status || "").toLowerCase();
  const success = statusRaw === "success" || statusRaw === "successful";

  if (!payment) {
    // Reconstruct a minimal record if webhook/return arrives first
    payment = {
      id: crypto.randomUUID(),
      txRef,
      provider: "chapa",
      status: success ? "completed" : "pending",
      amountETB: Number(json?.data?.amount || 0),
      currency: "ETB",
      purpose: "unknown",
      productId: null,
      visitorId: null,
      phone: null,
      email: null,
      firstName: null,
      lastName: null,
      description: "Chapa payment",
      checkoutUrl: null,
      createdAt: new Date().toISOString(),
      chapaStatus: statusRaw,
      note: "Verified via Chapa",
    };
    payments.set(payment.id, payment);
    byTxRef.set(txRef, payment.id);
  }

  payment.chapaStatus = statusRaw;
  if (success) {
    payment.status = "completed";
    payment.completedAt = new Date().toISOString();
    payment.note = "Paid via Chapa";
  } else if (statusRaw === "failed" || statusRaw === "cancelled") {
    payment.status = statusRaw === "cancelled" ? "cancelled" : "failed";
    payment.note = `Chapa status: ${statusRaw}`;
  }

  payments.set(payment.id, payment);
  return payment;
}

export function getPayment(id: string) {
  return payments.get(id) || null;
}

export function getPaymentByTxRef(txRef: string) {
  const id = byTxRef.get(txRef);
  return id ? payments.get(id) || null : null;
}

/** @deprecated alias while migrating from Telebirr stubs */
export const createPayment = initializeChapaPayment;
export function confirmPayment(id: string) {
  const p = getPayment(id);
  if (!p) return null;
  // Prefer verify by tx_ref in real flow
  return p;
}
export function simulateTelebirrCallback(id: string, success = true) {
  const payment = getPayment(id);
  if (!payment) return null;
  payment.status = success ? "completed" : "failed";
  payment.completedAt = new Date().toISOString();
  payments.set(id, payment);
  return payment;
}
