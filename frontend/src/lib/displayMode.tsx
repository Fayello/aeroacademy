"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchApi } from "@/lib/api";

export type DisplayMode = "PROFESSIONAL" | "PROGRESSION" | "COMPETITIVE";

export interface ModeConfig {
  showXp: boolean;
  showLevels: boolean;
  showRanks: boolean;
  showBadges: boolean;
  showStreaks: boolean;
  showMissions: boolean;
  showLeaderboard: boolean;
  showCompete: boolean;
  showBattlePass: boolean;
  showBossMissions: boolean;
  showSeasons: boolean;
  showGenome: boolean;
  showMastery: boolean;
  showCertifications: boolean;
  showCompetency: boolean;
}

const DEFAULT_CONFIG: ModeConfig = {
  showXp: true,
  showLevels: true,
  showRanks: false,
  showBadges: true,
  showStreaks: true,
  showMissions: true,
  showLeaderboard: false,
  showCompete: false,
  showBattlePass: true,
  showBossMissions: false,
  showSeasons: false,
  showGenome: true,
  showMastery: true,
  showCertifications: true,
  showCompetency: true,
};

interface DisplayModeContextValue {
  mode: DisplayMode;
  config: ModeConfig;
  setMode: (mode: DisplayMode) => Promise<void>;
  loading: boolean;
}

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

function readStoredMode(): DisplayMode {
  if (typeof window === "undefined") return "PROGRESSION";
  try {
    const stored = localStorage.getItem("displayMode");
    if (stored === "PROFESSIONAL" || stored === "COMPETITIVE" || stored === "PROGRESSION") {
      return stored;
    }
  } catch {}
  return "PROGRESSION";
}

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DisplayMode>(readStoredMode);
  const [config, setConfig] = useState<ModeConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchApi<{ mode: DisplayMode; config: ModeConfig }>("/display-mode");
        if (!cancelled) {
          setModeState(result.mode);
          setConfig(result.config);
          localStorage.setItem("displayMode", result.mode);
        }
      } catch {
        // use stored/default
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback(async (newMode: DisplayMode) => {
    try {
      const result = await fetchApi<{ mode: DisplayMode; config: ModeConfig }>("/display-mode", {
        method: "PATCH",
        body: JSON.stringify({ mode: newMode }),
      });
      setModeState(result.mode);
      setConfig(result.config);
      localStorage.setItem("displayMode", result.mode);
    } catch (err) {
      console.error("Failed to set display mode:", err);
    }
  }, []);

  const value = useMemo(() => ({ mode, config, setMode, loading }), [mode, config, setMode, loading]);

  return (
    <DisplayModeContext.Provider value={value}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode(): DisplayModeContextValue {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) throw new Error("useDisplayMode must be used within a DisplayModeProvider");
  return ctx;
}
