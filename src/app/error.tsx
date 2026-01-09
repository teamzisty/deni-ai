"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtracted } from "next-intl";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appVersion } from "@/lib/version";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const pathname = usePathname();
  const t = useExtracted();
  const timestamp = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const reportItems = [
    { label: t("Version"), value: appVersion },
    { label: t("Path"), value: pathname ?? t("Unknown") },
    { label: t("Time"), value: timestamp },
    { label: t("Digest"), value: error.digest ?? t("n/a") },
    { label: t("Name"), value: error.name ?? t("Error") },
    { label: t("Message"), value: error.message || t("Unexpected error") },
  ];

  const reportText = reportItems.map((item) => `${item.label}: ${item.value}`).join("\n");

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-destructive/10">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <Badge variant="destructive" className="px-3 py-1 text-xs uppercase tracking-[0.35em]">
            {t("Error")}
          </Badge>
          <TriangleAlert className="size-12 text-destructive" />
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("Something went wrong")}
          </h1>
          <p className="max-w-xl text-muted-foreground">
            {t("An unexpected error occurred. You can retry or return to the home page.")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>{t("Try again")}</Button>
            <Button variant="secondary" asChild>
              <Link href="/">{t("Back to home")}</Link>
            </Button>
          </div>
        </div>
        <section className="w-full max-w-2xl rounded-xl border border-border/60 bg-card/70 p-6 text-left shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("Error report")}
          </div>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-4 font-mono text-xs text-foreground">
            {reportText}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Include this report when contacting support.")}
          </p>
        </section>
      </div>
    </main>
  );
}
