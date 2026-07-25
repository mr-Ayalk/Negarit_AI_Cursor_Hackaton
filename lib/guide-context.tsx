"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, type CoffeePlace, type MuseumLocation, type VisitSession } from "./api";
import { resolveLanguage } from "./lang";
import {
  MuseumWifiNetwork,
  prepareWifi,
  resolveSsid,
  type WifiHit,
} from "./wifi";
import { listenOnce as voiceListen, measureVoiceLevel, speak, stopSpeaking } from "./voice";
import { loadSession, saveSession, loadTranscript, saveTranscript } from "./session";

type GuideState = {
  session: VisitSession;
  locations: MuseumLocation[];
  currentLocation: MuseumLocation | null;
  previousLocationId: string | null;
  transcript: { role: "guide" | "visitor" | "system"; text: string; at: number }[];
  speaking: boolean;
  listening: boolean;
  scanning: boolean;
  transitioning: boolean;
  transitionLabel: string;
  signals: Record<string, number>;
  adOpen: boolean;
  refreshmentOpen: boolean;
  refreshmentMessage: string;
  refreshmentPlace: CoffeePlace | null;
  lastWifi: WifiHit | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  progress: number;
  setVisitorName: (name: string) => void;
  setLanguage: (lang: "en" | "am") => void;
  completeSetup: () => void;
  startTour: () => Promise<void>;
  resumeTour: () => void;
  arriveAtHall: (id: string) => Promise<void>;
  goNextHall: () => Promise<void>;
  askGuide: (question?: string) => Promise<void>;
  listenOnce: () => Promise<void>;
  joinWifiZone: (ssidOrId: string) => Promise<void>;
  closeAd: () => void;
  closeRefreshment: () => void;
  speakText: (text: string, log?: boolean) => Promise<void>;
  resetVisit: () => void;
  checkRefreshmentNow: (force?: boolean) => Promise<void>;
  translateText: (text: string, to: "en" | "am") => Promise<string>;
};

const defaultSession: VisitSession = {
  visitorName: "",
  language: "en",
  startedAt: "",
  visitedIds: [],
  currentLocationId: null,
  bluetoothReady: false,
  setupComplete: false,
};

const GuideContext = createContext<GuideState | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<VisitSession>(defaultSession);
  const [locations, setLocations] = useState<MuseumLocation[]>([]);
  const [transcript, setTranscript] = useState<GuideState["transcript"]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("");
  const [previousLocationId, setPreviousLocationId] = useState<string | null>(null);
  const [signals, setSignals] = useState<Record<string, number>>({});
  const [adOpen, setAdOpen] = useState(false);
  const [refreshmentOpen, setRefreshmentOpen] = useState(false);
  const [refreshmentMessage, setRefreshmentMessage] = useState("");
  const [refreshmentPlace, setRefreshmentPlace] = useState<CoffeePlace | null>(null);
  const [lastWifi, setLastWifi] = useState<WifiHit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const network = useRef(new MuseumWifiNetwork());
  const handledZones = useRef(new Set<string>());
  const refreshmentShown = useRef(false);
  const busyHall = useRef(false);
  const queuedHall = useRef<string | null>(null);
  const voiceBusy = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const currentLocation = useMemo(
    () => locations.find((l) => l.id === session.currentLocationId) || null,
    [locations, session.currentLocationId]
  );

  const progress = useMemo(() => {
    if (!locations.length) return 0;
    return Math.round((session.visitedIds.length / locations.length) * 100);
  }, [locations.length, session.visitedIds.length]);

  useEffect(() => {
    const saved = loadSession();
    const lines = loadTranscript();
    if (saved) {
      setSession((s) => ({ ...s, ...saved }));
      saved.visitedIds?.forEach((id) => handledZones.current.add(id));
    }
    if (lines.length) setTranscript(lines);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSession(session);
  }, [session, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveTranscript(transcript);
  }, [transcript, hydrated]);

  useEffect(() => {
    api
      .locations()
      .then((r) => setLocations(r.locations))
      .catch(() => setError("Could not load museum data. Refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const pushLine = useCallback((role: GuideState["transcript"][0]["role"], text: string) => {
    setTranscript((t) => [...t, { role, text, at: Date.now() }]);
  }, []);

  const speakText = useCallback(
    async (text: string, log = true) => {
      setSpeaking(true);
      if (log) pushLine("guide", text);
      try {
        await speak(text, sessionRef.current.language);
      } finally {
        setSpeaking(false);
      }
    },
    [pushLine]
  );

  const translateTextFn = useCallback(async (text: string, to: "en" | "am") => {
    const from = to === "am" ? "en" : "am";
    try {
      const res = await api.translate(text, from, to);
      return res.translation || text;
    } catch {
      return text;
    }
  }, []);

  const markVisited = useCallback((id: string) => {
    setSession((s) => ({
      ...s,
      visitedIds: s.visitedIds.includes(id) ? s.visitedIds : [...s.visitedIds, id],
      currentLocationId: id,
    }));
  }, []);

  const checkRefreshmentNow = useCallback(
    async (force = false) => {
      if (refreshmentShown.current || !sessionRef.current.startedAt) return;
      const minutes =
        (Date.now() - new Date(sessionRef.current.startedAt).getTime()) / 60000;
      const voiceLevel = await measureVoiceLevel(1600);
      try {
        const res = await api.refreshmentCheck({
          visitMinutes: minutes,
          voiceLevel,
          currentLocationId: sessionRef.current.currentLocationId,
          language: sessionRef.current.language,
          force,
        });
        if (res.suggest && res.message) {
          refreshmentShown.current = true;
          setRefreshmentMessage(res.message);
          setRefreshmentPlace(res.place || null);
          setRefreshmentOpen(true);
          await speakText(res.message);
        }
      } catch {
        /* ignore */
      }
    },
    [speakText]
  );

  const enterHall = useCallback(
    async (wifiId: string, hit?: WifiHit) => {
      if (!sessionRef.current.startedAt) return;

      if (busyHall.current) {
        queuedHall.current = wifiId;
        return;
      }
      if (handledZones.current.has(wifiId) && sessionRef.current.currentLocationId === wifiId) {
        return;
      }
      busyHall.current = true;
      if (hit) setLastWifi(hit);

      try {
        const { location } = await api.resolveBeacon(wifiId, hit?.rssi);
        const already = handledZones.current.has(location.id);
        setPreviousLocationId(sessionRef.current.currentLocationId);
        setTransitionLabel(`Walking to ${location.name}…`);
        setTransitioning(true);
        handledZones.current.add(location.id);
        markVisited(location.id);

        await new Promise((r) => setTimeout(r, 1100));
        setTransitioning(false);

        const lang = sessionRef.current.language;

        if (!already) {
          if (location.welcome) {
            const welcome = await api.welcome(
              sessionRef.current.visitorName || "guest",
              lang
            );
            await speakText(welcome.text);
          }

          try {
            const guided = await api.guide({
              visitorName: sessionRef.current.visitorName || "guest",
              locationId: location.id,
              question:
                lang === "am"
                  ? `I just arrived at ${location.nameAm || location.name}. Reply in Amharic as Negarit using museum knowledge.`
                  : `I just arrived at ${location.name}. Guide me as Negarit using the museum knowledge. Keep it spoken length.`,
              language: lang,
            });
            await speakText(guided.reply);
          } catch {
            const script = lang === "am" ? location.guideScript.am : location.guideScript.en;
            await speakText(script);
          }

          if (location.ads?.length) {
            setTimeout(() => setAdOpen(true), 1800);
          }

          if (handledZones.current.size >= 3) {
            setTimeout(() => void checkRefreshmentNow(true), 3500);
          } else if (handledZones.current.size >= 2) {
            setTimeout(() => void checkRefreshmentNow(false), 4000);
          }
        } else {
          await speakText(
            lang === "am"
              ? `You are back at ${location.nameAm}. Ask me anything.`
              : `You are back on the ${location.name} WiFi zone. Ask me anything by voice.`
          );
        }
      } catch (e) {
        setTransitioning(false);
        pushLine("system", e instanceof Error ? e.message : "Could not resolve WiFi zone");
      } finally {
        busyHall.current = false;
        const next = queuedHall.current;
        queuedHall.current = null;
        if (next && next !== sessionRef.current.currentLocationId) {
          void enterHall(next);
        }
      }
    },
    [checkRefreshmentNow, markVisited, pushLine, speakText]
  );

  useEffect(() => {
    const unsub = network.current.subscribe((hit) => {
      void enterHall(hit.wifiId, hit);
    });
    const pulse = setInterval(() => {
      if (network.current.isScanning()) {
        setSignals({ ...network.current.getAllSignals() });
      }
    }, 500);
    return () => {
      unsub();
      clearInterval(pulse);
      network.current.stop();
      stopSpeaking();
    };
  }, [enterHall]);

  const resumeTour = useCallback(() => {
    const loc = sessionRef.current.currentLocationId || "gateway";
    setScanning(true);
    network.current.resumeAt(loc);
    network.current.startAmbientPulse();
  }, []);

  const startTour = useCallback(async () => {
    handledZones.current.clear();
    refreshmentShown.current = false;
    queuedHall.current = null;
    setTranscript([]);
    setAdOpen(false);
    setRefreshmentOpen(false);
    setRefreshmentPlace(null);
    setPreviousLocationId(null);
    setSession((s) => ({
      ...s,
      startedAt: new Date().toISOString(),
      visitedIds: [],
      currentLocationId: null,
      bluetoothReady: true,
    }));
    pushLine("system", "Museum WiFi zones connected. Entering Gateway…");
    setScanning(true);

    let startId = "gateway";
    try {
      const live = await fetch("/api/wifi/current").then((r) => r.json());
      if (live?.ssid) {
        const hit = resolveSsid(String(live.ssid));
        if (hit) startId = hit.wifiId;
      }
    } catch {
      /* default gateway */
    }

    network.current.startNetwork(startId);
    network.current.startAmbientPulse();
  }, [pushLine]);

  const arriveAtHall = useCallback(async (id: string) => {
    if (!sessionRef.current.startedAt) return;
    network.current.arriveAt(id);
    network.current.startAmbientPulse();
  }, []);

  const goNextHall = useCallback(async () => {
    if (!sessionRef.current.startedAt) return;
    network.current.goToNextHall();
    network.current.startAmbientPulse();
  }, []);

  const askGuide = useCallback(
    async (question?: string) => {
      const locId = sessionRef.current.currentLocationId;
      if (!locId) {
        pushLine("system", "Enter a WiFi hall zone first, then ask.");
        return;
      }
      if (voiceBusy.current) return;
      voiceBusy.current = true;

      const q = question || "Tell me more about this place";
      // Ethiopic script → force Amharic + Addis AI
      const lang = resolveLanguage(sessionRef.current.language, q);
      if (lang === "am" && sessionRef.current.language !== "am") {
        setSession((s) => ({ ...s, language: "am" }));
      }

      setTranscript((t) => {
        const last = t[t.length - 1];
        if (last?.role === "visitor" && last.text === q) return t;
        return [...t, { role: "visitor", text: q, at: Date.now() }];
      });
      try {
        const res = await api.guide({
          visitorName: sessionRef.current.visitorName,
          locationId: locId,
          question: q,
          language: lang,
        });
        await speakText(res.reply);
      } catch (e) {
        pushLine("system", e instanceof Error ? e.message : "Guide failed");
      } finally {
        voiceBusy.current = false;
      }
    },
    [pushLine, speakText]
  );

  const listenOnce = useCallback(async () => {
    if (voiceBusy.current || listening) return;
    stopSpeaking();
    setListening(true);
    pushLine(
      "system",
      sessionRef.current.language === "am"
        ? "Listening… speak in Amharic (ElevenLabs + Addis AI)."
        : "Listening… speak now (ElevenLabs)."
    );
    try {
      const text = await voiceListen(sessionRef.current.language);
      setListening(false);
      pushLine("visitor", text);
      await askGuide(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Listening failed";
      pushLine("system", msg);
      try {
        await speakText(
          sessionRef.current.language === "am"
            ? "Sorry, I could not hear you. Tap Ask and try again."
            : "Sorry, I could not hear you. Tap Ask and try again.",
          false
        );
      } catch {
        /* ignore */
      }
    } finally {
      setListening(false);
    }
  }, [askGuide, listening, pushLine, speakText]);

  const joinWifiZone = useCallback(
    async (ssidOrId: string) => {
      const hit = resolveSsid(ssidOrId);
      if (hit) {
        pushLine("system", `Joined WiFi zone ${hit.ssid}`);
        if (!sessionRef.current.startedAt) {
          setSession((s) => ({
            ...s,
            startedAt: s.startedAt || new Date().toISOString(),
            bluetoothReady: true,
          }));
        }
        network.current.arriveAt(hit.wifiId);
        network.current.startAmbientPulse();
        setScanning(true);
        return;
      }
      pushLine("system", "Unknown SSID. Pick a hall on the map or use Adwa-* museum networks.");
    },
    [pushLine]
  );

  const resetVisit = useCallback(() => {
    stopSpeaking();
    network.current.stop();
    handledZones.current.clear();
    refreshmentShown.current = false;
    queuedHall.current = null;
    setScanning(false);
    setSignals({});
    setTranscript([]);
    setAdOpen(false);
    setRefreshmentOpen(false);
    setTransitioning(false);
    setPreviousLocationId(null);
    setSession((s) => ({
      ...s,
      startedAt: "",
      visitedIds: [],
      currentLocationId: null,
    }));
  }, []);

  const value: GuideState = {
    session,
    locations,
    currentLocation,
    previousLocationId,
    transcript,
    speaking,
    listening,
    scanning,
    transitioning,
    transitionLabel,
    signals,
    adOpen,
    refreshmentOpen,
    refreshmentMessage,
    refreshmentPlace,
    lastWifi,
    loading,
    hydrated,
    error,
    progress,
    setVisitorName: (name) => setSession((s) => ({ ...s, visitorName: name })),
    setLanguage: (language) => setSession((s) => ({ ...s, language })),
    completeSetup: () =>
      setSession((s) => ({ ...s, setupComplete: true, bluetoothReady: true })),
    startTour,
    resumeTour,
    arriveAtHall,
    goNextHall,
    askGuide,
    listenOnce,
    joinWifiZone,
    closeAd: () => setAdOpen(false),
    closeRefreshment: () => setRefreshmentOpen(false),
    speakText,
    resetVisit,
    checkRefreshmentNow,
    translateText: translateTextFn,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used within GuideProvider");
  return ctx;
}

export { prepareWifi as prepareBluetooth, prepareWifi };
