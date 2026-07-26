"use client";

import { useEffect, useState } from "react";
import type { ShopProduct } from "@/lib/api";
import { api } from "@/lib/api";
import { ShopPayBrands, TelebirrLogo } from "@/components/BrandLogos";

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

type Props = {
  product: ShopProduct | null;
  open: boolean;
  onClose: () => void;
};

export function ShopCheckout({ product, open, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"form" | "done">("form");
  const [status, setStatus] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setBusy(false);
      setPhase("form");
      setStatus("");
      setOk(false);
    }
  }, [open, product?.id]);

  if (!open || !product) return null;

  const pay = async () => {
    if (!validEthPhone(phone)) {
      setStatus("Enter a valid Telebirr number (09XXXXXXXX or 07XXXXXXXX).");
      setOk(false);
      return;
    }
    setBusy(true);
    setStatus("Connecting to Telebirr…");
    setOk(false);
    try {
      const { payment } = await api.createPayment({
        amountETB: product.priceETB,
        purpose: "product",
        productId: product.id,
        phone,
        description: `Zemen Gebeya · ${product.name}`,
      });
      setStatus("Confirming Telebirr payment…");
      await new Promise((r) => setTimeout(r, 800));
      await api.confirmPayment(payment.id);
      setPhase("done");
      setStatus(`Paid ${product.priceETB.toLocaleString()} ETB — order confirmed.`);
      setOk(true);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Payment failed");
      setOk(false);
    } finally {
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

        {phase === "form" ? (
          <>
            <div className="shop-checkout__price">
              <span className="muted small">Total</span>
              <strong>{product.priceETB.toLocaleString()} ETB</strong>
            </div>
            <p className="muted small prose">{product.description}</p>
            <label className="muted small" htmlFor="telebirr-phone">
              Telebirr phone
            </label>
            <input
              id="telebirr-phone"
              className="field"
              placeholder="09XXXXXXXX"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary btn-block btn-pay-tele" disabled={busy} onClick={pay}>
              {busy ? (
                "Processing…"
              ) : (
                <>
                  <TelebirrLogo size="sm" className="btn-pay-tele__logo" />
                  Pay with Telebirr
                </>
              )}
            </button>
            <p className="muted small" style={{ textAlign: "center" }}>
              Secure checkout via Ethio telecom Telebirr
            </p>
          </>
        ) : (
          <div className="stack" style={{ alignItems: "center", textAlign: "center", padding: "0.5rem 0" }}>
            <div className={`shop-checkout__seal ${ok ? "is-ok" : ""}`}>✓</div>
            <TelebirrLogo size="sm" />
            <p className="small" style={{ color: ok ? "var(--ok)" : "var(--accent)" }}>
              {status}
            </p>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Back to shop
            </button>
          </div>
        )}

        {phase === "form" && status && (
          <p className="small" style={{ color: ok ? "var(--ok)" : "var(--accent)" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
