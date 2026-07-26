import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTxRef, verifyChapaPayment } from "@/lib/server/chapa";

/** Chapa server callback — verify tx_ref when notified */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const txRef =
      body.tx_ref || body.trx_ref || body.txRef || req.nextUrl.searchParams.get("trx_ref");
    if (!txRef) {
      return NextResponse.json({ error: "tx_ref required" }, { status: 400 });
    }
    const payment = await verifyChapaPayment(String(txRef));
    return NextResponse.json({ ok: true, payment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const txRef = req.nextUrl.searchParams.get("trx_ref") || req.nextUrl.searchParams.get("tx_ref");
  if (!txRef) {
    return NextResponse.json({ error: "tx_ref required" }, { status: 400 });
  }
  try {
    const existing = getPaymentByTxRef(txRef);
    const payment = await verifyChapaPayment(txRef);
    return NextResponse.json({ ok: true, payment: payment || existing });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify failed" },
      { status: 500 }
    );
  }
}
