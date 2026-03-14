"use client";

import { useExtracted } from "next-intl";

export function ProjectsSettingsLoading() {
  const t = useExtracted();

  return <div className="py-10 text-sm text-muted-foreground">{t("Loading projects…")}</div>;
}
