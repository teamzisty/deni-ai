"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useSettings } from "@/hooks/use-settings";

const ColorThemeContext = createContext<{
  colorTheme: string;
  setColorTheme: (theme: string) => void;
} | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSetting } = useSettings();
  const colorTheme = settings.colorTheme || 'blue';

  const setColorTheme = (theme: string) => {
    updateSetting('colorTheme', theme);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    const themeClasses = ['theme-blue', 'theme-purple', 'theme-green', 'theme-orange', 'theme-red', 'theme-pink', 'theme-indigo', 'theme-yellow'];
    themeClasses.forEach(cls => root.classList.remove(cls));
    
    // Add the current theme class
    root.classList.add(`theme-${colorTheme}`);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}