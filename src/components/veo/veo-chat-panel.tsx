"use client";

import { useExtracted } from "next-intl";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { GenerationStatus, ImagePayload, SubmittedSettings } from "./veo-types";

export function VeoChatPanel({
  status,
  statusLabel,
  statusVariant,
  isBusy,
  submittedPrompt,
  submittedNegativePrompt,
  submittedImage,
  settingsSnapshot,
  modelLabel,
  error,
  videoUrl,
  operationName,
  prompt,
  onPromptChange,
  onGenerate,
  onCancel,
}: {
  status: GenerationStatus;
  statusLabel: string;
  statusVariant: "destructive" | "secondary" | "default" | "outline";
  isBusy: boolean;
  submittedPrompt: string | null;
  submittedNegativePrompt: string | null;
  submittedImage: ImagePayload | null;
  settingsSnapshot: SubmittedSettings;
  modelLabel: string;
  error: string | null;
  videoUrl: string | null;
  operationName: string | null;
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const t = useExtracted();

  return (
    <Card className="flex min-h-[640px] flex-col border-border/80">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{t("Veo chat")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Talk through your idea and generate a short video reply.")}
          </p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <Conversation className="flex-1 min-h-0 rounded-lg border border-border/60 bg-muted/10">
          <ConversationContent>
            {!submittedPrompt && (
              <ConversationEmptyState
                title={t("Start a prompt")}
                description={t("Describe the scene to generate a video response.")}
              />
            )}

            {submittedPrompt && (
              <>
                <Message from="user">
                  <MessageContent className="gap-3">
                    <MessageResponse>{submittedPrompt}</MessageResponse>
                    {submittedNegativePrompt && (
                      <div className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs">
                        <p className="text-xs font-medium text-foreground">
                          {t("Negative prompt")}
                        </p>
                        <p className="text-muted-foreground">{submittedNegativePrompt}</p>
                      </div>
                    )}
                    {submittedImage?.previewUrl && (
                      <div className="overflow-hidden rounded-lg border border-border/60">
                        {/* oxlint-disable-next-line lint/performance/noImgElement: preview URLs can be blob/data. */}
                        <img
                          src={submittedImage.previewUrl}
                          alt={t("Input preview")}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )}
                  </MessageContent>
                </Message>

                <Message from="assistant">
                  <MessageContent className="gap-3 group-[.is-assistant]:rounded-lg group-[.is-assistant]:border group-[.is-assistant]:border-border/60 group-[.is-assistant]:bg-background/90 group-[.is-assistant]:px-4 group-[.is-assistant]:py-3">
                    {status === "error" && error ? (
                      <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                        <AlertTitle>{t("Error")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : videoUrl ? (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                          {/* oxlint-disable-next-line lint/a11y/useMediaCaption: generated videos don't include captions. */}
                          <video controls src={videoUrl} className="h-auto w-full" />
                        </div>
                        <Button asChild variant="outline">
                          <a href={videoUrl} download>
                            {t("Download video")}
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {isBusy && <Spinner className="size-4" />}
                          <span>
                            {status === "submitting"
                              ? t("Submitting request...")
                              : status === "polling"
                                ? t("Generating video...")
                                : status === "done"
                                  ? t("Video ready.")
                                  : status === "error"
                                    ? t("Generation failed.")
                                    : t("Ready for another prompt.")}
                          </span>
                        </div>
                        {operationName && (
                          <p className="break-words text-xs">
                            {t("Operation: {name}", {
                              name: operationName,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="secondary">{settingsSnapshot.resolution}</Badge>
                      <Badge variant="secondary">{settingsSnapshot.aspectRatio}</Badge>
                      <Badge variant="secondary">{settingsSnapshot.durationSeconds}s</Badge>
                      <Badge variant="outline">{modelLabel}</Badge>
                      {settingsSnapshot.seed && (
                        <Badge variant="outline">
                          {t("Seed {seed}", {
                            seed: settingsSnapshot.seed,
                          })}
                        </Badge>
                      )}
                    </div>
                  </MessageContent>
                </Message>
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {error && status !== "error" && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
            <AlertTitle>{t("Error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label className="sr-only" htmlFor="veo-prompt">
                {t("Prompt")}
              </Label>
              <Textarea
                id="veo-prompt"
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                placeholder={t(
                  "Describe the scene, camera movement, lighting, and any audio cues.",
                )}
                className="min-h-[110px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onGenerate} disabled={isBusy}>
                {isBusy && <Spinner />}
                {t("Send")}
              </Button>
              {isBusy && (
                <Button variant="ghost" onClick={onCancel}>
                  {t("Cancel")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
