"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "deni-design-style";

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

export function DesignStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyleState] = useState<DesignStyle>("modern");

  const applyAndPersist = useCallback((value: DesignStyle) => {
    setStyleState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value);
    }
    applyDesignStyleClass(value);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isDesignStyle(stored)) {
      applyAndPersist(stored);
    } else {
      applyDesignStyleClass("modern");
    }
  }, [applyAndPersist]);

  const value = useMemo(
    () => ({
      style,
      setStyle: applyAndPersist,
    }),
    [applyAndPersist, style],
  );

  return <DesignStyleContext.Provider value={value}>{children}</DesignStyleContext.Provider>;
}

export function useDesignStyle() {
  const value = useContext(DesignStyleContext);
  if (!value) {
    throw new Error("useDesignStyle must be used within DesignStyleProvider");
  }
  return value;
}
