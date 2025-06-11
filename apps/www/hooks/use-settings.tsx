"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Define the settings interface
export interface Settings {
  advancedSearch: boolean;
  autoScroll: boolean;
  privacyMode: boolean;
  hubs: boolean;
  bots: boolean;
  branch: boolean;
  conversationsPrivacyMode: boolean;
  // Add more settings here as needed
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  advancedSearch: false,
  autoScroll: true,
  privacyMode: false,
  bots: true,
  hubs: true,
  branch: true,
  conversationsPrivacyMode: false,
};

const SUPABASE_TABLE = "user_settings";
const LOCAL_STORAGE_KEY = "settings";

// Define context interface
interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

// Create context
const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [recordExists, setRecordExists] = useState(false);
  const t = useTranslations();
  // Load settings from Supabase or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);

      try {
        if (user && user.id && supabase) {
          // Try to load from Supabase
          const { data, error } = await supabase
            .from(SUPABASE_TABLE)
            .select("settings")
            .eq("user_id", user.id)
            .single();
          if (!error && data) {
            // Ensure data.settings is properly parsed if it's a string
            let parsedSettings = data.settings;
            if (typeof data.settings === "string") {
              try {
                parsedSettings = JSON.parse(data.settings);
              } catch (e) {
                console.error("Error parsing settings from Supabase:", e);
                parsedSettings = {};
              }
            }

            // Merge with defaults to ensure all properties exist
            const loadedSettings = {
              ...DEFAULT_SETTINGS,
              ...parsedSettings,
            };
            setSettings(loadedSettings);
            setRecordExists(true);
          } else {
            // No settings in Supabase yet, use defaults
            setSettings(DEFAULT_SETTINGS);
            setRecordExists(false);
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
  }, [user, supabase]); // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      // Use functional update to get current settings
      setSettings((currentSettings) => {
        // Ensure currentSettings is a proper object, not a string
        let validCurrentSettings = currentSettings;
        if (typeof currentSettings === "string") {
          try {
            validCurrentSettings = JSON.parse(currentSettings);
          } catch (e) {
            console.error("Error parsing current settings:", e);
            validCurrentSettings = DEFAULT_SETTINGS;
          }
        }

        const newSettings = {
          ...validCurrentSettings,
          [key]: value,
        };

        console.log("New settings to save:", newSettings);

        // Save to the appropriate storage (async operation)
        (async () => {
          try {
            if (user && user.id && supabase) {
              // Save to Supabase - update existing record or create new one
              if (recordExists) {
                // Update existing record
                const { error } = await supabase
                  .from(SUPABASE_TABLE)
                  .update({
                    settings: newSettings,
                  })
                  .eq("user_id", user.id);

                if (error) throw error;
              } else {
                // Create new record
                const { error } = await supabase.from(SUPABASE_TABLE).insert({
                  user_id: user.id,
                  settings: newSettings,
                });

                if (error) throw error;
                setRecordExists(true);
              }
            } else {
              // Save to localStorage
              localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(newSettings),
              );
            }
          } catch (error) {
            console.error(`Failed to save setting ${String(key)}:`, error);
            toast.error(t("settings.saveFailed") || "Failed to save settings");
            // Revert state on error
            setSettings(validCurrentSettings);
          }
        })();

        return newSettings;
      });
    },
    [user, supabase, t, recordExists],
  );
  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      if (user && user.id && supabase) {
        // Reset in Supabase - update existing record or create new one
        if (recordExists) {
          // Update existing record
          const { error } = await supabase
            .from(SUPABASE_TABLE)
            .update({
              settings: DEFAULT_SETTINGS,
            })
            .eq("user_id", user.id);

          if (error) throw error;
        } else {
          // Create new record
          const { error } = await supabase.from(SUPABASE_TABLE).insert({
            user_id: user.id,
            settings: DEFAULT_SETTINGS,
          });

          if (error) throw error;
          setRecordExists(true);
        }
      } else {
        // Reset in localStorage
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(DEFAULT_SETTINGS),
        );
      }

      setSettings(DEFAULT_SETTINGS);
      toast.success(
        t("settings.resetSuccess") || "Settings reset successfully",
      );
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error(t("settings.resetFailed") || "Failed to reset settings");
    }
  }, [user, supabase, t, recordExists]);

  // Create context value
  const value: SettingsContextValue = {
    settings,
    updateSetting,
    resetSettings,
    isLoading,
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
