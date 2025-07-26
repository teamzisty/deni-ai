"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCw, Home, Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { BRAND_NAME, VERSION } from "@/lib/constants";
import { useTranslations } from "@/hooks/use-translations";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common.error");

  const errorReport = `${t("reportTitle", { brandName: BRAND_NAME })}
${t("version", { version: VERSION.version })}
${t("pathname", { pathname })}
${t("timestamp", { timestamp: new Date().toISOString() })}

${t("errorMessage", { message: error.message || t("unknownError") })}
${t("stackTrace", { trace: error.stack || t("noStackTrace") })}
${t("digest", { digest: error.digest || t("notAvailable") })}`;

  useEffect(() => {
    console.error(error);
  }, [error]);

  const copyErrorReport = async () => {
    try {
      await navigator.clipboard.writeText(errorReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error report:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {error.message || t("unexpectedError")}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t("errorReport")}</label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyErrorReport}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </div>
            <Textarea
              readOnly
              value={errorReport}
              className="min-h-[200px] text-xs font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("tryAgain")}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            {t("goHome")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
