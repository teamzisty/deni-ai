"use server";

import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/i18n/locales";
import { auth } from "@/lib/auth";

export async function changeLocaleAction(locale: AppLocale) {
  // Guests are allowed to change locale — the cookie alone drives the UI.
  // We still resolve the session so user-scoped persistence can be added later
  // without changing the call signature.
  await auth.api.getSession({ headers: await headers() }).catch(() => null);

  const store = await cookies();
  store.set("locale", locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
