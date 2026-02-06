"use client";

import { Code2, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const DISMISSED_KEY = "flixa-banner-dismissed";

export function FlixaBanner() {
  const t = useExtracted();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) {
    return (
      <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </header>
    );
  }

  return (
    <header className="w-full flex h-10 shrink-0 items-center gap-2 border-b bg-secondary/50 px-4 text-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {t("Try Flixa — AI coding agent for VS Code, Cursor & more.")}
          </span>
          <Link
            href="/flixa"
            className="shrink-0 inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            {t("Learn more")}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-5 w-5"
          onClick={dismiss}
          aria-label={t("Dismiss")}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </header>
  );
}
