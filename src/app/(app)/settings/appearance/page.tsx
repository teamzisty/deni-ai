"use client";

import { useExtracted } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useThemePreset } from "@/hooks/use-theme-preset";
import { type ThemeName, themePresets } from "@/lib/theme-presets";

export default function AppearancePage() {
  const t = useExtracted();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const activeTheme = preset;

  const handleSelect = (value: ThemeName) => {
    setPreset(value);
  };

  const getPresetCopy = (key: ThemeName) => {
    switch (key) {
      case "default":
        return { title: t("Default"), description: t("The default theme") };
      case "t3-chat":
        return {
          title: t("T3 Chat"),
          description: t("Pink & violet inspired chat vibe"),
        };
      case "tangerine":
        return {
          title: t("Tangerine"),
          description: t("Bright, warm, and friendly"),
        };
      case "mono":
        return {
          title: t("Mono"),
          description: t("Neutral grayscale, minimal distractions"),
        };
      default:
        return { title: key, description: "" };
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("Appearance")}
        </h1>
        <p className="text-muted-foreground">
          {t("Select your favorite theme.")}
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (theme === "light") setTheme("dark");
          else if (theme === "dark") setTheme("system");
          else setTheme("light");
        }}
      >
        {t("Cycle light / dark / system")}
      </Button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {themePresets.map((presetItem) => {
          const selected = activeTheme === presetItem.key;
          const copy = getPresetCopy(presetItem.key);
          return (
            <button
              key={presetItem.key}
              type="button"
              onClick={() => handleSelect(presetItem.key)}
              className={`flex h-full flex-col gap-3 rounded-md border-2 p-4 text-left transition ${
                selected ? "border-primary bg-primary/5" : "border-border/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{copy.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {copy.description}
                  </p>
                </div>
                {selected ? (
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {t("Active")}
                  </span>
                ) : null}
              </div>
              <div className="flex w-full gap-1.5" aria-hidden>
                {(presetItem.preview ?? []).map((bar) => (
                  <div
                    key={bar}
                    className={`h-1.5 flex-1 rounded-full ${bar}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
