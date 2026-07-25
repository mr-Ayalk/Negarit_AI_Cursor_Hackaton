/**
 * Client voice pipeline:
 * STT → ElevenLabs Scribe (recorded audio) with Web Speech fallback (EN only)
 * TTS → ElevenLabs (via /api/ai/tts) with browser SpeechSynthesis fallback
 */

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

async function speakBrowser(text: string, language: "en" | "am"): Promise<void> {
  if (!window.speechSynthesis) {
    throw new Error("No speech engine available");
  }
  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === "am" ? "am-ET" : "en-US";
    u.rate = 0.94;
    u.pitch = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang.startsWith(language === "am" ? "am" : "en") &&
          /female|natural|google/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith(language === "am" ? "am" : "en"));
    if (preferred) u.voice = preferred;

    let done = false;
    const finish = (ok = true) => {
      if (done) return;
      done = true;
      if (ok) resolve();
      else reject(new Error("Browser TTS failed"));
    };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    window.speechSynthesis.speak(u);
    setTimeout(() => finish(true), Math.min(20000, Math.max(2500, text.length * 60)));
  });
}

async function speakElevenLabs(text: string, language: "en" | "am"): Promise<boolean> {
  const res = await fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, provider: "elevenlabs" }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (!data.audioBase64) return false;

  stopSpeaking();
  const mime = data.mimeType || "audio/mpeg";
  const url = `data:${mime};base64,${data.audioBase64}`;
  const audio = new Audio(url);
  currentAudio = audio;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    void audio.play().catch(reject);
  });
  return true;
}

/** Speak with ElevenLabs voice (primary). */
export async function speak(text: string, language: "en" | "am" = "en"): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;
  try {
    const ok = await speakElevenLabs(text, language);
    if (ok) return;
  } catch {
    /* fall through */
  }
  if (language === "am") {
    throw new Error("ElevenLabs voice is required for Amharic. Check your connection and try again.");
  }
  await speakBrowser(text, language);
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "audio/webm";
}

/** Record a short utterance from the mic for ElevenLabs STT */
export async function recordUtterance(ms = 6000): Promise<{
  audioBase64: string;
  mimeType: string;
}> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone is not available on this device.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const mimeType = pickMime();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error("Recording failed"));
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try {
        const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        resolve({
          audioBase64: btoa(binary),
          mimeType: mimeType.split(";")[0],
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Could not encode audio"));
      }
    };

    try {
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, ms);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error("Could not start microphone recording."));
    }
  });
}

export async function transcribeWithElevenLabs(
  language: "en" | "am" = "en"
): Promise<string> {
  const { audioBase64, mimeType } = await recordUtterance(language === "am" ? 7000 : 5500);
  const res = await fetch("/api/ai/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, language }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Voice transcription failed");
  }
  if (!data.text?.trim()) {
    throw new Error(data.error || "I could not hear that. Tap Ask and try again.");
  }
  return String(data.text).trim();
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRec | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor() as SpeechRec;
}

export function isSpeechRecognitionSupported() {
  return !!getRecognition() || Boolean(navigator.mediaDevices?.getUserMedia);
}

function listenBrowser(language: "en" | "am" = "en"): Promise<string> {
  const rec = getRecognition();
  if (!rec) {
    return Promise.reject(new Error("Speech recognition is not supported. Try Chrome."));
  }

  return new Promise((resolve, reject) => {
    rec.lang = language === "am" ? "am-ET" : "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript?.trim();
      settle(() => (text ? resolve(text) : reject(new Error("Could not hear that. Try again."))));
    };
    rec.onerror = (ev) => {
      settle(() =>
        reject(
          new Error(
            ev.error === "not-allowed"
              ? "Microphone permission denied."
              : `Listen error: ${ev.error}`
          )
        )
      );
    };
    rec.onend = () => {
      settle(() => reject(new Error("No speech detected. Tap Ask and speak clearly.")));
    };

    try {
      rec.start();
    } catch {
      settle(() => reject(new Error("Could not start microphone listening.")));
    }

    setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }, 8000);
  });
}

/** Prefer ElevenLabs STT. For Amharic, do not silently fall back after a failed recording. */
export async function listenOnce(language: "en" | "am" = "en"): Promise<string> {
  stopSpeaking();
  try {
    return await transcribeWithElevenLabs(language);
  } catch (e) {
    if (language === "am") throw e;
    return listenBrowser(language);
  }
}

export async function measureVoiceLevel(ms = 1800): Promise<number> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return 0.5;
  }

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const samples: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        samples.push(Math.sqrt(sum / data.length));
        if (performance.now() - start < ms) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });

    await ctx.close();
    const avg = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
    return Math.min(1, Math.max(0, avg * 8));
  } catch {
    return 0.5;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}
