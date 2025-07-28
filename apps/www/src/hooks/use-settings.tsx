"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Settings, DEFAULT_SETTINGS } from "@/lib/schemas/settings";

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
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { data: userSettingsData, isLoading: isLoading } = trpc.settings.getSettings.useQuery();
  const { mutateAsync: updateSettings } = trpc.settings.updateSettings.useMutation();

  // Update a single setting
  const updateSetting = useCallback(
    async (key: keyof Settings, value: Settings[keyof Settings]) => {
      try {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await updateSettings(newSettings);
      } catch (error) {
        console.error("Failed to update setting:", error);
        toast.error("Failed to update setting");
      }
    },
    [user, settings],
  );

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      await updateSettings(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    }
  }, [updateSettings]);

  useEffect(() => {
    if (userSettingsData) {
      setSettings(userSettingsData.settings as unknown as Settings);
    }
  }, [userSettingsData]);

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
