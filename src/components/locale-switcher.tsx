"use client";

import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type AppLocale, locales } from "@/i18n/locales";

type LocaleSwitcherProps = {
  changeLocaleAction: (locale: AppLocale) => Promise<void>;
};

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  ja: "日本語",
};

export default function LocaleSwitcher({ changeLocaleAction }: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          {localeLabels[locale] ?? locale}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => changeLocaleAction(option)}
            className={locale === option ? "bg-accent" : ""}
          >
            {localeLabels[option] ?? option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
