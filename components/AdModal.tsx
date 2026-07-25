"use client";

import { useState } from "react";
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

  if (!open || !ads.length) return null;

  const ad = ads.find((a) => a.productId === selected) || ads[0];

  const startPay = (productId: string) => {
    setSelected(productId);
    setPhase("pay");
    setStatus("");
  };

  const pay = async () => {
    if (!validEthPhone(phone)) {
      setStatus("Enter a valid Telebirr number (09XXXXXXXX or 07XXXXXXXX).");
      return;
    }
    setBusy(true);
    setStatus("Opening Telebirr…");
    try {
      const { payment } = await api.createPayment({
        amountETB: ad.priceETB,
        purpose: "product",
        productId: ad.productId,
        phone,
        description: ad.title,
      });
      setStatus("Confirming payment with Telebirr…");
      await new Promise((r) => setTimeout(r, 900));
      await api.confirmPayment(payment.id);
      setPhase("done");
      setStatus(`Paid ${ad.priceETB} ETB for ${ad.title}. Collect at the museum shop desk.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="pill">Shop · {location?.name}</p>
            <h3 style={{ fontSize: "1.2rem", marginTop: 6 }}>Artifacts for this hall</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: "0.4rem 0.7rem" }} onClick={onClose}>
            Close
          </button>
        </div>

        {phase === "browse" &&
          ads.map((item) => (
            <div key={item.id} className="panel" style={{ background: "var(--bg-elev)" }}>
              <div
                style={{
                  height: 96,
                  borderRadius: 10,
                  marginBottom: 10,
                  background: "linear-gradient(135deg, #3a2418, #1a2740 55%, #4a2010)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-d)",
                  color: "var(--accent-soft)",
                }}
              >
                {item.title}
              </div>
              <p style={{ fontWeight: 700 }}>{item.title}</p>
              <p className="muted small" style={{ marginBottom: 10 }}>
                {item.subtitle} · {item.priceETB.toLocaleString()} ETB
              </p>
              <button className="btn btn-primary btn-block" onClick={() => startPay(item.productId)}>
                Buy with Telebirr
              </button>
            </div>
          ))}

        {phase === "pay" && (
          <div className="stack">
            <p style={{ fontWeight: 650 }}>{ad.title}</p>
            <p className="muted small">{ad.priceETB.toLocaleString()} ETB via Telebirr</p>
            <input
              className="field"
              placeholder="Telebirr phone 09…"
              value={phone}
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary btn-block" disabled={busy} onClick={pay}>
              {busy ? "Processing…" : "Confirm payment"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setPhase("browse")}>
              Back
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="stack">
            <p style={{ color: "var(--ok)", fontWeight: 650 }}>Payment successful</p>
            <p className="muted small">{status}</p>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Continue visit
            </button>
          </div>
        )}

        {status && phase !== "done" && <p className="small" style={{ color: "var(--accent-soft)" }}>{status}</p>}
      </div>
    </div>
  );
}
