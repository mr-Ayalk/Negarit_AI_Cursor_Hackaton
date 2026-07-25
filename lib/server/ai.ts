import type { MuseumLocation } from "@/lib/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function speechToText({
  language = "en",
}: {
  audioBase64?: string;
  language?: string;
}) {
  await sleep(250);
  return {
    provider: "browser-stt-fallback",
    text:
      language === "am"
        ? "ስለ አድዋ ጦርነት ተጨማሪ ንገረኝ"
        : "Tell me more about what happened here",
    confidence: 0.9,
    language,
    note: "Client prefers Web Speech API; swap to ElevenLabs / Addis AI when keys are set",
  };
}

export async function textToSpeech({
  text,
  voice = "negarit-guide",
}: {
  text: string;
  voice?: string;
}) {
  await sleep(120);
  return {
    provider: "browser-tts",
    voice,
    text,
    audioUrl: null,
    durationMs: Math.min(16000, Math.max(1800, text.length * 52)),
    note: "Client speaks via Speech Synthesis; swap to ElevenLabs streaming when ready",
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
  await sleep(450);
  const name = visitorName || "friend";
  const loc = location?.name || "this hall";
  const story = location?.stories?.[0];
  const q = (question || "").toLowerCase();

  if (language === "am") {
    return {
      provider: "addis-ai-placeholder",
      reply: `${name}፣ በ${location?.nameAm || loc} ውስጥ ነዎት። ${
        story
          ? `${story.title}፦ ${story.body}`
          : "ይህ ቦታ የአድዋ ድል ትውስታ ነው።"
      } ጥያቄዎን ስምቻለሁ — ተጨማሪ ታሪክ ይፈልጋሉ?`,
    };
  }

  let focus = location?.narrative?.en || `You are in ${loc}.`;
  if (q.includes("warrior") || q.includes("shield") || q.includes("battle")) {
    focus =
      story?.body ||
      "The warriors of Adwa carried courage like armor. Shields of hide and spears of iron closed ranks on highland roads.";
  } else if (q.includes("taytu") || q.includes("empress") || q.includes("women")) {
    focus =
      "Empress Taytu's resolve shaped strategy as surely as any spear. Women of Adwa fed columns, carried water, and kept the campaign alive.";
  } else if (q.includes("map") || q.includes("treaty") || q.includes("wuchale")) {
    focus =
      "The Treaty of Wuchale became a spark. Ethiopia refused foreign guardianship — and Adwa sealed that refusal in victory.";
  } else if (story) {
    focus = `${story.title}. ${story.body}`;
  }

  return {
    provider: "addis-ai-placeholder",
    reply: `${name}, here in ${loc}: ${focus} ${
      question ? `You asked about “${question.trim()}.” ` : ""
    }Look around slowly — every object nearby is a chapter. Ask me another question anytime.`,
  };
}

export async function researchEnrichment({ topic }: { topic?: string }) {
  await sleep(200);
  return {
    provider: "exa-firecrawl-placeholder",
    topic,
    snippets: [
      `Curated museum notes for “${topic}” would load from Adwa archives.`,
    ],
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
  await sleep(600);
  const name = visitorName || "Traveler";
  const stops = visitedLocations.map((l) => l.name);
  const path = stops.join(" → ");

  if (language === "am") {
    return {
      provider: "blog-placeholder",
      title: `${name} በአድዋ — የአንድ ቀን ጉብኝት`,
      subtitle: "የነጋሪት AI ትውስታ",
      body: `ዛሬ ${name} በአድዋ ሙዚየም ተጓዘ። መንገዱ፦ ${path || "መግቢያ"}። ነጋሪት ከበር ወደ በር መርቶ ታሪኩን በድምጽ አስረዳ። ድሉ አሁንም ይኖራል — በእርስዎ ትውስታ ውስጥ።`,
      highlights: visitedLocations.map((l) => ({
        location: l.nameAm || l.name,
        line: l.narrative.am.slice(0, 110) + "…",
      })),
    };
  }

  const paragraphs = [
    `${name} entered Adwa Museum as a visitor and left as a witness. The Negarit drum no longer summons armies — it summons memory.`,
    path
      ? `The path sounded like a drumline: ${path}. At each Bluetooth gate, the guide lifted its voice — quiet in the hush of halls, bright when courage demanded fire.`
      : "The gates waited. The guide stood ready.",
    visitedLocations
      .filter((l) => !l.welcome)
      .map((l) => `At ${l.name}, ${l.narrative.en.split(".")[0]}.`)
      .join(" "),
    "This is not a checklist of rooms. It is one river of story — Ethiopia's Adwa, still teaching that courage is collective. Today, that sound was Negarit.",
  ].filter(Boolean);

  return {
    provider: "blog-placeholder",
    title: `${name} at Adwa — A Day Written in Victory`,
    subtitle: "Your Negarit AI visit chronicle",
    body: paragraphs.join("\n\n"),
    highlights: visitedLocations.map((l) => ({
      location: l.name,
      line: l.narrative.en.slice(0, 120) + "…",
    })),
  };
}
