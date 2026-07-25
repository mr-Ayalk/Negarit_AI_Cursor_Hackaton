"use client";

import { useEffect, useState } from "react";
import type { MuseumLocation } from "@/lib/api";
import { api } from "@/lib/api";
import { useGuide } from "@/lib/guide-context";

type Props = {
  open: boolean;
  location: MuseumLocation | null;
  onClose: () => void;
};

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AdModal({ open, location, onClose }: Props) {
  const { session } = useGuide();
  const ads = location?.ads || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"browse" | "pay" | "redirect">("browse");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setPhone("");
      setEmail("");
      setPhase("browse");
      setStatus("");
      setBusy(false);
    }
  }, [open, location?.id]);

  if (!open || !ads.length) return null;

  const ad = ads.find((a) => a.productId === selected) || ads[0];

  const startPay = (productId: string) => {
    setSelected(productId);
    setPhase("pay");
    setStatus("");
  };

  const pay = async () => {
    if (!validEmail(email)) {
      setStatus("Enter a valid email for the Chapa receipt.");
      return;
    }
    if (phone && !validEthPhone(phone)) {
      setStatus("Phone must be 09XXXXXXXX or 07XXXXXXXX.");
      return;
    }
    setBusy(true);
    setStatus("Creating Chapa checkout…");
    try {
      const name = (session.visitorName || "Visitor").trim();
      const parts = name.split(/\s+/);
      const { payment } = await api.createPayment({
        amountETB: ad.priceETB,
        purpose: "product",
        productId: ad.productId,
        phone: phone || undefined,
        email: email.trim(),
        firstName: parts[0] || "Museum",
        lastName: parts.slice(1).join(" ") || "Visitor",
        description: ad.title,
      });
      if (!payment.checkoutUrl) throw new Error("No checkout URL from Chapa");
      setPhase("redirect");
      setStatus("Redirecting to Chapa…");
      window.location.href = payment.checkoutUrl;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Payment failed");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <p className="eyebrow">Museum shop</p>
            <h3 style={{ fontSize: "1.25rem" }}>Hall collection</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: "0.35rem 0.65rem" }} onClick={onClose}>
            Close
          </button>
        </div>

        {phase === "browse" && (
          <div className="stack">
            <p className="muted small">Pieces tied to this hall — pay securely with Chapa.</p>
            {ads.map((item) => (
              <button
                key={item.id}
                className="shop-item"
                onClick={() => startPay(item.productId)}
              >
                <span>
                  <strong>{item.title}</strong>
                  <br />
                  <span className="muted small">{item.subtitle}</span>
                </span>
                <span className="shop-price">{item.priceETB} ETB</span>
              </button>
            ))}
          </div>
        )}

        {(phase === "pay" || phase === "redirect") && (
          <div className="stack">
            <p>
              <strong>{ad.title}</strong>
              <span className="muted"> · {ad.priceETB} ETB</span>
            </p>
            <input
              className="field"
              type="email"
              placeholder="Email (e.g. you@gmail.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="field"
              placeholder="Phone 09XXXXXXXX (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
            <button className="btn btn-primary btn-block" disabled={busy} onClick={pay}>
              {busy ? "Opening Chapa…" : "Pay with Chapa"}
            </button>
            <button
              className="btn btn-ghost btn-block"
              disabled={busy}
              onClick={() => setPhase("browse")}
            >
              Back
            </button>
            <p className="muted small">You will complete payment on Chapa’s secure page.</p>
          </div>
        )}

        {status && (
          <p className="small" style={{ color: status.includes("fail") || status.includes("valid") ? "var(--accent)" : "var(--muted)" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
