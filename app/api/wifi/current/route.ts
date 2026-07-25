import { NextResponse } from "next/server";
import { detectDeviceWifi } from "@/lib/server/wifi-detect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const info = await detectDeviceWifi();
  return NextResponse.json({
    ...info,
    time: new Date().toISOString(),
  });
}
