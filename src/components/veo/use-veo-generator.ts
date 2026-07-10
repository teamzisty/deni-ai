"use client";

import { useExtracted } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  type VeoAspectRatio,
  type VeoDurationSeconds,
  type VeoModel,
  type VeoResolution,
  veoModels,
} from "@/lib/veo";
import {
  type GenerationStatus,
  type ImagePayload,
  MAX_IMAGE_BYTES,
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  type SubmittedSettings,
} from "./veo-types";

export function useVeoGenerator() {
  const t = useExtracted();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [submittedNegativePrompt, setSubmittedNegativePrompt] = useState<string | null>(null);
  const [submittedImage, setSubmittedImage] = useState<ImagePayload | null>(null);
  const [submittedSettings, setSubmittedSettings] = useState<SubmittedSettings | null>(null);
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

  const effectiveDuration = resolution === "1080p" ? 8 : durationSeconds;

  const modelOptions = [
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
  ];

  const isBusy = status === "submitting" || status === "polling";

  // 1080p only supports 8s — adjust during render instead of an effect.
  if (resolution === "1080p" && durationSeconds !== 8) {
    setDurationSeconds(8);
  }

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

  const pollOperation = async (token: string) => {
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    setStatus("polling");

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (controller.signal.aborted) {
        return;
      }

      const response = await fetch(`/api/veo?token=${encodeURIComponent(token)}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        done?: boolean;
        videoUrl?: string | null;
        error?: string | null;
      };

      if (!response.ok) {
        throw new Error(data?.error || t("Failed to check video status."));
      }

      if (data.done) {
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.videoUrl) {
          throw new Error(t("Video generation finished without a file."));
        }

        setVideoUrl(data.videoUrl);
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
          image: image ? { imageBytes: image.imageBytes, mimeType: image.mimeType } : undefined,
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as {
        operationName?: string;
        operationToken?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(data?.error || t("Video generation failed."));
        return;
      }

      if (!data.operationName || !data.operationToken) {
        setStatus("error");
        setError(t("Missing operation token in response."));
        return;
      }

      setOperationName(data.operationName);
      await pollOperation(data.operationToken);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : t("Unexpected error."));
    }
  };

  const statusLabel = (() => {
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
  })();

  const statusVariant =
    status === "error"
      ? ("destructive" as const)
      : status === "done"
        ? ("secondary" as const)
        : isBusy
          ? ("default" as const)
          : ("outline" as const);

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

  return {
    t,
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    submittedPrompt,
    submittedNegativePrompt,
    submittedImage,
    model,
    setModel,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    setDurationSeconds,
    seed,
    setSeed,
    image,
    status,
    error,
    operationName,
    videoUrl,
    fileInputRef,
    effectiveDuration,
    modelOptions,
    isBusy,
    statusLabel,
    statusVariant,
    settingsSnapshot,
    modelLabel,
    handleImageChange,
    handleClearImage,
    handleCancel,
    handleGenerate,
  };
}
