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

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const errorReport = `Deni AI Error Report
Version: 5.0.0
Pathname: ${pathname}
Timestamp: ${new Date().toISOString()}

Error Message: ${error.message || "Unknown error"}
Stack Trace: ${error.stack || "No stack trace available"}
Digest: ${error.digest || "N/A"}`;

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
          <CardTitle className="text-2xl">Something went wrong!</CardTitle>
          <CardDescription>
            An unexpected error occurred. Don't worry, it's not your fault.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {error.message || "An unexpected error occurred"}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Error Report</label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyErrorReport}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
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
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
