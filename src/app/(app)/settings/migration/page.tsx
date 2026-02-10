"use client";

import { ArrowRight, Check, Upload, AlertTriangle, FileJson } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/react";

type ImportResult = {
  success: boolean;
  importedChats: number;
  importedMessages: number;
  warnings?: string[];
  error?: string;
};

export default function MigrationPage() {
  const t = useExtracted();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const utils = trpc.useUtils();

  const importMutation = trpc.migration.import.useMutation();

  const handleImport = async () => {
    if (!file) {
      toast.error(t("Select a message.json file to import."));
      return;
    }

    setResult(null);

    let payload: unknown;
    try {
      const text = await file.text();
      payload = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse JSON file", error);
      toast.error(t("message.json is not valid JSON."));
      return;
    }

    try {
      const data = await importMutation.mutateAsync({ payload });
      setResult(data);

      if (!data.success) {
        toast.error(data.error || t("Import failed."));
        return;
      }

      await utils.chat.getChats.invalidate();
      toast.success(t("Import completed."));
    } catch (error) {
      console.error("Import failed", error);
      toast.error(t("Import failed."));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t("Message Migration")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Move your chats from the old version into this site.")}
        </p>
      </div>

      {/* Step 1: Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-xs font-medium">
              1
            </span>
            <CardTitle className="text-sm font-medium">
              {t("Export from the migrator tool")}
            </CardTitle>
          </div>
          <CardDescription>
            {t("Log into the migrator app and download a `message.json` file.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button variant="secondary" className="gap-2" asChild>
              <Link href="https://migrate.deniai.app" target="_blank">
                <ArrowRight className="w-4 h-4" />
                {t("Go to migrator tool")}
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">{t("Opens in a new tab")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-xs font-medium">
              2
            </span>
            <CardTitle className="text-sm font-medium">{t("Import into this site")}</CardTitle>
          </div>
          <CardDescription>
            {t("Upload the `message.json` file to create new chats.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-file" className="flex items-center gap-2 text-sm">
              <FileJson className="w-4 h-4 text-muted-foreground" />
              {t("message.json")}
            </Label>
            <Input
              id="message-file"
              type="file"
              accept="application/json,.json"
              className="cursor-pointer"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
              }}
            />
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="w-3 h-3 text-green-600" />
                {t("Selected: {filename}", { filename: file.name })}
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={importMutation.isPending || !file}
            className="gap-2"
          >
            {importMutation.isPending ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {t("Import messages")}
          </Button>

          {result && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                result.success
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {result.success ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                {t("Import summary")}
              </div>
              <div className="text-muted-foreground mt-2">
                {t("Chats: {chats} / Messages: {messages}", {
                  chats: result.importedChats.toLocaleString(),
                  messages: result.importedMessages.toLocaleString(),
                })}
              </div>
              {result.warnings?.length ? (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium hover:text-foreground">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {t("{count, plural, one {# warning} other {# warnings}}", {
                      count: result.warnings.length,
                    })}
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
