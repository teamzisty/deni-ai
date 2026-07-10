import type { VeoAspectRatio, VeoDurationSeconds, VeoModel, VeoResolution } from "@/lib/veo";

export type GenerationStatus = "idle" | "submitting" | "polling" | "done" | "error";

export type ImagePayload = {
  imageBytes: string;
  mimeType: string;
  previewUrl: string;
  name: string;
  size: number;
};

export type SubmittedSettings = {
  model: VeoModel;
  aspectRatio: VeoAspectRatio;
  resolution: VeoResolution;
  durationSeconds: VeoDurationSeconds;
  seed: string | null;
};

export type ModelOption = {
  value: string;
  label: string;
  description: string;
};

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const POLL_INTERVAL_MS = 5000;
export const MAX_POLL_ATTEMPTS = 90;
