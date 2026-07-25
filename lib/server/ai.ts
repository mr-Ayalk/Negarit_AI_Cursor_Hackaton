import type { MuseumLocation } from "@/lib/api";
import { resolveLanguage } from "@/lib/lang";
import { generateMuseumGuide, translateText } from "./addis";
import { elevenLabsSTT, elevenLabsTTS, hasElevenLabsKey } from "./elevenlabs";
import { hallArrivalQuestion, retrieveKnowledge } from "./rag";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function speechToText({
  language = "en",
  audioBase64,
  mimeType,
}: {
  audioBase64?: string;
  mimeType?: string;
  language?: string;
}) {
  const lang = language === "am" ? "am" : "en";

  if (audioBase64 && hasElevenLabsKey()) {
    try {
      const stt = await elevenLabsSTT({
        audioBase64,
        mimeType: mimeType || "audio/webm",
        language: lang,
      });
      return {
        provider: stt.provider,
        text: stt.text,
        confidence: 0.95,
        language: lang,
      };
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "ElevenLabs STT failed");
    }
  }

  await sleep(80);
  return {
    provider: "browser-stt-needed",
    text: "",
    confidence: 0,
    language: lang,
    tip: "Send audioBase64 for ElevenLabs Scribe.",
  };
}

export async function textToSpeech({
  text,
  voice = "negarit-guide",
  language = "en",
}: {
  text: string;
  voice?: string;
  language?: "en" | "am";
}) {
  if (!text?.trim()) throw new Error("text is required");

  if (hasElevenLabsKey()) {
    try {
      const audio = await elevenLabsTTS({
        text,
        language: language === "am" ? "am" : "en",
      });
      return {
        provider: audio.provider,
        voice: audio.voiceId,
        text,
        audioBase64: audio.audioBase64,
        mimeType: audio.mimeType,
        durationMs: Math.min(20000, Math.max(1800, text.length * 55)),
      };
    } catch (e) {
      return {
        provider: "browser-tts-fallback",
        voice,
        text,
        audioBase64: null,
        mimeType: null,
        durationMs: Math.min(16000, Math.max(1800, text.length * 52)),
        error: e instanceof Error ? e.message : "ElevenLabs failed",
      };
    }
  }

  return {
    provider: "browser-tts",
    voice,
    text,
    audioBase64: null,
    mimeType: null,
    durationMs: Math.min(16000, Math.max(1800, text.length * 52)),
  };
}

export async function generateGuideReply({
  visitorName,
  location,
  question,
  language = "en",
}: {
  visitorName?: string;
  location?: MuseumLocation | null;
  question?: string;
  language?: string;
}) {
  // Amharic script in the question always forces Addis Amharic path
  const lang = resolveLanguage(language === "am" ? "am" : "en", question);
  const locName =
    lang === "am"
      ? location?.nameAm || location?.name || "this hall"
      : location?.name || "this hall";
  const narrative = lang === "am" ? location?.narrative?.am : location?.narrative?.en;
  const q =
    question?.trim() ||
    (location ? hallArrivalQuestion(locName, lang) : "Tell me about Adwa Museum");

  const rag = retrieveKnowledge({
    question: q,
    locationId: location?.id,
    limit: 4,
  });

  try {
    // Always Addis AI for guide replies (Amharic native; English via translate)
    const ai = await generateMuseumGuide({
      visitorName,
      locationName: locName,
      question: q,
      language: lang,
      narrative,
      ragContext: rag.context,
    });
    return {
      ...ai,
      language: lang,
      rag: { codes: rag.codes, sources: rag.chunks.map((c) => c.title) },
    };
  } catch {
    await sleep(150);
    const name = visitorName || "friend";
    const script =
      lang === "am"
        ? location?.guideScript?.am || location?.narrative?.am
        : location?.guideScript?.en || location?.narrative?.en;
    const snippet = rag.chunks[0]?.text
      ?.replace(/^###.*$/m, "")
      .replace(/\*\*/g, "")
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");

    if (lang === "am") {
      return {
        provider: "rag-fallback",
        language: lang,
        reply: script || `${name}, ${locName}. ${snippet || ""}`.trim(),
        rag: { codes: rag.codes, sources: rag.chunks.map((c) => c.title) },
      };
    }

    return {
      provider: "rag-fallback",
      language: lang,
      reply: `${name}, here in ${locName}: ${snippet || script || "Adwa's memory lives in this hall."}`,
      rag: { codes: rag.codes, sources: rag.chunks.map((c) => c.title) },
    };
  }
}

export async function translateGuideText({
  text,
  from,
  to,
}: {
  text: string;
  from: "en" | "am";
  to: "en" | "am";
}) {
  return translateText({
    text,
    sourceLanguage: from,
    targetLanguage: to,
  });
}

export async function researchEnrichment({ topic }: { topic?: string }) {
  const rag = retrieveKnowledge({ question: topic, limit: 3 });
  return {
    provider: "negarit-rag",
    topic,
    snippets: rag.chunks.map((c) => c.title),
    context: rag.context.slice(0, 1200),
  };
}

export async function generateVisitBlog({
  visitorName,
  visitedLocations,
  language = "en",
}: {
  visitorName?: string;
  visitedLocations: MuseumLocation[];
  language?: string;
}) {
  await sleep(150);
  const name = visitorName || "Traveler";
  const lang = language === "am" ? "am" : "en";
  const stops = visitedLocations.map((l) => (lang === "am" ? l.nameAm || l.name : l.name));
  const pathLabel = stops.join(" -> ");

  let title =
    lang === "am" ? `${name} at Adwa — Visit Chronicle` : `${name} at Adwa — A Day Written in Victory`;
  let body =
    lang === "am"
      ? `Today ${name} visited Adwa Museum. Path: ${pathLabel || "Gateway"}. Negarit guided the tour.`
      : `${name} walked Adwa Museum on WiFi zones: ${pathLabel || "Gateway"}. Negarit guided each hall — and Adwa's victory still speaks.`;

  const rag = retrieveKnowledge({
    question: `visit story ${pathLabel} Adwa memorial museum`,
    locationId: visitedLocations[visitedLocations.length - 1]?.id,
    limit: 3,
  });

  try {
    const narrative = visitedLocations
      .map((l) => (lang === "am" ? l.narrative.am : l.narrative.en))
      .join(" ");
    const ai = await generateMuseumGuide({
      visitorName: name,
      locationName: "Adwa Museum visit chronicle",
      question:
        lang === "am"
          ? `Write a short beautiful Amharic visit-day story for halls: ${pathLabel || "Gateway"}. End with why Adwa matters for Africa.`
          : `Write a beautiful short visit-day story covering these halls: ${pathLabel || "Gateway"}. End with one line about why Adwa still matters for Africa.`,
      language: lang,
      narrative,
      ragContext: rag.context,
    });
    if (ai.reply && ai.reply.length > 40) {
      body = ai.reply;
      title = `${name} at Adwa — Visit Chronicle`;
    }
  } catch {
    /* keep template */
  }

  // Ensure Amharic body when requested
  if (lang === "am" && !/[\u1200-\u137F]/.test(body)) {
    try {
      const t = await translateText({
        text: body,
        sourceLanguage: "en",
        targetLanguage: "am",
      });
      body = t.translation;
    } catch {
      /* keep */
    }
  }

  return {
    provider: "negarit-blog-rag",
    title,
    subtitle: lang === "am" ? "Negarit AI memory" : "Your Negarit AI visit chronicle",
    body,
    highlights: visitedLocations.map((l) => ({
      location: lang === "am" ? l.nameAm || l.name : l.name,
      line: (lang === "am" ? l.narrative.am : l.narrative.en).slice(0, 120) + "...",
    })),
  };
}
