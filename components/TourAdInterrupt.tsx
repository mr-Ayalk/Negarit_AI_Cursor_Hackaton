"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AdItem, MuseumLocation } from "@/lib/api";
import { api } from "@/lib/api";
import { useGuide } from "@/lib/guide-context";
import { ShopPayBrands } from "@/components/BrandLogos";

export type AdInterruptMode = "exhibit" | "marketplace";

type Props = {
  open: boolean;
  mode: AdInterruptMode;
  location: MuseumLocation | null;
  ads: AdItem[];
  onClose: () => void;
};

function validEthPhone(phone: string) {
  return /^(09|07)\d{8}$/.test(phone.replace(/\s+/g, ""));
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function TourAdInterrupt({ open, mode, location, ads, onClose }: Props) {
  const { session } = useGuide();
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"interrupt" | "pay">("interrupt");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(ads[0]?.productId || null);
      setPhone("");
      setEmail("");
      setPhase("interrupt");
      setStatus("");
      setBusy(false);
    }
  }, [open, location?.id, mode, ads]);

  if (!open || !ads.length) return null;

  const ad = ads.find((a) => a.productId === selected) || ads[0];
  const isMarket = mode === "marketplace";

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
        description: `Zemen Gebeya · ${ad.title}`,
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
    <div className="overlay ad-interrupt-overlay" onClick={(e) => e.stopPropagation()}>
      <div
        className={`sheet ad-interrupt stack ${isMarket ? "ad-interrupt--market" : "ad-interrupt--exhibit"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-interrupt-title"
      >
        <div className="ad-interrupt__banner">
          <span className="ad-interrupt__pulse" />
          {isMarket ? "Nearby shop · tour pause" : "Exhibit match · tour pause"}
        </div>

        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <ShopPayBrands size="sm" />
            <h3
              id="ad-interrupt-title"
              style={{ fontSize: "1.2rem", letterSpacing: "-0.03em", marginTop: "0.65rem" }}
            >
              {isMarket
                ? "You are near the museum shop"
                : `From ${location?.name || "this hall"}`}
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              {isMarket
                ? "Traditional tools & crafts related to your path — continue after a look."
                : "This piece connects to what you just heard."}
            </p>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
            onClick={onClose}
          >
            Skip
          </button>
        </div>

        {phase === "interrupt" && (
          <>
            <div className="ad-interrupt__media">
              <Image
                src={ad.image || "/shop.jpg"}
                alt=""
                fill
                sizes="440px"
                style={{ objectFit: "cover", objectPosition: "center 40%" }}
              />
              <div className="ad-interrupt__media-fade" />
            </div>

            <div className="ad-interrupt__picks">
              {ads.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ad-interrupt__pick ${selected === item.productId ? "is-on" : ""}`}
                  onClick={() => setSelected(item.productId)}
                >
                  <span className="ad-interrupt__pick-title">{item.title}</span>
                  <span className="muted small">{item.subtitle}</span>
                  <span className="ad-interrupt__pick-price">
                    {item.priceETB.toLocaleString()} ETB
                  </span>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                setPhase("pay");
                setStatus("");
              }}
            >
              {ad.cta?.includes("Telebirr") ? "Buy with Chapa" : ad.cta || "Buy with Chapa"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={onClose}>
              Continue tour
            </button>
          </>
        )}

        {phase === "pay" && (
          <div className="stack">
            <div className="shop-checkout__price">
              <span className="muted small">{ad.title}</span>
              <strong>{ad.priceETB.toLocaleString()} ETB</strong>
            </div>
            <input
              className="field"
              type="email"
              placeholder="Email for Chapa receipt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="field"
              placeholder="Phone 09XXXXXXXX (optional)"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary btn-block" disabled={busy} onClick={pay}>
              {busy ? "Opening Chapa…" : "Pay with Chapa"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setPhase("interrupt")}>
              Back
            </button>
          </div>
        )}

        {status && <p className="small" style={{ color: "var(--muted)" }}>{status}</p>}
      </div>
    </div>
  );
}
