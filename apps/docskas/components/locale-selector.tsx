"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n";

interface LocaleSelectorProps {
  currentLocale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export function LocaleSelector({
  currentLocale = "en",
  onLocaleChange,
}: LocaleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    setIsOpen(false);
    onLocaleChange?.(locale);

    // For now, we'll just reload with the new locale in the URL
    // In a full implementation, this would use Next.js i18n routing
    if (locale !== currentLocale) {
      const currentPath = window.location.pathname;
      const newPath =
        locale === "en" ? currentPath : `/${locale}${currentPath}`;
      window.location.href = newPath;
    }
  };

  const currentLocaleData =
    locales.find((l) => l.code === currentLocale) || locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLocaleData.name}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {locales.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => handleLocaleChange(locale.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    locale.code === currentLocale
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{locale.flag}</span>
                    <span>{locale.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
