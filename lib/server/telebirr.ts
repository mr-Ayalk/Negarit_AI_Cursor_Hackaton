export type PaymentRecord = {
  id: string;
  provider: string;
  status: string;
  amountETB: number;
  currency: string;
  purpose: string;
  productId: string | null;
  visitorId: string | null;
  phone: string | null;
  description: string;
  checkoutUrl: string;
  createdAt: string;
  completedAt?: string;
  note: string;
};

const payments = new Map<string, PaymentRecord>();

export function createPayment({
  amountETB,
  purpose,
  productId,
  visitorId,
  phone,
  description,
}: {
  amountETB: number;
  purpose: string;
  productId?: string;
  visitorId?: string;
  phone?: string;
  description?: string;
}): PaymentRecord {
  const id = crypto.randomUUID();
  const payment: PaymentRecord = {
    id,
    provider: "telebirr",
    status: "pending",
    amountETB,
    currency: "ETB",
    purpose,
    productId: productId || null,
    visitorId: visitorId || null,
    phone: phone || null,
    description: description || "Negarit AI payment",
    checkoutUrl: `https://telebirr.placeholder/pay/${id}`,
    createdAt: new Date().toISOString(),
    note: "Replace with real Telebirr initiate-payment API",
  };
  payments.set(id, payment);
  return payment;
}

export function confirmPayment(id: string) {
  const payment = payments.get(id);
  if (!payment) return null;
  payment.status = "completed";
  payment.completedAt = new Date().toISOString();
  payments.set(id, payment);
  return payment;
}

export function getPayment(id: string) {
  return payments.get(id) || null;
}

export function simulateTelebirrCallback(id: string, success = true) {
  const payment = payments.get(id);
  if (!payment) return null;
  payment.status = success ? "completed" : "failed";
  payment.completedAt = new Date().toISOString();
  payments.set(id, payment);
  return payment;
}
