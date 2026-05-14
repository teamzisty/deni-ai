"use server";

import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/i18n/locales";
import { auth } from "@/lib/auth";

export async function changeLocaleAction(locale: AppLocale) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const store = await cookies();
  store.set("locale", locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
