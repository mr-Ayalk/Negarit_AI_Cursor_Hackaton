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
  initializeChapaPayment,
  verifyChapaPayment,
  getPayment,
  getPaymentByTxRef,
  hasChapaKey,
} from "@/lib/server/chapa";

type Ctx = { params: Promise<{ path?: string[] }> };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
  const path = ((await ctx.params).path || []).join("/");

  if (path === "health" || path === "") {
    return json({ ok: true, service: "negarit-ai", time: new Date().toISOString() });
  }
  if (path === "wifi/current") {
    const { detectDeviceWifi } = await import("@/lib/server/wifi-detect");
    const info = await detectDeviceWifi();
    return json({ ...info, time: new Date().toISOString() });
  }
  if (path === "ai/status") {
    const { hasElevenLabsKey } = await import("@/lib/server/elevenlabs");
    const { getKnowledgeChunks } = await import("@/lib/server/rag");
    return json({
      addisAi: Boolean(process.env.ADDIS_AI_API_KEY),
      elevenLabs: hasElevenLabsKey(),
      chapa: hasChapaKey(),
      wifiDetect: true,
      ragChunks: getKnowledgeChunks().length,
    });
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
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return json({ error: message }, 500);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const path = ((await ctx.params).path || []).join("/");
  const body = await req.json().catch(() => ({}));

  try {
    if (path === "beacon/resolve" || path === "wifi/resolve") {
      const location = getLocationByBeacon(
        body.wifiId || body.ssid || body.beaconId || body.beaconName
      );
      if (!location) {
        return json(
          {
            error: "Unknown WiFi zone",
            tip: "Use: gateway, 5gna-ber, 6gna-ber, emperor-hall, victory-court (or SSIDs Adwa-*)",
          },
          404
        );
      }
      const rssi = body.rssi;
      return json({
        matched: true,
        kind: "wifi-zone",
        ssid: location.beaconName?.replace("Negarit-", "Adwa-") || location.id,
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

    if (path === "ai/translate") {
      const { translateGuideText } = await import("@/lib/server/ai");
      if (!body.text) return json({ error: "text is required" }, 400);
      const from = body.from === "am" ? "am" : "en";
      const to = body.to === "am" ? "am" : "en";
      const result = await translateGuideText({ text: body.text, from, to });
      return json(result);
    }

    if (path === "ai/stt") {
      const result = await speechToText(body);
      if (!result.text) {
        return json(
          { error: result.tip || "Speech-to-text failed", ...result },
          result.provider === "browser-stt-needed" ? 400 : 502
        );
      }
      return json(result);
    }
    if (path === "ai/tts") {
      if (!body.text) return json({ error: "text is required" }, 400);
      return json(
        await textToSpeech({
          text: body.text,
          voice: body.voice,
          language: body.language === "am" ? "am" : "en",
        })
      );
    }
    if (path === "ai/status") {
      const { hasElevenLabsKey } = await import("@/lib/server/elevenlabs");
      const { getKnowledgeChunks } = await import("@/lib/server/rag");
      return json({
        addisAi: Boolean(process.env.ADDIS_AI_API_KEY),
        elevenLabs: hasElevenLabsKey(),
        chapa: hasChapaKey(),
        wifiDetect: true,
        ragChunks: getKnowledgeChunks().length,
      });
    }
    if (path === "ai/guide") {
      const location = body.locationId ? getLocationById(body.locationId) : null;
      const language = body.language === "am" ? "am" : "en";
      // Addis AI + RAG; client plays ElevenLabs TTS (avoid double generation)
      const result = await generateGuideReply({ ...body, location, language });
      return json({
        ...result,
        tts: { provider: "client-elevenlabs", durationMs: 0, text: result.reply },
      });
    }
    if (path === "ai/welcome") {
      const gateway = getLocationById("gateway");
      const name = body.visitorName?.trim() || "honored guest";
      const language = body.language === "am" ? "am" : "en";
      let text = `Hello ${name}, welcome to Adwa Museum. From now on, I will guide you through every hall.`;
      if (language === "am") {
        try {
          const { translateGuideText } = await import("@/lib/server/ai");
          const t = await translateGuideText({
            text,
            from: "en",
            to: "am",
          });
          if (t.translation?.trim()) text = t.translation.trim();
        } catch {
          text = `Selam ${name}. Welcome to Adwa Museum.`;
        }
      }
      return json({
        text,
        tts: { provider: "client-elevenlabs", durationMs: 0, text },
        location: gateway,
      });
    }
    if (path === "ai/refreshment-check") {
      const {
        visitMinutes = 0,
        voiceLevel = 0.5,
        currentLocationId,
        language: langRaw = "en",
        force = false,
      } = body;
      const language = langRaw === "am" ? "am" : "en";
      const lowVoice = voiceLevel < 0.2;
      const longVisit = visitMinutes >= 8;
      const shouldSuggest = force || lowVoice || longVisit;
      if (!shouldSuggest) return json({ suggest: false });

      const near = coffeePlaces.find((c) => c.nearLocationId === currentLocationId);
      const featured = coffeePlaces.find((c) => c.featured);
      const place = near || featured || coffeePlaces[0];
      const reasons: string[] = [];
      if (lowVoice) reasons.push("your voice sounds quieter — you may need rest");
      if (longVisit)
        reasons.push(`you have been exploring for about ${Math.round(visitMinutes)} minutes`);
      if (!reasons.length) reasons.push("a short pause will make the next halls richer");

      const areaLabel =
        language === "am" ? place.areaAm || place.area || "" : place.area || "";
      const message =
        language === "am"
          ? `እረፍት ይፈልጉ ይሆናል። ${place.nameAm}${areaLabel ? ` · ${areaLabel}` : ""} — ${place.specialty}። ${place.distance}።`
          : `May I suggest a pause? ${reasons.join(", and ")}. ${place.name}${areaLabel ? ` · ${areaLabel}` : ""} (${place.distance}) — ${place.specialty}. ${place.reason}`;
      return json({
        suggest: true,
        reasons,
        place,
        message,
        tts: { provider: "client-elevenlabs", durationMs: 0, text: message },
      });
    }
    if (path === "ai/summary") {
      const language = body.language === "am" ? "am" : "en";
      const visitedLocations = (body.visitedLocationIds || [])
        .map((id: string) => getLocationById(id))
        .filter(Boolean);
      const blog = await generateVisitBlog({
        visitorName: body.visitorName,
        visitedLocations,
        language,
      });
      return json({
        blog,
        tts: {
          provider: "client-elevenlabs",
          durationMs: 0,
          text: `${blog.title}. ${blog.body.slice(0, 280)}`,
        },
        visitedCount: visitedLocations.length,
      });
    }
    if (path === "ai/research") return json(await researchEnrichment(body));

    if (path === "payments/chapa" || path === "payments/telebirr") {
      if (!body.amountETB || !body.purpose) {
        return json({ error: "amountETB and purpose are required" }, 400);
      }
      const payment = await initializeChapaPayment({
        amountETB: Number(body.amountETB),
        purpose: String(body.purpose),
        productId: body.productId,
        visitorId: body.visitorId,
        phone: body.phone,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        description: body.description,
      });
      return json({ payment }, 201);
    }

    if (path === "payments/chapa/verify") {
      const txRef = body.tx_ref || body.trx_ref || body.txRef;
      if (!txRef) return json({ error: "tx_ref is required" }, 400);
      const payment = await verifyChapaPayment(String(txRef));
      return json({ payment });
    }

    const confirmMatch = path.match(/^payments\/([^/]+)\/confirm$/);
    if (confirmMatch) {
      // Backward compat: verify by stored id → txRef
      const existing = getPayment(confirmMatch[1]) || getPaymentByTxRef(confirmMatch[1]);
      if (!existing) return json({ error: "Payment not found" }, 404);
      const payment = await verifyChapaPayment(existing.txRef);
      return json({ payment });
    }

    if (path === "tips") {
      const payment = await initializeChapaPayment({
        amountETB: body.amountETB ?? 50,
        purpose: "tip",
        visitorId: body.visitorId,
        phone: body.phone,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        description: "Tip for Negarit AI guide service",
      });
      return json(
        { payment, message: "Opening Chapa checkout for your tip." },
        201
      );
    }

    return json({ error: "Not found", path }, 404);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return json({ error: message }, 500);
  }
}
