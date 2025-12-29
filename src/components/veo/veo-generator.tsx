"use client";

import { useExtracted } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  type VeoAspectRatio,
  type VeoDurationSeconds,
  type VeoModel,
  type VeoResolution,
  veoAspectRatios,
  veoDurations,
  veoModels,
  veoResolutions,
} from "@/lib/veo";

type GenerationStatus = "idle" | "submitting" | "polling" | "done" | "error";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 90;

type ImagePayload = {
  imageBytes: string;
  mimeType: string;
  previewUrl: string;
  name: string;
  size: number;
};

export function VeoGenerator() {
  const t = useExtracted();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [submittedNegativePrompt, setSubmittedNegativePrompt] = useState<
    string | null
  >(null);
  const [submittedImage, setSubmittedImage] = useState<ImagePayload | null>(
    null,
  );
  const [submittedSettings, setSubmittedSettings] = useState<{
    model: VeoModel;
    aspectRatio: VeoAspectRatio;
    resolution: VeoResolution;
    durationSeconds: VeoDurationSeconds;
    seed: string | null;
  } | null>(null);
  const [model, setModel] = useState<VeoModel>(veoModels[0]);
  const [aspectRatio, setAspectRatio] = useState<VeoAspectRatio>("16:9");
  const [resolution, setResolution] = useState<VeoResolution>("720p");
  const [durationSeconds, setDurationSeconds] = useState<VeoDurationSeconds>(6);
  const [seed, setSeed] = useState("");
  const [image, setImage] = useState<ImagePayload | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const requestAbortRef = useRef<AbortController | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveDuration = useMemo(
    () => (resolution === "1080p" ? 8 : durationSeconds),
    [resolution, durationSeconds],
  );

  const modelOptions = useMemo(
    () => [
      {
        value: "veo-3.1-generate-preview",
        label: t("Veo 3.1"),
        description: t("Highest quality output."),
      },
      {
        value: "veo-3.1-fast-generate-preview",
        label: t("Veo 3.1 Fast"),
        description: t("Lower latency output."),
      },
    ],
    [t],
  );

  const isBusy = status === "submitting" || status === "polling";

  useEffect(() => {
    if (resolution === "1080p" && durationSeconds !== 8) {
      setDurationSeconds(8);
    }
  }, [resolution, durationSeconds]);

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
      pollAbortRef.current?.abort();
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t("Please select an image file."));
      event.target.value = "";
      setImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("Image file is too large. Max size is 20MB."));
      event.target.value = "";
      setImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError(t("Unable to read image file."));
        return;
      }
      const [, base64] = reader.result.split(",", 2);
      if (!base64) {
        setError(t("Unable to read image file."));
        return;
      }
      setImage({
        imageBytes: base64,
        mimeType: file.type,
        previewUrl: reader.result,
        name: file.name,
        size: file.size,
      });
    };
    reader.onerror = () => {
      setError(t("Unable to read image file."));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    requestAbortRef.current?.abort();
    pollAbortRef.current?.abort();
    setStatus("idle");
    setOperationName(null);
    setError(null);
  };

  const pollOperation = async (name: string) => {
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    setStatus("polling");

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (controller.signal.aborted) {
        return;
      }

      const response = await fetch(
        `/api/veo?name=${encodeURIComponent(name)}`,
        { signal: controller.signal },
      );
      const data = (await response.json()) as {
        done?: boolean;
        videoUri?: string | null;
        error?: string | null;
      };

      if (!response.ok) {
        throw new Error(data?.error || t("Failed to check video status."));
      }

      if (data.done) {
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.videoUri) {
          throw new Error(t("Video generation finished without a file."));
        }

        const proxyUrl = `/api/veo/file?uri=${encodeURIComponent(
          data.videoUri,
        )}`;
        setVideoUrl(proxyUrl);
        setStatus("done");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(t("Timed out waiting for the video."));
  };

  const handleGenerate = async () => {
    setError(null);
    setVideoUrl(null);
    setOperationName(null);

    const promptValue = prompt.trim();
    if (!promptValue) {
      setError(t("Prompt is required."));
      return;
    }

    const seedText = seed.trim();
    const seedValue = seedText ? Number(seedText) : undefined;
    if (seedValue !== undefined && Number.isNaN(seedValue)) {
      setError(t("Seed must be a number."));
      return;
    }

    setSubmittedPrompt(promptValue);
    setSubmittedNegativePrompt(negativePrompt.trim() || null);
    setSubmittedImage(image);
    setSubmittedSettings({
      model,
      aspectRatio,
      resolution,
      durationSeconds: effectiveDuration,
      seed: seedText || null,
    });

    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;
    setStatus("submitting");

    try {
      const response = await fetch("/api/veo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptValue,
          negativePrompt: negativePrompt.trim() || undefined,
          model,
          aspectRatio,
          resolution,
          durationSeconds: effectiveDuration,
          seed: seedValue,
          image: image
            ? { imageBytes: image.imageBytes, mimeType: image.mimeType }
            : undefined,
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as {
        operationName?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data?.error || t("Video generation failed."));
      }

      if (!data.operationName) {
        throw new Error(t("Missing operation name in response."));
      }

      setOperationName(data.operationName);
      await pollOperation(data.operationName);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : t("Unexpected error."));
    }
  };

  const statusLabel = useMemo(() => {
    switch (status) {
      case "submitting":
        return t("Submitting");
      case "polling":
        return t("Generating");
      case "done":
        return t("Complete");
      case "error":
        return t("Failed");
      default:
        return submittedPrompt ? t("Standing by") : t("Ready");
    }
  }, [status, submittedPrompt, t]);

  const statusVariant =
    status === "error"
      ? "destructive"
      : status === "done"
        ? "secondary"
        : isBusy
          ? "default"
          : "outline";

  const settingsSnapshot = submittedSettings ?? {
    model,
    aspectRatio,
    resolution,
    durationSeconds: effectiveDuration,
    seed: seed.trim() || null,
  };
  const modelLabel =
    modelOptions.find((item) => item.value === settingsSnapshot.model)?.label ??
    settingsSnapshot.model;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("Veo Studio")}
          </h1>
          <Badge variant="secondary">{t("Veo 3.1 Preview")}</Badge>
        </div>
        <p className="text-muted-foreground">
          {t(
            "Generate short videos with Veo 3.1. Prompts can include audio cues.",
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
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
                    description={t(
                      "Describe the scene to generate a video response.",
                    )}
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
                            <p className="text-muted-foreground">
                              {submittedNegativePrompt}
                            </p>
                          </div>
                        )}
                        {submittedImage?.previewUrl && (
                          <div className="overflow-hidden rounded-lg border border-border/60">
                            {/* biome-ignore lint/performance/noImgElement: preview URLs can be blob/data. */}
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
                              {/* biome-ignore lint/a11y/useMediaCaption: generated videos don't include captions. */}
                              <video
                                controls
                                src={videoUrl}
                                className="h-auto w-full"
                              />
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
                          <Badge variant="secondary">
                            {settingsSnapshot.resolution}
                          </Badge>
                          <Badge variant="secondary">
                            {settingsSnapshot.aspectRatio}
                          </Badge>
                          <Badge variant="secondary">
                            {settingsSnapshot.durationSeconds}s
                          </Badge>
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
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={t(
                      "Describe the scene, camera movement, lighting, and any audio cues.",
                    )}
                    className="min-h-[110px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerate} disabled={isBusy}>
                    {isBusy && <Spinner />}
                    {t("Send")}
                  </Button>
                  {isBusy && (
                    <Button variant="ghost" onClick={handleCancel}>
                      {t("Cancel")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>{t("Generation settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="veo-negative">{t("Negative prompt")}</Label>
              <Textarea
                id="veo-negative"
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                placeholder={t("cartoon, low quality, blurry")}
                className="min-h-[72px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("Model")}</Label>
                <Select
                  value={model}
                  onValueChange={(value) => setModel(value as VeoModel)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Select model")} />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("Aspect ratio")}</Label>
                <Select
                  value={aspectRatio}
                  onValueChange={(value) =>
                    setAspectRatio(value as VeoAspectRatio)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Select ratio")} />
                  </SelectTrigger>
                  <SelectContent>
                    {veoAspectRatios.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>
                        {ratio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("Resolution")}</Label>
                <Select
                  value={resolution}
                  onValueChange={(value) =>
                    setResolution(value as VeoResolution)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Select resolution")} />
                  </SelectTrigger>
                  <SelectContent>
                    {veoResolutions.map((res) => (
                      <SelectItem key={res} value={res}>
                        {res}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {resolution === "1080p" && (
                  <p className="text-xs text-muted-foreground">
                    {t("1080p output requires 8s duration.")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("Duration")}</Label>
                <Select
                  value={String(effectiveDuration)}
                  onValueChange={(value) => {
                    const parsed = Number(value);
                    if (Number.isNaN(parsed)) {
                      return;
                    }
                    setDurationSeconds(parsed as VeoDurationSeconds);
                  }}
                  disabled={resolution === "1080p"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Select duration")} />
                  </SelectTrigger>
                  <SelectContent>
                    {veoDurations.map((duration) => (
                      <SelectItem
                        key={duration}
                        value={String(duration)}
                        disabled={resolution === "1080p" && duration !== 8}
                      >
                        {duration}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="veo-seed">{t("Seed (optional)")}</Label>
                <Input
                  id="veo-seed"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder={t("e.g. 42")}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veo-image">{t("Image (optional)")}</Label>
                <Input
                  ref={fileInputRef}
                  id="veo-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {image && (
                  <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{image.name}</span>
                      <span className="text-muted-foreground">
                        {(image.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearImage}
                    >
                      {t("Remove")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {image?.previewUrl && (
              <div className="space-y-2">
                <Label>{t("Input preview")}</Label>
                <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                  {/* biome-ignore lint/performance/noImgElement: preview URLs can be blob/data. */}
                  <img
                    src={image.previewUrl}
                    alt={t("Input preview")}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
