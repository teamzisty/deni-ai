"use client";

import { useState, useEffect } from "react";
import { setCookie } from "cookies-next";
import { useTranslations } from "next-intl";

interface AnalyticsConsentProps {
  initialConsent?: boolean;
}

export default function AnalyticsConsent({
  initialConsent,
}: AnalyticsConsentProps) {
  const [isVisible, setIsVisible] = useState(initialConsent === undefined);
  const [hasConsent, setHasConsent] = useState(initialConsent ?? false);

  const t = useTranslations("analyticsConsent");

  useEffect(() => {
    // Only show if consent hasn't been given yet
    if (initialConsent === undefined) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [initialConsent]);

  const handleConsent = async (consent: boolean) => {
    // Set cookie using document.cookie since we're on the client side
    setHasConsent(consent);
    setCookie("analytics-consent", consent.toString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    setIsVisible(false);

    // Reload the page to apply analytics changes
    window.location.reload();
  };

  if (!isVisible && hasConsent != undefined) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-md shadow-lg p-4 z-50 max-w-md w-full">
      <h3 className="font-semibold mb-2">{t("title")}</h3>
      <p className="text-sm mb-4">{t("description")}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => handleConsent(false)}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          {t("reject")}
        </button>
        <button
          onClick={() => handleConsent(true)}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
