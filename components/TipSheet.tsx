"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TelebirrLogo } from "@/components/BrandLogos";

const AMOUNTS = [20, 50, 100, 200];

type Props = { open: boolean; onClose: () => void };

export function TipSheet({ open, onClose }: Props) {
  const [amount, setAmount] = useState(50);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage(null);
      setOk(false);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const send = async () => {
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      const { payment, message: msg } = await api.tip(amount, phone || undefined);
      await new Promise((r) => setTimeout(r, 700));
      await api.confirmPayment(payment.id);
      setMessage(`${msg} ${amount} ETB received.`);
      setOk(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Tip failed");
      setOk(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <TelebirrLogo size="sm" />
            <h3 style={{ fontSize: "1.15rem", marginTop: "0.65rem" }}>Tip your guide</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: "0.35rem 0.65rem" }} onClick={onClose}>
            Close
          </button>
        </div>
        <p className="muted small">Support Negarit AI with Telebirr.</p>
        <div className="row">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              className="btn btn-ghost"
              style={{ flex: 1, borderColor: amount === a ? "var(--accent)" : undefined }}
              onClick={() => setAmount(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          className="field"
          placeholder="Telebirr phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn btn-primary btn-block btn-pay-tele" disabled={busy} onClick={send}>
          {busy ? (
            "Sending…"
          ) : (
            <>
              <TelebirrLogo size="sm" className="btn-pay-tele__logo" />
              Send {amount} ETB
            </>
          )}
        </button>
        {message && (
          <p className="small" style={{ color: ok ? "var(--ok)" : "var(--accent)" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
