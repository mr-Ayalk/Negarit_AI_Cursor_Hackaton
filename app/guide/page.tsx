"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuide } from "@/lib/guide-context";
import { MUSEUM_BEACONS } from "@/lib/bluetooth";
import { MuseumMap } from "@/components/MuseumMap";
import { AdModal } from "@/components/AdModal";
import { RefreshmentModal } from "@/components/RefreshmentModal";
import { TipSheet } from "@/components/TipSheet";
import { SiteHeader } from "@/components/SiteHeader";

export default function GuidePage() {
  const router = useRouter();
  const g = useGuide();
  const [started, setStarted] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [forceAd, setForceAd] = useState(false);

  useEffect(() => {
    if (!g.session.setupComplete) router.replace("/setup");
  }, [g.session.setupComplete, router]);

  useEffect(() => {
    if (g.session.startedAt && g.session.currentLocationId) setStarted(true);
  }, [g.session.startedAt, g.session.currentLocationId]);

  const lang = g.session.language;
  const loc = g.currentLocation;
  const nextHall = MUSEUM_BEACONS.find(
    (b) => !g.session.visitedIds.includes(b.beaconId)
  );

  return (
    <div style={{ paddingBottom: "5.75rem" }}>
      <SiteHeader />

      <div className="wrap" style={{ paddingTop: "1.15rem", paddingBottom: "2rem" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.85rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Live guide</h1>
            <p className="muted small">
              {g.session.visitorName || "Guest"}
              {g.scanning ? " · beacon network on" : ""}
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

        {!started ? (
          <div className="guide-grid">
            <div className="panel stack">
              <div
                className={`orb ${g.speaking ? "speaking" : ""}`}
                style={{ margin: "0.25rem auto" }}
              />
              <h2 style={{ fontSize: "1.3rem", textAlign: "center" }}>
                {lang === "am" ? "ጉብኝት ይጀምሩ" : "Begin your walk"}
              </h2>
              <p className="muted small" style={{ textAlign: "center" }}>
                Negarit connects to the museum beacon network, welcomes you at the gateway, then
                guides each hall as you arrive.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={async () => {
                  setStarted(true);
                  await g.startTour();
                }}
              >
                Connect & start guiding
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => g.scanBluetoothDevice()}>
                Pair a nearby Bluetooth beacon
              </button>
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
                visitedIds={g.session.visitedIds}
                signals={g.signals}
                onSelect={(id) => g.arriveAtHall(id)}
              />

              <div className="panel stack">
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
                    Waiting for the next hall…
                  </p>
                )}

                <div className="row">
                  {nextHall && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => g.goNextHall()}>
                      Enter {nextHall.label}
                    </button>
                  )}
                  {!nextHall && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push("/summary")}>
                      Write visit story
                    </button>
                  )}
                  {loc?.ads?.length ? (
                    <button className="btn btn-ghost" onClick={() => setForceAd(true)}>
                      Shop
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="panel" style={{ maxHeight: 300, overflowY: "auto" }}>
                <p className="muted small" style={{ marginBottom: 8 }}>
                  Conversation
                </p>
                {g.transcript.length === 0 && (
                  <p className="muted small">Your guide will speak here.</p>
                )}
                {g.transcript.slice(-10).map((line, i) => (
                  <p
                    key={`${line.at}-${i}`}
                    className="small"
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
                <p className="muted small">Halls on your path</p>
                <div className="row">
                  {MUSEUM_BEACONS.map((b) => {
                    const seen = g.session.visitedIds.includes(b.beaconId);
                    const here = g.session.currentLocationId === b.beaconId;
                    const sig = Math.round((g.signals[b.beaconId] || 0) * 100);
                    return (
                      <button
                        key={b.beaconId}
                        className="btn btn-ghost"
                        style={{
                          fontSize: "0.78rem",
                          padding: "0.5rem 0.7rem",
                          borderColor: here ? "var(--accent)" : undefined,
                          opacity: seen || here ? 1 : 0.75,
                        }}
                        onClick={() => g.arriveAtHall(b.beaconId)}
                      >
                        {b.label}
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
          <button className={g.listening ? "active" : undefined} onClick={() => g.listenOnce()}>
            {g.listening ? "…" : "Ask"}
          </button>
          <button onClick={() => g.askGuide("Tell me a deeper story about this place")}>More</button>
          <button onClick={() => loc?.ads?.length && setForceAd(true)}>Shop</button>
          <button onClick={() => setTipOpen(true)}>Tip</button>
          <button onClick={() => router.push("/summary")}>Story</button>
        </div>
      </nav>

      <AdModal
        open={g.adOpen || forceAd}
        location={loc}
        onClose={() => {
          g.closeAd();
          setForceAd(false);
        }}
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
