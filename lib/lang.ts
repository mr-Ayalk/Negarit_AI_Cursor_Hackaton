/** Detect Ethiopic (Amharic) script in visitor text */
export function containsAmharic(text: string): boolean {
  return /[\u1200-\u137F]/.test(text || "");
}

/** Resolve reply language: session preference, overridden by Amharic input */
export function resolveLanguage(
  sessionLang: "en" | "am",
  question?: string
): "en" | "am" {
  if (containsAmharic(question || "")) return "am";
  return sessionLang === "am" ? "am" : "en";
}
