import { NextRequest, NextResponse } from "next/server";
import {
  locations,
  coffeePlaces,
  products,
  getLocationByBeacon,
  getLocationById,
} from "@/lib/server/locations";
import {
  speechToText,
  textToSpeech,
  generateGuideReply,
  generateVisitBlog,
  researchEnrichment,
} from "@/lib/server/ai";
import {
  createPayment,
  confirmPayment,
  getPayment,
  simulateTelebirrCallback,
} from "@/lib/server/telebirr";

type Ctx = { params: Promise<{ path?: string[] }> };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const path = ((await ctx.params).path || []).join("/");

  if (path === "health" || path === "") {
    return json({ ok: true, service: "negarit-ai", time: new Date().toISOString() });
  }
  if (path === "locations") return json({ locations });
  if (path.startsWith("locations/")) {
    const id = path.slice("locations/".length);
    const location = getLocationById(id);
    if (!location) return json({ error: "Location not found" }, 404);
    return json({ location });
  }
  if (path === "coffee" || path.startsWith("coffee")) {
    const near = req.nextUrl.searchParams.get("near");
    let list = coffeePlaces;
    if (near) list = coffeePlaces.filter((c) => c.nearLocationId === near);
    return json({ places: list.length ? list : coffeePlaces });
  }
  if (path === "products") {
    const locationId = req.nextUrl.searchParams.get("locationId");
    let list = products;
    if (locationId) list = products.filter((p) => p.locationId === locationId);
    return json({ products: list });
  }
  if (path.startsWith("payments/") && !path.includes("/")) {
    // handled below with segments
  }
  const payMatch = path.match(/^payments\/([^/]+)$/);
  if (payMatch) {
    const payment = getPayment(payMatch[1]);
    if (!payment) return json({ error: "Payment not found" }, 404);
    return json({ payment });
  }

  return json({ error: "Not found", path }, 404);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const path = ((await ctx.params).path || []).join("/");
  const body = await req.json().catch(() => ({}));

  try {
    if (path === "beacon/resolve") {
      const location = getLocationByBeacon(body.beaconId || body.beaconName);
      if (!location) {
        return json(
          {
            error: "Unknown beacon",
            tip: "Use: gateway, 5gna-ber, 6gna-ber, emperor-hall, victory-court",
          },
          404
        );
      }
      const rssi = body.rssi;
      return json({
        matched: true,
        rssi: rssi ?? null,
        location,
        proximity:
          typeof rssi === "number"
            ? rssi > -60
              ? "near"
              : rssi > -80
                ? "mid"
                : "far"
            : "unknown",
      });
    }

    if (path === "ai/stt") return json(await speechToText(body));
    if (path === "ai/tts") {
      if (!body.text) return json({ error: "text is required" }, 400);
      return json(await textToSpeech(body));
    }
    if (path === "ai/guide") {
      const location = body.locationId ? getLocationById(body.locationId) : null;
      const result = await generateGuideReply({ ...body, location });
      const tts = await textToSpeech({ text: result.reply });
      return json({ ...result, tts });
    }
    if (path === "ai/welcome") {
      const gateway = getLocationById("gateway");
      const name = body.visitorName?.trim() || "honored guest";
      const language = body.language || "en";
      const text =
        language === "am"
          ? `ሰላም ${name}፣ ወደ አድዋ ሙዚየም እንኳን በደህና መጡ። ከአሁን ጀምሮ እመራዎታለሁ።`
          : `Hello ${name}, welcome to Adwa Museum. From now on, I will guide you through every hall.`;
      const tts = await textToSpeech({ text });
      return json({ text, tts, location: gateway });
    }
    if (path === "ai/refreshment-check") {
      const {
        visitMinutes = 0,
        voiceLevel = 0.5,
        currentLocationId,
        language = "en",
        force = false,
      } = body;
      const lowVoice = voiceLevel < 0.2;
      const longVisit = visitMinutes >= 8;
      const shouldSuggest = force || lowVoice || longVisit;
      if (!shouldSuggest) return json({ suggest: false });

      const near = coffeePlaces.find((c) => c.nearLocationId === currentLocationId);
      const place = near || coffeePlaces[0];
      const reasons: string[] = [];
      if (lowVoice) reasons.push("your voice sounds quieter — you may need rest");
      if (longVisit)
        reasons.push(`you have been exploring for about ${Math.round(visitMinutes)} minutes`);
      if (!reasons.length) reasons.push("a short pause will make the next halls richer");

      const message =
        language === "am"
          ? `እረፍት ይፈልጉ ይሆናል። ${place.nameAm} አቅራቢያ ነው — ${place.specialty}። ${place.distance}።`
          : `May I suggest a pause? ${reasons.join(", and ")}. ${place.name} is nearby (${place.distance}) — ${place.specialty}. ${place.reason}`;
      const tts = await textToSpeech({ text: message });
      return json({ suggest: true, reasons, place, message, tts });
    }
    if (path === "ai/summary") {
      const visitedLocations = (body.visitedLocationIds || [])
        .map((id: string) => getLocationById(id))
        .filter(Boolean);
      const blog = await generateVisitBlog({
        visitorName: body.visitorName,
        visitedLocations,
        language: body.language,
      });
      const tts = await textToSpeech({
        text: `${blog.title}. ${blog.body.slice(0, 280)}`,
      });
      return json({ blog, tts, visitedCount: visitedLocations.length });
    }
    if (path === "ai/research") return json(await researchEnrichment(body));

    if (path === "payments/telebirr") {
      if (!body.amountETB || !body.purpose) {
        return json({ error: "amountETB and purpose are required" }, 400);
      }
      return json({ payment: createPayment(body) }, 201);
    }

    const confirmMatch = path.match(/^payments\/([^/]+)\/confirm$/);
    if (confirmMatch) {
      const payment = confirmPayment(confirmMatch[1]);
      if (!payment) return json({ error: "Payment not found" }, 404);
      return json({ payment });
    }

    const callbackMatch = path.match(/^payments\/([^/]+)\/callback$/);
    if (callbackMatch) {
      const payment = simulateTelebirrCallback(
        callbackMatch[1],
        body.success !== false
      );
      if (!payment) return json({ error: "Payment not found" }, 404);
      return json({ payment });
    }

    if (path === "tips") {
      const payment = createPayment({
        amountETB: body.amountETB ?? 50,
        purpose: "tip",
        visitorId: body.visitorId,
        phone: body.phone,
        description: "Tip for Negarit AI guide service",
      });
      return json(
        { payment, message: "Thank you — your tip supports Negarit AI." },
        201
      );
    }

    return json({ error: "Not found", path }, 404);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return json({ error: message }, 500);
  }
}
