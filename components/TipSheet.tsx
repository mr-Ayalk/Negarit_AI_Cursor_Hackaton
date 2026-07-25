"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const AMOUNTS = [20, 50, 100, 200];

type Props = { open: boolean; onClose: () => void };

export function TipSheet({ open, onClose }: Props) {
  const [amount, setAmount] = useState(50);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (!open) return null;

  const send = async () => {
    setBusy(true);
    setDone(null);
    try {
      const { payment, message } = await api.tip(amount, phone || undefined);
      await new Promise((r) => setTimeout(r, 700));
      await api.confirmPayment(payment.id);
      setDone(`${message} ${amount} ETB received.`);
    } catch (e) {
      setDone(e instanceof Error ? e.message : "Tip failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1.15rem" }}>Tip your guide</h3>
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
        <button className="btn btn-primary btn-block" disabled={busy} onClick={send}>
          {busy ? "Sending…" : `Send ${amount} ETB`}
        </button>
        {done && <p className="small" style={{ color: "var(--ok)" }}>{done}</p>}
      </div>
    </div>
  );
}
