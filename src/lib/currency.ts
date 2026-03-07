const DEFAULT_CURRENCY = "USD";

function normalizeCurrencyCode(currency?: string | null) {
  return (currency ?? DEFAULT_CURRENCY).toUpperCase();
}

function getCurrencyFractionDigits(currency: string, locale?: Intl.LocalesArgument) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
}

export function minorUnitToMajor(amountMinor: number, currency?: string | null) {
  const currencyCode = normalizeCurrencyCode(currency);
  const fractionDigits = Number(getCurrencyFractionDigits(currencyCode) ?? 2);
  return amountMinor / 10 ** fractionDigits;
}

export function formatMinorCurrency(
  amountMinor: number,
  currency?: string | null,
  options?: Intl.NumberFormatOptions,
  locale?: Intl.LocalesArgument,
) {
  const currencyCode = normalizeCurrencyCode(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    ...options,
  }).format(minorUnitToMajor(amountMinor, currencyCode));
}
