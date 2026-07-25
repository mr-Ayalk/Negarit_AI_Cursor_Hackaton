"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prepareWifi, useGuide } from "@/lib/guide-context";
import { isSpeechRecognitionSupported } from "@/lib/voice";
import { useTheme } from "@/lib/theme";
import { WifiStatusCard } from "@/components/WifiStatusCard";

const STEPS = ["You", "WiFi", "Voice", "Ready"];

export default function SetupPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { session, setVisitorName, setLanguage, completeSetup, hydrated } = useGuide();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(session.visitorName || "");
  const [wifiMsg, setWifiMsg] = useState("");
  const [wifiOk, setWifiOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [micMsg, setMicMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && session.visitorName && !name) {
      setName(session.visitorName);
    }
  }, [hydrated, session.visitorName, name]);

  const enableWifi = async () => {
    setBusy(true);
    const res = await prepareWifi();
    setWifiOk(res.ok);
    setWifiMsg(res.message);
    setBusy(false);
  };

  const enableMic = async () => {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicOk(true);
      setMicMsg(
        isSpeechRecognitionSupported()
          ? "Microphone ready. ElevenLabs hears you; Addis AI answers Amharic questions."
          : "Microphone ready. Use Chrome for best voice support."
      );
    } catch {
      setMicOk(false);
      setMicMsg("Microphone blocked. Enable it in browser settings.");
    }
    setBusy(false);
  };

  const finish = () => {
    setVisitorName(name.trim() || "Guest");
    completeSetup();
    router.push("/guide");
  };

  const canNext =
    (step === 0 && name.trim().length > 1) ||
    (step === 1 && wifiOk) ||
    (step === 2 && micOk) ||
    step === 3;

  return (
    <div className="split">
      <aside className="split-media">
        <Image src="/negarit-drum.png" alt="" fill priority sizes="50vw" style={{ objectFit: "cover" }} />
        <div
          className="hero-scrim"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "1.25rem",
          }}
        >
          <div className="brand">
            <Image src="/negarit-drum.png" alt="" width={40} height={40} style={{ borderRadius: "50%" }} />
            Negarit AI
          </div>
          <p style={{ marginTop: 10, fontFamily: "var(--font-d)", fontSize: "1.35rem", maxWidth: 280 }}>
            Connect to museum WiFi. Walk the halls. Hear Adwa speak.
          </p>
        </div>
      </aside>

      <div className="split-body">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Link href="/" className="muted small">
            ← Home
          </Link>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
        <h1 style={{ fontSize: "1.7rem" }}>Visitor setup</h1>
        <p className="muted small">Museum WiFi + microphone so Negarit can guide you.</p>

        <div className="steps">
          {STEPS.map((_, i) => (
            <i key={STEPS[i]} className={i <= step ? "on" : undefined} />
          ))}
        </div>

        <div className="panel stack" style={{ marginBottom: 16 }}>
          {step === 0 && (
            <>
              <h2 style={{ fontSize: "1.15rem" }}>What should I call you?</h2>
              <input className="field" placeholder="Your name" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
              <div className="row">
                {(["en", "am"] as const).map((lang) => (
                  <button
                    key={lang}
                    className="btn btn-ghost"
                    style={{ flex: 1, borderColor: session.language === lang ? "var(--accent)" : undefined }}
                    onClick={() => setLanguage(lang)}
                  >
                    {lang === "en" ? "English" : "አማርኛ"}
                  </button>
                ))}
              </div>
              <p className="muted small">
                Amharic conversations use <strong>Addis AI</strong>. Voice in/out uses{" "}
                <strong>ElevenLabs</strong>.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.15rem" }}>Connect to museum WiFi</h2>
              <p className="muted small">
                Negarit reads the WiFi name this device is on. Switch networks and the name updates live.
              </p>
              <WifiStatusCard />
              <button className="btn btn-primary btn-block" disabled={busy} onClick={enableWifi}>
                {wifiOk ? "WiFi check passed" : "Confirm WiFi ready"}
              </button>
              {wifiMsg && <p className="muted small">{wifiMsg}</p>}
            </>
          )}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.15rem" }}>Allow microphone</h2>
              <p className="muted small">
                Speak questions. Negarit listens (voice → text) and answers aloud (text → voice).
              </p>
              <button className="btn btn-primary btn-block" disabled={busy} onClick={enableMic}>
                {micOk ? "Microphone ready" : "Allow microphone"}
              </button>
              {micMsg && <p className="muted small">{micMsg}</p>}
            </>
          )}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: "1.15rem" }}>Ready, {name.trim()}</h2>
              <ul className="muted small stack" style={{ paddingLeft: "1.1rem" }}>
                <li>Start on Gateway WiFi — Negarit welcomes you by name</li>
                <li>Move hall to hall; each WiFi zone unlocks its story</li>
                <li>Ask in English or Amharic · shop & tip with Chapa</li>
              </ul>
            </>
          )}
        </div>

        <div className="row">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={finish}>
              Open guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
