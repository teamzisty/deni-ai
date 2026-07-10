"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  // Disable CSS transitions during theme change so light/dark flips instantly
  // instead of easing through intermediate colors across the whole tree.
  disableTransitionOnChange = true,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider disableTransitionOnChange={disableTransitionOnChange} {...props}>
      {children}
    </NextThemesProvider>
  );
}
