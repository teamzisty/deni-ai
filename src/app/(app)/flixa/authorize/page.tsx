"use client";

import { CheckCircle2, Code2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useExtracted } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "idle" | "approving" | "success" | "error";

export default function FlixaAuthorizePage() {
  const t = useExtracted();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleApprove = useCallback(async () => {
    if (!code) return;
    setStatus("approving");
    try {
      const res = await fetch("/api/device-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", userCode: code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [code]);

  if (!code) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("Invalid Request")}</CardTitle>
            <CardDescription>
              {t("No authorization code was provided. Please try again from the Flixa extension.")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>{t("Device Authorized")}</CardTitle>
            <CardDescription>
              {t(
                "You can close this page and return to the Flixa extension. The connection will be established automatically.",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("Authorization Failed")}</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => setStatus("idle")}>
              {t("Try Again")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </div>
          <CardTitle>{t("Authorize Flixa Extension")}</CardTitle>
          <CardDescription>
            {t(
              "The Flixa extension is requesting access to your Deni AI account. Verify the code below matches what is shown in your editor.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {t("Confirmation Code")}
            </p>
            <div className="flex items-center gap-1.5">
              <Code2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-mono font-bold tracking-[0.2em]">{code}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleApprove} disabled={status === "approving"} className="w-full">
              {status === "approving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Approving...")}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {t("Approve")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
