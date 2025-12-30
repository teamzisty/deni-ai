"use client";

import { useExtracted, useLocale } from "next-intl";
import { locales, type AppLocale } from "@/i18n/locales";

type LocaleSwitcherProps = {
  changeLocaleAction: (locale: AppLocale) => Promise<void>;
};

export default function LocaleSwitcher({
  changeLocaleAction,
}: LocaleSwitcherProps) {
  const t = useExtracted();
  const locale = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/80 p-1 text-xs shadow-sm">
      {locales.map((option) => {
        const isActive = locale === option;
        const label =
          option === "en"
            ? t("English")
            : option === "ja"
              ? t("日本語")
              : option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => changeLocaleAction(option)}
            aria-pressed={isActive}
            className={`rounded-sm px-2 py-1 transition ${
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
