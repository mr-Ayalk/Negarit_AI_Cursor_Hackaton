"use client";

import { useEffect, useState } from "react";
import type { MuseumLocation } from "@/lib/api";
import { api } from "@/lib/api";

type Props = {
  open: boolean;
  location: MuseumLocation | null;
  onClose: () => void;
};

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

export function AdModal({ open, location, onClose }: Props) {
  const ads = location?.ads || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<"browse" | "pay" | "done">("browse");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setPhone("");
      setPhase("browse");
      setStatus("");
      setBusy(false);
      setOk(false);
    }
  }, [open, location?.id]);

  if (!open || !ads.length) return null;

  const ad = ads.find((a) => a.productId === selected) || ads[0];

  const startPay = (productId: string) => {
    setSelected(productId);
    setPhase("pay");
    setStatus("");
    setOk(false);
  };

  const pay = async () => {
    if (!validEthPhone(phone)) {
      setStatus("Enter a valid Telebirr number (09XXXXXXXX or 07XXXXXXXX).");
      setOk(false);
      return;
    }
    setBusy(true);
    setStatus("Opening Telebirr…");
    setOk(false);
    try {
      const { payment } = await api.createPayment({
        amountETB: ad.priceETB,
        purpose: "product",
        productId: ad.productId,
        phone,
        description: ad.title,
      });
      setStatus("Confirming payment with Telebirr…");
      await new Promise((r) => setTimeout(r, 700));
      await api.confirmPayment(payment.id);
      setPhase("done");
      setStatus(`Paid ${ad.priceETB} ETB for ${ad.title}. Thank you!`);
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
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1.15rem" }}>Museum shop</h3>
          <button className="btn btn-ghost" style={{ padding: "0.35rem 0.65rem" }} onClick={onClose}>
            Close
          </button>
        </div>

        {phase === "browse" && (
          <div className="stack">
            {ads.map((item) => (
              <button
                key={item.id}
                className="btn btn-ghost"
                style={{ justifyContent: "space-between", textAlign: "left" }}
                onClick={() => startPay(item.productId)}
              >
                <span>
                  <strong>{item.title}</strong>
                  <br />
                  <span className="muted small">{item.subtitle}</span>
                </span>
                <span>{item.priceETB} ETB</span>
              </button>
            ))}
          </div>
        )}

        {phase === "pay" && (
          <div className="stack">
            <p>
              <strong>{ad.title}</strong> — {ad.priceETB} ETB
            </p>
            <input
              className="field"
              placeholder="Telebirr phone 09XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary btn-block" disabled={busy} onClick={pay}>
              {busy ? "Processing…" : "Pay with Telebirr"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setPhase("browse")}>
              Back
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="stack">
            <p className="small" style={{ color: ok ? "var(--ok)" : "var(--accent)" }}>
              {status}
            </p>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {phase !== "done" && status && (
          <p className="small" style={{ color: ok ? "var(--ok)" : "var(--accent)" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
