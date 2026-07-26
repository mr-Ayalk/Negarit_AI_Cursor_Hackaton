"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";

function ReturnBody() {
  const router = useRouter();
  const params = useSearchParams();
  const txRef = params.get("tx_ref") || params.get("trx_ref") || "";
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "failed">("checking");
  const [detail, setDetail] = useState("Confirming your Chapa payment…");
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!txRef) {
      setStatus("failed");
      setDetail("Missing payment reference.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payments/chapa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tx_ref: txRef }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Verification failed");
        const st = data.payment?.status;
        setAmount(data.payment?.amountETB ?? null);
        if (st === "completed") {
          setStatus("success");
          setDetail("Payment received. Thank you for supporting Negarit.");
        } else if (st === "failed" || st === "cancelled") {
          setStatus("failed");
          setDetail("Payment was not completed. You can try again from the guide.");
        } else {
          setStatus("pending");
          setDetail("Payment is still processing. Chapa will confirm shortly.");
        }
      } catch (e) {
        if (cancelled) return;
        setStatus("failed");
        setDetail(e instanceof Error ? e.message : "Could not verify payment");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txRef]);

  return (
    <div className="wrap" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 520 }}>
      <p className="eyebrow">Chapa checkout</p>
      <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.1rem)", marginBottom: 10 }}>
        {status === "success"
          ? "Payment complete"
          : status === "checking"
            ? "Confirming…"
            : status === "pending"
              ? "Almost there"
              : "Payment issue"}
      </h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        {detail}
      </p>
      {amount != null && amount > 0 && (
        <p style={{ marginBottom: 18, fontFamily: "var(--font-d)", fontSize: "1.35rem" }}>
          {amount} ETB
        </p>
      )}
      {txRef && (
        <p className="muted small" style={{ marginBottom: 22 }}>
          Ref · {txRef}
        </p>
      )}
      <div className="row">
        <button className="btn btn-primary" onClick={() => router.push("/guide")}>
          Back to guide
        </button>
        <button className="btn btn-ghost" onClick={() => router.push("/")}>
          Home
        </button>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <div>
      <SiteHeader />
      <Suspense
        fallback={
          <div className="wrap" style={{ paddingTop: "2rem" }}>
            <p className="muted">Loading payment status…</p>
          </div>
        }
      >
        <ReturnBody />
      </Suspense>
    </div>
  );
}
