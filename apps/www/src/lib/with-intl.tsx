import { ComponentType } from "react";

/**
 * Helper function to wrap components with internationalization support
 * This allows gradual migration of components to use translations
 */
export function withIntl<P extends object>(
  Component: ComponentType<P>,
  IntlComponent: ComponentType<P>,
): ComponentType<P> {
  // For now, return the internationalized component
  // In production, you might want to check locale or feature flags
  return IntlComponent;
}
