import { NextRequest, NextResponse } from "next/server";
import { verifyChapaPayment } from "@/lib/server/chapa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const txRef = body.tx_ref || body.trx_ref;
    if (!txRef) {
      return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });
    }
    const payment = await verifyChapaPayment(String(txRef));
    return NextResponse.json({ payment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify failed" },
      { status: 500 }
    );
  }
}
