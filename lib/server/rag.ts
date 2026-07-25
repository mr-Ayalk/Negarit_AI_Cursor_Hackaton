/**
 * Lightweight lexical RAG over the Adwa Museum knowledge base.
 * Chunks by headings, scores by keyword overlap + location boost.
 */

import fs from "fs";
import path from "path";

export type KnowledgeChunk = {
  id: string;
  title: string;
  code: string;
  text: string;
  tags: string[];
};

let cached: KnowledgeChunk[] | null = null;

const LOCATION_TAGS: Record<string, string[]> = {
  gateway: [
    "gate",
    "north",
    "south",
    "east",
    "west",
    "00km",
    "zero",
    "entrance",
    "plaza",
    "piasa",
    "memorial",
    "overview",
    "መግቢያ",
    "በር",
    "አድዋ",
  ],
  "5gna-ber": [
    "gate",
    "weapons",
    "artifact",
    "shield",
    "spear",
    "warrior",
    "cavalry",
    "dember",
    "women",
    "farmers",
    "ጦር",
    "ጋሻ",
    "ጦረኛ",
  ],
  "6gna-ber": [
    "courtyard",
    "columns",
    "flame",
    "commander",
    "alula",
    "balcha",
    "mengesha",
    "mikael",
    "ras",
    "አሉላ",
    "ባልቻ",
  ],
  "emperor-hall": [
    "taytu",
    "menelik",
    "fountain",
    "treaty",
    "wuchale",
    "emperor",
    "empress",
    "archives",
    "ታይቱ",
    "ምኒሊክ",
    "ውጫሌ",
    "ውሃ",
  ],
  "victory-court": [
    "negarit",
    "drum",
    "pan-african",
    "tsehay",
    "aircraft",
    "victory",
    "unity",
    "oau",
    "ነጋሪት",
    "ድል",
    "ጽሃይ",
  ],
};

function knowledgePaths() {
  return [
    path.join(process.cwd(), "data", "adwa-knowledge.md"),
    path.join(process.cwd(), "adwa_museum_ai_knowledge_expanded (2).md"),
  ];
}

function loadRawMarkdown(): string {
  for (const p of knowledgePaths()) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
    } catch {
      /* try next */
    }
  }
  return "";
}

/** Extra verified public facts (web-sourced) appended as chunks */
const WEB_ENRICHMENT = `
### WEB_OVERVIEW — Adwa 00KM Museum (public sources)
- Official name: Adwa 00KM Museum / Adwa Victory Memorial Museum (አድዋ 00 ሙዚየም).
- Location: Piasa (Piassa), Arada district, Addis Ababa — between Menelik's Monument and St. George's Cathedral.
- Inaugurated: 11 February 2024; opened to the public mid-March 2024.
- Architect: Eskender Wubetu. Complex includes multiple interconnected blocks and floors.
- Project: Adwa Zero KM / Adwa Victory Memorial — memorializes Ethiopia's March 1896 victory over Italian forces (Battle of Adwa, First Italo-Ethiopian War).
- Symbolism: four cardinal hero gates (North/South/East/West); Axum and Lalibela motifs in architecture; statues of Emperor Menelik II and Empress Taytu near the fountain plaza.
- Facilities reported publicly: conference/meeting halls, Pan-African gathering spaces, memorial courtyard, museum artifact halls, restaurants and civic amenities within the broader complex.
- Visitor context: tickets may be available on-site and via museum digital channels; always confirm current prices on site.
- Naming: "Adwa Victory Memorial" often refers to the outdoor complex; "Adwa Victory Museum" / "00KM Museum" to the indoor artifact center.

### WEB_BATTLE — Battle of Adwa facts
- Date: 1 March 1896 (Gregorian).
- Outcome: decisive Ethiopian victory preserving independence; major inspiration for Pan-African movements worldwide.
- Key figures visitors ask about: Emperor Menelik II, Empress Taytu Betul, Ras Alula Aba Nega, and regional commanders honored in the courtyard columns.
- Legal arc: Treaty of Wuchale (1889) Article 17 language dispute → war → Treaty of Addis Ababa (26 Oct 1896) recognizing Ethiopian sovereignty.
`;

function parseChunks(md: string): KnowledgeChunk[] {
  const full = `${md}\n\n${WEB_ENRICHMENT}`;
  const parts = full.split(/\n(?=###\s+)/);
  const chunks: KnowledgeChunk[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("###")) continue;
    const lines = trimmed.split("\n");
    const heading = lines[0].replace(/^###\s+/, "").trim();
    const codeMatch = heading.match(/`([^`]+)`/);
    const code = (codeMatch?.[1] || heading.split("—")[0] || heading)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const text = trimmed.slice(0, 2200);
    const tags = tokenize(`${heading} ${text}`);
    chunks.push({
      id: `chunk-${chunks.length}`,
      title: heading,
      code,
      text,
      tags,
    });
  }

  // Also keep a short overview chunk from section 2
  const overview = full.match(/## 2\.[\s\S]*?(?=## 3\.|$)/)?.[0];
  if (overview) {
    chunks.unshift({
      id: "chunk-overview",
      title: "General overview",
      code: "OVERVIEW",
      text: overview.slice(0, 1800),
      tags: tokenize(overview),
    });
  }

  return chunks;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[`*_#>\[\]().,;:!?'"/-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 || /[\u1200-\u137F]/.test(w));
}

export function getKnowledgeChunks(): KnowledgeChunk[] {
  if (cached) return cached;
  cached = parseChunks(loadRawMarkdown());
  return cached;
}

export function retrieveKnowledge({
  question,
  locationId,
  limit = 4,
}: {
  question?: string;
  locationId?: string | null;
  limit?: number;
}): { context: string; chunks: KnowledgeChunk[]; codes: string[] } {
  const chunks = getKnowledgeChunks();
  const qTokens = new Set(tokenize(`${question || ""} ${locationId || ""}`));
  const boostTags = new Set(LOCATION_TAGS[locationId || ""] || []);

  const scored = chunks.map((chunk) => {
    let score = 0;
    for (const t of chunk.tags) {
      if (qTokens.has(t)) score += 2;
      if (boostTags.has(t)) score += 1.2;
    }
    // Code / title direct hits
    const blob = `${chunk.code} ${chunk.title}`.toLowerCase();
    for (const t of qTokens) {
      if (blob.includes(t)) score += 3;
    }
    for (const t of boostTags) {
      if (blob.includes(t)) score += 2;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit);
  const picked = (top.length ? top : scored.slice(0, Math.min(2, scored.length))).map(
    (s) => s.chunk
  );

  const context = picked
    .map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.text}`)
    .join("\n\n---\n\n");

  return {
    context,
    chunks: picked,
    codes: picked.map((c) => c.code),
  };
}

export function hallArrivalQuestion(
  locationName: string,
  language: "en" | "am" = "en"
) {
  if (language === "am") {
    return `I just arrived at ${locationName}. Reply ONLY in Amharic as Negarit. Guide me with the most important things I can see and the story of this place in 4-6 short spoken sentences.`;
  }
  return `I just arrived at ${locationName}. As Negarit, welcome me and guide me with the most important things I can see and the story of this place. Keep it spoken-guide length (about 4-6 short sentences).`;
}
