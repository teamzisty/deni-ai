"use client";

import type { ReactNode } from "react";
import { createContext, use, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "deni-design-style";
const STYLE_EVENT = "deni:design-style";

export type DesignStyle = "modern" | "classic";

type DesignStyleContextValue = {
  style: DesignStyle;
  setStyle: (value: DesignStyle) => void;
};

const DesignStyleContext = createContext<DesignStyleContextValue | null>(null);

function isDesignStyle(value: string): value is DesignStyle {
  return value === "modern" || value === "classic";
}

function applyDesignStyleClass(value: DesignStyle) {
  if (typeof document === "undefined") return;
  const body = document.body;
  body.classList.remove("design-modern", "design-classic");
  body.classList.add(`design-${value}`);
}

function subscribeDesignStyle(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(STYLE_EVENT, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(STYLE_EVENT, handleChange);
  };
}

function getDesignStyleSnapshot(): DesignStyle {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isDesignStyle(stored)) {
    return stored;
  }
  return "modern";
}

function getServerDesignStyleSnapshot(): DesignStyle {
  return "modern";
}

function setDesignStyle(value: DesignStyle) {
  window.localStorage.setItem(STORAGE_KEY, value);
  applyDesignStyleClass(value);
  window.dispatchEvent(new Event(STYLE_EVENT));
}

export function DesignStyleProvider({ children }: { children: ReactNode }) {
  const style = useSyncExternalStore(
    subscribeDesignStyle,
    getDesignStyleSnapshot,
    getServerDesignStyleSnapshot,
  );

  useEffect(() => {
    applyDesignStyleClass(style);
  }, [style]);

  const value: DesignStyleContextValue = {
    style,
    setStyle: setDesignStyle,
  };

  return <DesignStyleContext.Provider value={value}>{children}</DesignStyleContext.Provider>;
}

export function useDesignStyle() {
  const value = use(DesignStyleContext);
  if (!value) {
    throw new Error("useDesignStyle must be used within DesignStyleProvider");
  }
  return value;
}
