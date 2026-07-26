"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuide } from "@/lib/guide-context";
import { MUSEUM_WIFI_ZONES } from "@/lib/wifi";
import { MuseumMap } from "@/components/MuseumMap";
import { TourAdInterrupt } from "@/components/TourAdInterrupt";
import { RefreshmentModal } from "@/components/RefreshmentModal";
import { TipSheet } from "@/components/TipSheet";
import { SiteHeader } from "@/components/SiteHeader";
import { WifiStatusCard } from "@/components/WifiStatusCard";
import { HallTransition } from "@/components/HallTransition";
import { CafeSpotlight } from "@/components/CafeSpotlight";

export default function GuidePage() {
  const router = useRouter();
  const g = useGuide();
  const [started, setStarted] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [ssidInput, setSsidInput] = useState("");

  const onWifiChange = useCallback(
    (ssid: string | null, prev: string | null) => {
      if (!ssid) return;
      if (ssid === prev) return;
      void g.joinWifiZone(ssid);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g.joinWifiZone]
  );

  useEffect(() => {
    if (!g.hydrated) return;
    if (!g.session.setupComplete) router.replace("/setup");
  }, [g.hydrated, g.session.setupComplete, router]);

  useEffect(() => {
    if (!g.hydrated) return;
    if (g.session.startedAt && g.session.currentLocationId) {
      setStarted(true);
      g.resumeTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.hydrated]);

  const lang = g.session.language;
  const loc = g.currentLocation;
  const nextHall = MUSEUM_WIFI_ZONES.find((z) => !g.session.visitedIds.includes(z.wifiId));

  return (
    <div style={{ paddingBottom: "5.75rem" }}>
      <SiteHeader />
      <HallTransition open={g.transitioning} label={g.transitionLabel} />

      <div className="wrap" style={{ paddingTop: "1.15rem", paddingBottom: "2rem" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.85rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Live guide</h1>
            <p className="muted small">
              {g.session.visitorName || "Guest"}
              {g.scanning ? " · WiFi zones on" : ""}
              {g.lastWifi ? ` · ${g.lastWifi.ssid}` : ""}
            </p>
          </div>
          <span className="pill">
            <span className="dot" />
            {g.speaking ? "Speaking" : g.listening ? "Listening" : `${g.progress}% visited`}
          </span>
        </div>

        <div className="progress-bar" style={{ marginBottom: "1rem" }}>
          <span style={{ width: `${g.progress}%` }} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <WifiStatusCard onSsidChange={started ? onWifiChange : undefined} />
        </div>

        {started && (
          <div style={{ marginBottom: "1rem" }}>
            <CafeSpotlight compact />
          </div>
        )}

        {g.listening && (
          <div className="listening-banner" style={{ marginBottom: "0.85rem" }}>
            Speak now — ElevenLabs is converting your voice to text…
          </div>
        )}

        {!started ? (
          <div className="guide-grid">
            <div className="panel stack hall-card">
              <div className={`orb ${g.speaking ? "speaking" : ""}`} style={{ margin: "0.25rem auto" }} />
              <h2 style={{ fontSize: "1.3rem", textAlign: "center" }}>
                {lang === "am" ? "Begin on museum WiFi" : "Begin on museum WiFi"}
              </h2>
              <p className="muted small" style={{ textAlign: "center" }}>
                Negarit maps Adwa’s WiFi zones, welcomes you at Gateway, then guides every hall with
                voice — powered by museum knowledge, Addis AI, and ElevenLabs.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={async () => {
                  setStarted(true);
                  await g.startTour();
                }}
              >
                Connect WiFi zones & start
              </button>
              <div className="row">
                <input
                  className="field"
                  style={{ flex: 1 }}
                  placeholder="SSID e.g. ADWA-Staff"
                  value={ssidInput}
                  onChange={(e) => setSsidInput(e.target.value)}
                />
                <button className="btn btn-ghost" onClick={() => g.joinWifiZone(ssidInput)}>
                  Join
                </button>
              </div>
            </div>
            <MuseumMap
              locations={g.locations}
              currentId={null}
              visitedIds={[]}
              signals={g.signals}
              onSelect={(id) => g.arriveAtHall(id)}
            />
          </div>
        ) : (
          <div className="guide-grid">
            <div className="stack">
              <MuseumMap
                locations={g.locations}
                currentId={g.session.currentLocationId}
                previousId={g.previousLocationId}
                visitedIds={g.session.visitedIds}
                signals={g.signals}
                animating={g.transitioning}
                onSelect={(id) => g.arriveAtHall(id)}
              />

              <div className="panel stack hall-card" key={loc?.id || "empty"}>
                <div className="row" style={{ justifyContent: "center" }}>
                  <div className={`orb ${g.speaking ? "speaking" : ""} ${g.listening ? "listening" : ""}`} />
                </div>
                {loc ? (
                  <>
                    <h2 style={{ fontSize: "1.35rem", textAlign: "center" }}>
                      {lang === "am" ? loc.nameAm : loc.name}
                    </h2>
                    <p className="muted" style={{ textAlign: "center" }}>
                      {lang === "am" ? loc.narrative.am : loc.narrative.en}
                    </p>
                    {loc.stories?.map((s) => (
                      <div key={s.id} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>{s.title}</p>
                        <p className="muted small">{s.body}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="muted small" style={{ textAlign: "center" }}>
                    Waiting for the next WiFi zone…
                  </p>
                )}

                <div className="row">
                  {nextHall && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => g.goNextHall()}>
                      Walk to {nextHall.label}
                    </button>
                  )}
                  {!nextHall && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push("/summary")}>
                      Write visit story
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="panel" style={{ maxHeight: 300, overflowY: "auto" }}>
                <p className="muted small" style={{ marginBottom: 8 }}>
                  Conversation (voice is primary)
                </p>
                {g.transcript.length === 0 && (
                  <p className="muted small">Tap Ask and speak — Negarit answers by voice.</p>
                )}
                {g.transcript.slice(-10).map((line, i) => (
                  <p
                    key={`${line.at}-${i}`}
                    className="small transcript-line"
                    style={{
                      marginBottom: 8,
                      color: line.role === "visitor" ? "var(--accent-soft)" : undefined,
                    }}
                  >
                    <span className="muted">{line.role}: </span>
                    {line.text}
                  </p>
                ))}
              </div>

              <div className="panel stack">
                <p className="muted small">WiFi zones on your path</p>
                <div className="row">
                  {MUSEUM_WIFI_ZONES.map((z) => {
                    const seen = g.session.visitedIds.includes(z.wifiId);
                    const here = g.session.currentLocationId === z.wifiId;
                    const sig = Math.round((g.signals[z.wifiId] || 0) * 100);
                    return (
                      <button
                        key={z.wifiId}
                        className="btn btn-ghost"
                        style={{
                          fontSize: "0.78rem",
                          padding: "0.5rem 0.7rem",
                          borderColor: here ? "var(--accent)" : undefined,
                          opacity: seen || here ? 1 : 0.75,
                          transform: here ? "scale(1.03)" : undefined,
                          transition: "transform 0.25s ease, border-color 0.25s ease",
                        }}
                        onClick={() => g.arriveAtHall(z.wifiId)}
                      >
                        {z.label}
                        {sig > 20 ? ` · ${sig}%` : ""}
                      </button>
                    );
                  })}
                </div>
                <button className="btn btn-ghost btn-block" onClick={() => g.checkRefreshmentNow()}>
                  Check if I need a coffee break
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="dock">
        <div className="dock-inner">
          <button
            className={g.listening ? "active ask-hot" : undefined}
            onClick={() => g.listenOnce()}
          >
            {g.listening ? "…" : "Ask"}
          </button>
          <button
            onClick={() =>
              g.askGuide(
                g.session.language === "am"
                  ? "Tell me a deeper Amharic story about this place using museum knowledge."
                  : "Tell me a deeper story about this place"
              )
            }
          >
            More
          </button>
          <button onClick={() => setTipOpen(true)}>Tip</button>
          <button onClick={() => void g.checkRefreshmentNow(true)}>Cafe</button>
          <button onClick={() => router.push("/summary")}>Story</button>
        </div>
      </nav>

      <TourAdInterrupt
        open={g.adOpen}
        mode={g.adMode}
        location={loc}
        ads={g.adItems}
        onClose={g.closeAd}
      />
      <RefreshmentModal
        open={g.refreshmentOpen}
        message={g.refreshmentMessage}
        place={g.refreshmentPlace}
        onClose={g.closeRefreshment}
      />
      <TipSheet open={tipOpen} onClose={() => setTipOpen(false)} />
    </div>
  );
}
