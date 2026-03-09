const CHECKOUT_SETTINGS_PREFIXES = ["/settings/billing/checkout", "/settings/team/checkout"];

export function isCheckoutSettingsRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return CHECKOUT_SETTINGS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
