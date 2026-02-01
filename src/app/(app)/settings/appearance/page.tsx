"use client";

import { Check, Moon, Sun, Monitor, Palette, Sparkles, Layers } from "lucide-react";
import { useExtracted } from "next-intl";
import { useTheme } from "next-themes";
import LocaleSwitcher from "@/components/locale-switcher";
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
        return { title: t("Default"), description: t("Warm, sophisticated cream tones") };
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

  const designStyles: { value: DesignStyle; label: string; description: string; icon: typeof Sparkles }[] = [
    {
      value: "modern",
      label: t("Modern"),
      description: t("Premium editorial design with warm tones"),
      icon: Sparkles,
    },
    {
      value: "classic",
      label: t("Classic"),
      description: t("Clean, minimal design with neutral colors"),
      icon: Layers,
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em]">{t("Appearance")}</h1>
            <p className="text-muted-foreground text-sm">{t("Customize your visual experience")}</p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("Language")}</CardTitle>
          <CardDescription>{t("Choose your preferred language for the interface")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher changeLocaleAction={changeLocaleAction} />
        </CardContent>
      </Card>

      {/* Design Style Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("Design Style")}</CardTitle>
          <CardDescription>{t("Choose between modern and classic look")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {designStyles.map(({ value, label, description, icon: Icon }, index) => {
              const selected = style === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStyle(value)}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-300",
                    "hover:shadow-md hover:border-primary/40",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:bg-accent/30",
                    `animate-fade-in-up delay-${(index + 1) * 75}`
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                    {selected && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0">
                        <Check className="w-3.5 h-3.5" />
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
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("Mode")}</CardTitle>
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
                className={cn(
                  "flex-1 gap-2 h-10 rounded-xl transition-all duration-300",
                  theme === value && "shadow-md"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Presets Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("Color Theme")}</CardTitle>
          <CardDescription>{t("Choose a color palette that suits your style")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {themePresets.map((presetItem, index) => {
              const selected = activeTheme === presetItem.key;
              const copy = getPresetCopy(presetItem.key);
              return (
                <button
                  key={presetItem.key}
                  type="button"
                  onClick={() => handleSelect(presetItem.key)}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all duration-300",
                    "hover:shadow-md hover:border-primary/40",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:bg-accent/30",
                    `animate-fade-in-up delay-${(index + 1) * 75}`
                  )}
                >
                  {/* Content */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{copy.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {copy.description}
                      </p>
                    </div>
                    {selected && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Color Preview */}
                  <div className="flex w-full gap-1.5" aria-hidden>
                    {(presetItem.preview ?? []).map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-2 flex-1 rounded-full transition-transform duration-300",
                          "group-hover:scale-y-125",
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
