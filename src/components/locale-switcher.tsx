"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AppLocale, locales } from "@/i18n/locales";
import { localizedPath } from "@/lib/locale-path";

type LocaleSwitcherProps = {
  changeLocaleAction: (locale: AppLocale) => Promise<void>;
};

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  ja: "日本語",
};

export function LocaleSwitcher({ changeLocaleAction }: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Select
      value={locale}
      onValueChange={async (value) => {
        const nextLocale = value as AppLocale;
        await changeLocaleAction(nextLocale);
        router.push(localizedPath(pathname, nextLocale));
        router.refresh();
      }}
    >
      <SelectTrigger className="w-36">
        <SelectValue>{localeLabels[locale] ?? locale}</SelectValue>
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
