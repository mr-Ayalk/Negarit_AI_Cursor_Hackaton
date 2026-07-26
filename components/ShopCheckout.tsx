"use client";

import { useEffect, useState } from "react";
import type { ShopProduct } from "@/lib/api";
import { api } from "@/lib/api";
import { useGuide } from "@/lib/guide-context";
import { ShopPayBrands, ZemenLogo } from "@/components/BrandLogos";

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type Props = {
  product: ShopProduct | null;
  open: boolean;
  onClose: () => void;
};

export function ShopCheckout({ product, open, onClose }: Props) {
  const { session } = useGuide();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (open) {
      setPhone("");
      setEmail("");
      setBusy(false);
      setStatus("");
    }
  }, [open, product?.id]);

  if (!open || !product) return null;

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
        amountETB: product.priceETB,
        purpose: "product",
        productId: product.id,
        phone: phone || undefined,
        email: email.trim(),
        firstName: parts[0] || "Museum",
        lastName: parts.slice(1).join(" ") || "Visitor",
        description: `Zemen Gebeya · ${product.name}`,
      });
      if (!payment.checkoutUrl) throw new Error("No checkout URL from Chapa");
      setStatus("Redirecting to Chapa…");
      window.location.href = payment.checkoutUrl;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Payment failed");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet shop-checkout stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <ShopPayBrands size="sm" />
            <h3 style={{ fontSize: "1.15rem", letterSpacing: "-0.03em", marginTop: "0.75rem" }}>
              {product.name}
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              {product.nameAm}
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: "0.35rem 0.65rem" }} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="shop-checkout__price">
          <span className="muted small">Total</span>
          <strong>{product.priceETB.toLocaleString()} ETB</strong>
        </div>
        <p className="muted small prose">{product.description}</p>
        <label className="muted small" htmlFor="chapa-email">
          Email for receipt
        </label>
        <input
          id="chapa-email"
          className="field"
          type="email"
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <label className="muted small" htmlFor="chapa-phone">
          Phone (optional)
        </label>
        <input
          id="chapa-phone"
          className="field"
          placeholder="09XXXXXXXX"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn btn-primary btn-block" disabled={busy} onClick={pay}>
          {busy ? "Opening Chapa…" : "Pay with Chapa"}
        </button>
        <p className="muted small" style={{ textAlign: "center" }}>
          Secure checkout via Chapa · <ZemenLogo size="sm" className="inline-logo" />
        </p>

        {status && (
          <p className="small" style={{ color: "var(--muted)" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
