"use client";

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
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("Message Migration")}</h1>
        <p className="text-muted-foreground">
          {t("Move your chats from the old version into this site.")}
        </p>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{t("Step 1: Export from the migrator tool")}</CardTitle>
          <CardDescription>
            {t("Log into the migrator app and download a `message.json` file.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="https://migrate.deniai.app">{t("Go to migrator tool")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{t("Step 2: Import into this site")}</CardTitle>
          <CardDescription>
            {t("Upload the `message.json` file to create new chats.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-file">{t("message.json")}</Label>
            <Input
              id="message-file"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
              }}
            />
          </div>
          <Button onClick={handleImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Spinner /> : null}
            {t("Import messages")}
          </Button>

          {result ? (
            <div className="rounded-md border border-border/70 p-4 text-sm">
              <div className="font-medium">{t("Import summary")}</div>
              <div className="text-muted-foreground">
                {t("Chats: {chats} / Messages: {messages}", {
                  chats: result.importedChats.toLocaleString(),
                  messages: result.importedMessages.toLocaleString(),
                })}
              </div>
              {result.warnings?.length ? (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
