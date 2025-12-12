"use client";

import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemeName } from "@/lib/theme-presets";

const STORAGE_KEY = "deni-theme-preset";
const CUSTOM_CLASSES: ThemeName[] = ["t3-chat", "tangerine", "mono"];

type ThemePresetContextValue = {
  preset: ThemeName;
  setPreset: (value: ThemeName) => void;
};

const ThemePresetContext = createContext<ThemePresetContextValue | null>(null);

function isThemeName(value: string): value is ThemeName {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system" ||
    value === "t3-chat" ||
    value === "tangerine" ||
    value === "mono"
  );
}

function applyPresetClass(value: ThemeName) {
  if (typeof document === "undefined") return;
  const body = document.body;
  for (const cls of CUSTOM_CLASSES) {
    body.classList.remove(cls);
  }
  if (CUSTOM_CLASSES.includes(value)) {
    body.classList.add(value);
  }
}

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [preset, setPresetState] = useState<ThemeName>("system");

  const applyAndPersist = useCallback((value: ThemeName) => {
    setPresetState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value);
    }
    applyPresetClass(value);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      if (isThemeName(stored)) {
        applyAndPersist(stored);
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
    }
    if (theme && isThemeName(theme)) {
      setPresetState(theme);
      applyPresetClass(theme);
    }
  }, [applyAndPersist, theme]);

  const value = useMemo(
    () => ({
      preset,
      setPreset: applyAndPersist,
    }),
    [applyAndPersist, preset],
  );

  return (
    <ThemePresetContext.Provider value={value}>
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset() {
  const value = useContext(ThemePresetContext);
  if (!value) {
    throw new Error("useThemePreset must be used within ThemePresetProvider");
  }
  return value;
}
