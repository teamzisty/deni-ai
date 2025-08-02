"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Languages } from "lucide-react";
import { languages } from "@/lib/constants";
import { useTranslations } from "@/hooks/use-translations";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const onSelectChange = (newLocale: string) => {
    startTransition(() => {
      const segments = pathname.split("/");
      segments[1] = newLocale;
      const newPathname = segments.join("/");
      router.replace(newPathname);
    });
  };

  const getLanguageLabel = (loc: string) => {
    return languages[loc as keyof typeof languages]?.name || loc;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="relative"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">
            {t("languageSwitcher.switchLanguage")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {Object.keys(languages).map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => onSelectChange(loc)}
            className={locale === loc ? "font-semibold" : ""}
          >
            {getLanguageLabel(loc)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
