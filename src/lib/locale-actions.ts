"use server";

import { cookies } from "next/headers";
import type { AppLocale } from "@/i18n/locales";

export async function changeLocaleAction(locale: AppLocale) {
  const store = await cookies();
  store.set("locale", locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
