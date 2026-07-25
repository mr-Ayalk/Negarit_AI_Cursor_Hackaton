"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prepareBluetooth, useGuide } from "@/lib/guide-context";
import { isSpeechRecognitionSupported } from "@/lib/voice";

const STEPS = ["You", "Bluetooth", "Voice", "Ready"];

export default function SetupPage() {
  const router = useRouter();
  const { session, setVisitorName, setLanguage, completeSetup } = useGuide();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(session.visitorName || "");
  const [btMsg, setBtMsg] = useState("");
  const [btOk, setBtOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [micMsg, setMicMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const enableBt = async () => {
    setBusy(true);
    const res = await prepareBluetooth();
    setBtOk(res.ok);
    setBtMsg(res.message);
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
          ? "Microphone ready. You can ask Negarit by voice."
          : "Microphone ready. Voice replies work; use Chrome for best speech recognition."
      );
    } catch {
      setMicOk(false);
      setMicMsg("Microphone blocked. Enable it in browser settings to ask questions aloud.");
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
    (step === 1 && btOk) ||
    (step === 2 && micOk) ||
    step === 3;

  return (
    <div className="split">
      <aside className="split-media">
        <Image src="/negarit-drum.png" alt="" fill priority sizes="50vw" style={{ objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(22,15,12,0.9), transparent 55%)",
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
            Prepare once. Walk freely. The halls will find you.
          </p>
        </div>
      </aside>

      <div className="split-body">
        <Link href="/" className="muted small" style={{ marginBottom: 12 }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: "1.7rem" }}>Visitor setup</h1>
        <p className="muted small">Bluetooth + microphone so Negarit can guide you.</p>

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
            </>
          )}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.15rem" }}>Turn on Bluetooth</h2>
              <p className="muted small">
                Each hall broadcasts a beacon (5gna Ber, 6gna Ber, and more). Keep Bluetooth on while you walk.
              </p>
              <button className="btn btn-primary btn-block" disabled={busy} onClick={enableBt}>
                {btOk ? "Bluetooth ready" : "Enable Bluetooth"}
              </button>
              {btMsg && <p className="muted small">{btMsg}</p>}
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
                <li>Start at the gateway — Negarit welcomes you by name</li>
                <li>Enter each hall to hear its story</li>
                <li>Shop artifacts, tip the guide, end with your visit story</li>
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
