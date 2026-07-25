"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useGuide } from "@/lib/guide-context";

const AMOUNTS = [20, 50, 100, 200];

type Props = { open: boolean; onClose: () => void };

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

export function TipSheet({ open, onClose }: Props) {
  const { session } = useGuide();
  const [amount, setAmount] = useState(50);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
    if (!validEmail(email)) {
      setMessage("Enter a valid email for the Chapa receipt.");
      setOk(false);
      return;
    }
    if (phone && !validEthPhone(phone)) {
      setMessage("Phone must be 09XXXXXXXX or 07XXXXXXXX.");
      setOk(false);
      return;
    }
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      const name = (session.visitorName || "Visitor").trim();
      const parts = name.split(/\s+/);
      const { payment } = await api.tip(amount, {
        phone: phone || undefined,
        email: email.trim(),
        firstName: parts[0] || "Museum",
        lastName: parts.slice(1).join(" ") || "Visitor",
      });
      if (!payment.checkoutUrl) throw new Error("No checkout URL from Chapa");
      setMessage("Redirecting to Chapa…");
      setOk(true);
      window.location.href = payment.checkoutUrl;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Tip failed");
      setOk(false);
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <p className="eyebrow">Support</p>
            <h3 style={{ fontSize: "1.25rem" }}>Tip your guide</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: "0.35rem 0.65rem" }} onClick={onClose}>
            Close
          </button>
        </div>
        <p className="muted small">A small tip keeps Negarit guiding visitors through Adwa.</p>
        <div className="amount-row">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              className={`amount-chip ${amount === a ? "is-on" : ""}`}
              onClick={() => setAmount(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          className="field"
          type="email"
          placeholder="Email for receipt"
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
        <button className="btn btn-primary btn-block" disabled={busy} onClick={send}>
          {busy ? "Opening Chapa…" : `Tip ${amount} ETB with Chapa`}
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
