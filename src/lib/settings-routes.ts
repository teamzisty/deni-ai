const CHECKOUT_SETTINGS_PATHS = new Set(["/settings/billing/checkout", "/settings/team/checkout"]);

export function isCheckoutSettingsRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return CHECKOUT_SETTINGS_PATHS.has(pathname);
}
