/**
 * Addis AI — Amharic-first chat + translation.
 * chat_generate target_language only supports `am` | `om`.
 */

const BASE = "https://api.addisassistant.com";

function apiKey() {
  return process.env.ADDIS_AI_API_KEY || "";
}

export async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
}: {
  text: string;
  sourceLanguage: "en" | "am" | "om";
  targetLanguage: "en" | "am" | "om";
}): Promise<{ translation: string; provider: string }> {
  if (!text.trim()) return { translation: text, provider: "noop" };
  if (sourceLanguage === targetLanguage) {
    return { translation: text, provider: "noop" };
  }

  const key = apiKey();
  if (!key) return { translation: text, provider: "missing-key" };

  const res = await fetch(`${BASE}/api/v1/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Addis AI translate failed: ${err}`);
  }

  const json = await res.json();
  const translation =
    json?.data?.translation ||
    json?.translation ||
    json?.translatedText ||
    json?.response_text ||
    text;

  return { translation: String(translation), provider: "addis-ai" };
}

function extractReply(json: Record<string, unknown>): string | null {
  const data = json?.data;
  const candidates = [
    json?.response_text,
    json?.text,
    json?.response,
    json?.message,
    json?.output,
    typeof data === "string" ? data : null,
    data && typeof data === "object"
      ? (data as Record<string, unknown>).text ||
        (data as Record<string, unknown>).response ||
        (data as Record<string, unknown>).response_text ||
        (data as Record<string, unknown>).content ||
        (data as Record<string, unknown>).message ||
        (data as Record<string, unknown>).output ||
        (data as Record<string, unknown>).generated_text
      : null,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length >= 2) return c.trim();
  }
  return null;
}

export async function generateMuseumGuide({
  visitorName,
  locationName,
  question,
  language,
  narrative,
  ragContext,
}: {
  visitorName?: string;
  locationName: string;
  question?: string;
  language: "en" | "am";
  narrative?: string;
  ragContext?: string;
}): Promise<{ reply: string; provider: string }> {
  const key = apiKey();
  const name = visitorName || "friend";

  if (!key) {
    return {
      provider: "fallback",
      reply:
        language === "am"
          ? `${name}\u1363 \u1260${locationName} \u1290\u12ce\u1275\u1362 ${narrative || ""}`
          : `${name}, you are in ${locationName}. ${narrative || "This hall holds Adwa's living memory."}`,
    };
  }

  const q = question || "Tell me about this place";
  const knowledge = (ragContext || "").slice(0, 4500);

  // Always generate Amharic with Addis (required language), then translate for English.
  const prompt = [
    "You are Negarit AI, the spoken visiting guide inside the Adwa Victory Memorial & Museum in Addis Ababa.",
    "Answer ONLY using the retrieved museum knowledge below. If the knowledge does not cover something, say you will guide them to the right exhibit — do not invent artifacts.",
    "Speak warmly, proudly, and briefly (3-6 spoken sentences). No markdown. No numbered lists.",
    `Visitor: ${name}.`,
    `Current hall/zone: ${locationName}.`,
    `Hall note: ${narrative || ""}.`,
    `Visitor question: ${q}.`,
    "Retrieved knowledge:",
    knowledge || "(no chunks — use only the hall note)",
    "Reply in natural Amharic suitable for spoken audio.",
  ].join("\n");

  const res = await fetch(`${BASE}/api/v1/chat_generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({
      prompt,
      target_language: "am",
      persona: "Negarit AI — Adwa Museum visiting guide",
      system:
        "You are a museum guide. Stay historically respectful. Prefer retrieved knowledge. Keep answers concise for spoken audio.",
      generation_config: { temperature: 0.55, maxOutputTokens: 420 },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Addis AI chat failed: ${err}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  let reply = extractReply(json);
  if (!reply) throw new Error("Empty Addis AI response");

  if (language === "en") {
    try {
      const translated = await translateText({
        text: reply,
        sourceLanguage: "am",
        targetLanguage: "en",
      });
      if (translated.translation?.trim() && translated.provider !== "missing-key") {
        reply = translated.translation.trim();
      } else if (narrative?.trim()) {
        // Prefer English hall narrative over leaving Amharic for EN visitors
        reply = `${name}, ${locationName}. ${narrative}`.slice(0, 700);
      }
    } catch {
      if (narrative?.trim()) {
        reply = `${name}, ${locationName}. ${narrative}`.slice(0, 700);
      }
    }
  }

  return { provider: "addis-ai", reply };
}
