import type { VisitSession } from "./api";

const KEY = "negarit-session-v1";
const TRANSCRIPT_KEY = "negarit-transcript-v1";

export type SavedTranscript = { role: "guide" | "visitor" | "system"; text: string; at: number };

export function loadSession(): Partial<VisitSession> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<VisitSession>) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: VisitSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadTranscript(): SavedTranscript[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRANSCRIPT_KEY);
    return raw ? (JSON.parse(raw) as SavedTranscript[]) : [];
  } catch {
    return [];
  }
}

export function saveTranscript(lines: SavedTranscript[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(lines.slice(-40)));
  } catch {
    /* ignore */
  }
}

export function clearVisitStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(TRANSCRIPT_KEY);
}
