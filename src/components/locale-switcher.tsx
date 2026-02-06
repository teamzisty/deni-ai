"use client";

import { useLocale } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AppLocale, locales } from "@/i18n/locales";

type LocaleSwitcherProps = {
  changeLocaleAction: (locale: AppLocale) => Promise<void>;
};

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  ja: "日本語",
};

export function LocaleSwitcher({ changeLocaleAction }: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;

  return (
    <Select value={locale} onValueChange={(value) => changeLocaleAction(value as AppLocale)}>
      <SelectTrigger className="w-36">
        <SelectValue>
          {localeLabels[locale] ?? locale}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((option) => (
          <SelectItem key={option} value={option}>
            {localeLabels[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
