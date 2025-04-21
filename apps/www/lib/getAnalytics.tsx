"use server";

import { cookies } from "next/headers";

export async function getAnalytics() {
  const cookieStore = await cookies();
  const analyticsConsent = cookieStore.get("analytics-consent");
  const isAnalyticsEnabled = analyticsConsent?.value === "true";
  return isAnalyticsEnabled;
}


export async function setAnalytics(isAnalyticsEnabled: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("analytics-consent", isAnalyticsEnabled.toString());
}
