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
import { MuseumBeaconNetwork, type BeaconHit, prepareBluetooth, pairNearbyBeacon } from "./bluetooth";
import { listenOnce as voiceListen, measureVoiceLevel, speak, stopSpeaking } from "./voice";
import { loadSession, saveSession, loadTranscript, saveTranscript } from "./session";

type GuideState = {
  session: VisitSession;
  locations: MuseumLocation[];
  currentLocation: MuseumLocation | null;
  transcript: { role: "guide" | "visitor" | "system"; text: string; at: number }[];
  speaking: boolean;
  listening: boolean;
  scanning: boolean;
  signals: Record<string, number>;
  adOpen: boolean;
  refreshmentOpen: boolean;
  refreshmentMessage: string;
  refreshmentPlace: CoffeePlace | null;
  lastBeacon: BeaconHit | null;
  loading: boolean;
  error: string | null;
  progress: number;
  setVisitorName: (name: string) => void;
  setLanguage: (lang: "en" | "am") => void;
  completeSetup: () => void;
  startTour: () => Promise<void>;
  arriveAtHall: (id: string) => Promise<void>;
  goNextHall: () => Promise<void>;
  askGuide: (question?: string) => Promise<void>;
  listenOnce: () => Promise<void>;
  scanBluetoothDevice: () => Promise<void>;
  closeAd: () => void;
  closeRefreshment: () => void;
  speakText: (text: string, log?: boolean) => Promise<void>;
  resetVisit: () => void;
  checkRefreshmentNow: (force?: boolean) => Promise<void>;
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
  const [signals, setSignals] = useState<Record<string, number>>({});
  const [adOpen, setAdOpen] = useState(false);
  const [refreshmentOpen, setRefreshmentOpen] = useState(false);
  const [refreshmentMessage, setRefreshmentMessage] = useState("");
  const [refreshmentPlace, setRefreshmentPlace] = useState<CoffeePlace | null>(null);
  const [lastBeacon, setLastBeacon] = useState<BeaconHit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const network = useRef(new MuseumBeaconNetwork());
  const handledBeacons = useRef(new Set<string>());
  const refreshmentShown = useRef(false);
  const busyHall = useRef(false);
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
      if (saved.visitedIds?.length) {
        saved.visitedIds.forEach((id) => handledBeacons.current.add(id));
      }
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
        await api.tts(text);
      } catch {
        /* server placeholder optional */
      }
      await speak(text, sessionRef.current.language);
      setSpeaking(false);
    },
    [pushLine]
  );

  const markVisited = useCallback((id: string) => {
    setSession((s) => ({
      ...s,
      visitedIds: s.visitedIds.includes(id) ? s.visitedIds : [...s.visitedIds, id],
      currentLocationId: id,
    }));
  }, []);

  const checkRefreshmentNow = useCallback(async (force = false) => {
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
  }, [speakText]);

  const enterHall = useCallback(
    async (beaconId: string, hit?: BeaconHit) => {
      if (busyHall.current) return;
      if (handledBeacons.current.has(beaconId) && sessionRef.current.currentLocationId === beaconId) {
        return;
      }
      busyHall.current = true;
      if (hit) setLastBeacon(hit);

      try {
        const { location } = await api.resolveBeacon(beaconId, hit?.rssi);
        const already = handledBeacons.current.has(location.id);
        handledBeacons.current.add(location.id);
        markVisited(location.id);

        if (!already) {
          if (location.welcome) {
            const welcome = await api.welcome(
              sessionRef.current.visitorName || "guest",
              sessionRef.current.language
            );
            await speakText(welcome.text);
          } else {
            const script =
              sessionRef.current.language === "am"
                ? location.guideScript.am
                : location.guideScript.en;
            await speakText(script);
          }

          if (location.ads?.length) {
            setTimeout(() => setAdOpen(true), 1800);
          }

          // After 3 halls, offer refreshment (voice level + time aware)
          if (handledBeacons.current.size >= 3) {
            setTimeout(() => {
              void checkRefreshmentNow(true);
            }, 3500);
          } else if (handledBeacons.current.size >= 2) {
            setTimeout(() => {
              void checkRefreshmentNow(false);
            }, 4000);
          }
        } else {
          const short =
            sessionRef.current.language === "am"
              ? `እንደገና በ${location.nameAm} ነዎት።`
              : `You are back at ${location.name}. Ask me anything about this hall.`;
          await speakText(short);
        }
      } catch (e) {
        pushLine("system", e instanceof Error ? e.message : "Could not resolve hall beacon");
      } finally {
        busyHall.current = false;
      }
    },
    [checkRefreshmentNow, markVisited, pushLine, speakText]
  );

  useEffect(() => {
    const unsub = network.current.subscribe((hit) => {
      void enterHall(hit.beaconId, hit);
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

  const startTour = useCallback(async () => {
    handledBeacons.current.clear();
    refreshmentShown.current = false;
    setTranscript([]);
    setAdOpen(false);
    setRefreshmentOpen(false);
    setRefreshmentPlace(null);
    setSession((s) => ({
      ...s,
      startedAt: new Date().toISOString(),
      visitedIds: [],
      currentLocationId: null,
      bluetoothReady: true,
    }));
    pushLine("system", "Beacon network connected. Approaching museum gateway…");
    setScanning(true);
    network.current.startNetwork();
    network.current.startAmbientPulse();
  }, [pushLine]);

  const arriveAtHall = useCallback(async (id: string) => {
    network.current.arriveAt(id);
    network.current.startAmbientPulse();
  }, []);

  const goNextHall = useCallback(async () => {
    network.current.goToNextHall();
    network.current.startAmbientPulse();
  }, []);

  const askGuide = useCallback(
    async (question?: string) => {
      const locId = sessionRef.current.currentLocationId;
      if (!locId) {
        pushLine("system", "Enter a hall first, then ask your question.");
        return;
      }
      const q = question || "Tell me more about this place";
      pushLine("visitor", q);
      try {
        const res = await api.guide({
          visitorName: sessionRef.current.visitorName,
          locationId: locId,
          question: q,
          language: sessionRef.current.language,
        });
        await speakText(res.reply);
      } catch (e) {
        pushLine("system", e instanceof Error ? e.message : "Guide failed");
      }
    },
    [pushLine, speakText]
  );

  const listenOnce = useCallback(async () => {
    setListening(true);
    try {
      const text = await voiceListen(sessionRef.current.language);
      pushLine("visitor", text);
      // Also notify server STT placeholder for pipeline completeness
      try {
        await api.stt(sessionRef.current.language);
      } catch {
        /* optional */
      }
      await askGuide(text);
    } catch (e) {
      // Fallback to server placeholder STT if browser STT fails
      try {
        const stt = await api.stt(sessionRef.current.language);
        pushLine("visitor", stt.text);
        await askGuide(stt.text);
      } catch {
        pushLine("system", e instanceof Error ? e.message : "Listening failed");
      }
    } finally {
      setListening(false);
    }
  }, [askGuide, pushLine]);

  const scanBluetoothDevice = useCallback(async () => {
    pushLine("system", "Scanning for a nearby museum beacon…");
    const hit = await pairNearbyBeacon();
    if (hit) {
      network.current.arriveAt(hit.beaconId);
      network.current.startAmbientPulse();
      setScanning(true);
    } else {
      pushLine("system", "No beacon selected. Use the path buttons to enter each hall.");
    }
  }, [pushLine]);

  const resetVisit = useCallback(() => {
    stopSpeaking();
    network.current.stop();
    handledBeacons.current.clear();
    refreshmentShown.current = false;
    setScanning(false);
    setSignals({});
    setTranscript([]);
    setAdOpen(false);
    setRefreshmentOpen(false);
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
    transcript,
    speaking,
    listening,
    scanning,
    signals,
    adOpen,
    refreshmentOpen,
    refreshmentMessage,
    refreshmentPlace,
    lastBeacon,
    loading,
    error,
    progress,
    setVisitorName: (name) => setSession((s) => ({ ...s, visitorName: name })),
    setLanguage: (language) => setSession((s) => ({ ...s, language })),
    completeSetup: () =>
      setSession((s) => ({ ...s, setupComplete: true, bluetoothReady: true })),
    startTour,
    arriveAtHall,
    goNextHall,
    askGuide,
    listenOnce,
    scanBluetoothDevice,
    closeAd: () => setAdOpen(false),
    closeRefreshment: () => setRefreshmentOpen(false),
    speakText,
    resetVisit,
    checkRefreshmentNow,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used within GuideProvider");
  return ctx;
}

export { prepareBluetooth };
