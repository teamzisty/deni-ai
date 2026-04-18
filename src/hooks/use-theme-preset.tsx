"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeName } from "@/lib/theme-presets";

const STORAGE_KEY = "deni-theme-preset";
const CUSTOM_CLASSES: ThemeName[] = [
  "t3-chat",
  "tangerine",
  "mono",
  "deep-dark",
  "deep-dark-high-contrast",
];
const STANDARD_THEMES: ThemeName[] = ["light", "dark", "system"];

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
    value === "default" ||
    value === "t3-chat" ||
    value === "tangerine" ||
    value === "mono" ||
    value === "deep-dark" ||
    value === "deep-dark-high-contrast"
  );
}

function normalizePreset(value: ThemeName) {
  return STANDARD_THEMES.includes(value) ? "default" : value;
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
  const [preset, setPresetState] = useState<ThemeName>("default");

  const applyAndPersist = useCallback((value: ThemeName) => {
    const normalizedValue = normalizePreset(value);
    setPresetState(normalizedValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, normalizedValue);
    }
    applyPresetClass(normalizedValue);
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
    setPresetState("default");
    applyPresetClass("default");
  }, [applyAndPersist]);

  const value = useMemo(
    () => ({
      preset,
      setPreset: applyAndPersist,
    }),
    [applyAndPersist, preset],
  );

  return <ThemePresetContext.Provider value={value}>{children}</ThemePresetContext.Provider>;
}

export function useThemePreset() {
  const value = useContext(ThemePresetContext);
  if (!value) {
    throw new Error("useThemePreset must be used within ThemePresetProvider");
  }
  return value;
}
