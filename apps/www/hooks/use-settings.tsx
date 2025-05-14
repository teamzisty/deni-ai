"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { firestore } from "@workspace/firebase-config/client";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Define the settings interface
export interface Settings {
  advancedSearch: boolean;
  autoScroll: boolean;
  privacyMode: boolean;
  hubs: boolean;
  branch: boolean;
  conversationsPrivacyMode: boolean;
  // Add more settings here as needed
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  advancedSearch: false,
  autoScroll: true,
  privacyMode: false,
  hubs: true,
  branch: true,
  conversationsPrivacyMode: false,  
};

const FIRESTORE_COLLECTION = "deni-ai-settings";
const LOCAL_STORAGE_KEY = "settings";

// Define context interface
interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

// Create context
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations();

  // Load settings from Firestore or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        if (user && firestore) {
          // Try to load from Firestore
          const settingsDocRef = doc(firestore, FIRESTORE_COLLECTION, user.uid);
          const settingsDoc = await getDoc(settingsDocRef);
          
          if (settingsDoc.exists()) {
            // Merge with defaults to ensure all properties exist
            const loadedSettings = {
              ...DEFAULT_SETTINGS,
              ...settingsDoc.data() as Settings
            };
            setSettings(loadedSettings);
          } else {
            // No settings in Firestore yet, use defaults
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          // Try to load from localStorage
          const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedSettings) {
            try {
              const parsedSettings = JSON.parse(storedSettings);
              // Merge with defaults to ensure all properties exist
              setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
            } catch (error) {
              console.error("Error parsing settings from localStorage", error);
              setSettings(DEFAULT_SETTINGS);
            }
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        // Fallback to defaults
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update a single setting
  const updateSetting = useCallback(async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [key]: value,
      };
      
      // Save to the appropriate storage
      (async () => {
        try {
          if (user && firestore) {
            // Save to Firestore
            const settingsDocRef = doc(firestore, FIRESTORE_COLLECTION, user.uid);
            await setDoc(settingsDocRef, newSettings, { merge: true });
          } else {
            // Save to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
          }
        } catch (error) {
          console.error(`Failed to save setting ${String(key)}:`, error);
          toast.error(t("settings.saveFailed") || "Failed to save settings");
        }
      })();
      
      return newSettings;
    });
  }, [user, t]);
  
  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      if (user && firestore) {
        // Reset in Firestore
        const settingsDocRef = doc(firestore, FIRESTORE_COLLECTION, user.uid);
        await setDoc(settingsDocRef, DEFAULT_SETTINGS);
      } else {
        // Reset in localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      }
      
      setSettings(DEFAULT_SETTINGS);
      toast.success(t("settings.resetSuccess") || "Settings reset successfully");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error(t("settings.resetFailed") || "Failed to reset settings");
    }
  }, [user, t]);

  // Create context value
  const value: SettingsContextValue = {
    settings,
    updateSetting,
    resetSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}