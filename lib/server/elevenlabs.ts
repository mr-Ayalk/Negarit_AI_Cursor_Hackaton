/**
 * ElevenLabs — Text-to-Speech + Speech-to-Text (server only).
 */

const BASE = "https://api.elevenlabs.io/v1";

function apiKey() {
  return process.env.ELEVENLABS_API_KEY || "";
}

function voiceId() {
  return process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
}

export function hasElevenLabsKey() {
  return Boolean(apiKey());
}

export async function elevenLabsTTS({
  text,
  language = "en",
}: {
  text: string;
  language?: "en" | "am";
}): Promise<{
  audioBase64: string;
  mimeType: string;
  provider: string;
  voiceId: string;
}> {
  const key = apiKey();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not configured");
  if (!text.trim()) throw new Error("text is required");

  const id = voiceId();
  const res = await fetch(`${BASE}/text-to-speech/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": key,
    },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: language === "am" ? 0.25 : 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    audioBase64: buffer.toString("base64"),
    mimeType: "audio/mpeg",
    provider: "elevenlabs",
    voiceId: id,
  };
}

/** Map app language → ElevenLabs Scribe ISO codes (Amharic = amh). */
function scribeLanguage(language: "en" | "am") {
  return language === "am" ? "amh" : "eng";
}

export async function elevenLabsSTT({
  audioBase64,
  mimeType = "audio/webm",
  language = "en",
}: {
  audioBase64: string;
  mimeType?: string;
  language?: "en" | "am";
}): Promise<{ text: string; provider: string; languageCode?: string }> {
  const key = apiKey();
  if (!key) throw new Error("ELEVENLABS_API_KEY is not configured");
  if (!audioBase64) throw new Error("audioBase64 is required");

  const bytes = Buffer.from(audioBase64, "base64");
  const ext = mimeType.includes("wav")
    ? "wav"
    : mimeType.includes("mp4") || mimeType.includes("m4a")
      ? "m4a"
      : mimeType.includes("mpeg") || mimeType.includes("mp3")
        ? "mp3"
        : "webm";

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: mimeType || "audio/webm" }),
    `speech.${ext}`
  );
  form.append("model_id", "scribe_v1");
  form.append("language_code", scribeLanguage(language));

  const res = await fetch(`${BASE}/speech-to-text`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs STT failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  const text = String(json?.text || json?.transcript || "").trim();
  if (!text) throw new Error("Empty transcription");

  return {
    text,
    provider: "elevenlabs-scribe",
    languageCode: json?.language_code,
  };
}
