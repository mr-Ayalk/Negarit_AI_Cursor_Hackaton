/**
 * Real browser voice pipeline for Negarit AI.
 * STT: Web Speech Recognition (voice → text)
 * TTS: Speech Synthesis (text → voice)
 * Level: AnalyserNode for refreshment heuristics
 * AI API placeholders remain on the server for future ElevenLabs / Addis AI swap.
 */

export function speak(text: string, language: "en" | "am" = "en"): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === "am" ? "am-ET" : "en-US";
    u.rate = 0.94;
    u.pitch = 1.02;
    u.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith(language === "am" ? "am" : "en") && /female|natural|google/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith(language === "am" ? "am" : "en"));
    if (preferred) u.voice = preferred;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.speak(u);
    setTimeout(finish, Math.min(20000, Math.max(2500, text.length * 60)));
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
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
  return !!getRecognition();
}

export function listenOnce(language: "en" | "am" = "en"): Promise<string> {
  const rec = getRecognition();
  if (!rec) {
    return Promise.reject(new Error("Speech recognition is not supported in this browser. Try Chrome."));
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
      settle(() => reject(new Error(ev.error === "not-allowed" ? "Microphone permission denied." : `Listen error: ${ev.error}`)));
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
    // Map RMS ~0.01–0.15 into 0–1 comfort scale
    return Math.min(1, Math.max(0, avg * 8));
  } catch {
    return 0.5;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}
