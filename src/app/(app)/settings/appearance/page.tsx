"use client";

import { Check, Moon, Sun, Monitor, Palette, Layers } from "lucide-react";
import { useExtracted } from "next-intl";
import { useTheme } from "next-themes";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type DesignStyle, useDesignStyle } from "@/hooks/use-design-style";
import { useThemePreset } from "@/hooks/use-theme-preset";
import { changeLocaleAction } from "@/lib/locale-actions";
import { type ThemeName, themePresets } from "@/lib/theme-presets";
import { cn } from "@/lib/utils";

export default function AppearancePage() {
  const t = useExtracted();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const { style, setStyle } = useDesignStyle();
  const activeTheme = preset;

  const handleSelect = (value: ThemeName) => {
    setPreset(value);
  };

  const getPresetCopy = (key: ThemeName) => {
    switch (key) {
      case "default":
        return { title: t("Default"), description: t("Clean, neutral gray tones") };
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

  const themeModes = [
    { value: "light", label: t("Light"), icon: Sun },
    { value: "dark", label: t("Dark"), icon: Moon },
    { value: "system", label: t("System"), icon: Monitor },
  ];

  const designStyles: { value: DesignStyle; label: string; description: string; icon: typeof Palette }[] = [
    {
      value: "modern",
      label: t("Modern"),
      description: t("Clean design with Inter font"),
      icon: Palette,
    },
    {
      value: "classic",
      label: t("Classic"),
      description: t("Clean, minimal design with neutral colors"),
      icon: Layers,
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t("Appearance")}</h1>
        <p className="text-muted-foreground text-sm">{t("Customize your visual experience")}</p>
      </div>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("Language")}</CardTitle>
          <CardDescription>{t("Choose your preferred language for the interface")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
        </CardContent>
      </Card>

      {/* Design Style Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("Design Style")}</CardTitle>
          <CardDescription>{t("Choose between modern and classic look")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {designStyles.map(({ value, label, description, icon: Icon }) => {
              const selected = style === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStyle(value)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                    {selected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Theme Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("Mode")}</CardTitle>
          <CardDescription>{t("Select light, dark, or system preference")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themeModes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(value)}
                className="flex-1 gap-2 h-9"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Presets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("Color Theme")}</CardTitle>
          <CardDescription>{t("Choose a color palette that suits your style")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {themePresets.map((presetItem) => {
              const selected = activeTheme === presetItem.key;
              const copy = getPresetCopy(presetItem.key);
              return (
                <button
                  key={presetItem.key}
                  type="button"
                  onClick={() => handleSelect(presetItem.key)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  {/* Content */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{copy.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {copy.description}
                      </p>
                    </div>
                    {selected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Color Preview */}
                  <div className="flex w-full gap-1" aria-hidden>
                    {(presetItem.preview ?? []).map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          bar
                        )}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
