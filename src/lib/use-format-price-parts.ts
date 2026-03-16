"use client";

import { useLocale } from "next-intl";
import { minorUnitToMajor } from "@/lib/currency";

const NUMBER_PART_TYPES = new Set([
  "minusSign",
  "plusSign",
  "integer",
  "group",
  "decimal",
  "fraction",
]);

export function useFormatPriceParts() {
  const locale = useLocale();

  return (amountMinor: number, currency?: string | null) => {
    const currencyCode = (currency ?? "USD").toUpperCase();
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts(minorUnitToMajor(amountMinor, currencyCode));

    return {
      currency: parts
        .filter((part) => part.type === "currency")
        .map((part) => part.value)
        .join(""),
      amount: parts
        .filter((part) => NUMBER_PART_TYPES.has(part.type))
        .map((part) => part.value)
        .join(""),
    };
  };
}
