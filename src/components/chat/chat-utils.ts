// Common types, type guards, and utility functions for chat interfaces

export type SearchResult = {
  title: string;
  url: string;
  description: string;
};

export type VideoToolOutput = {
  videoUrl: string;
  operationName?: string | null;
  model?: string | null;
  modelLabel?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  durationSeconds?: number | null;
  seed?: number | null;
  negativePrompt?: string | null;
};

export type ImageToolOutput = {
  imageUrls: string[];
  model?: string | null;
  modelLabel?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  numberOfImages?: number | null;
};

export const isSearchResultArray = (value: unknown): value is SearchResult[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      "title" in item &&
      "url" in item &&
      "description" in item,
  );

export const isVideoToolOutput = (value: unknown): value is VideoToolOutput => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as { videoUrl?: unknown }).videoUrl === "string";
};

export const isImageToolOutput = (value: unknown): value is ImageToolOutput => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return (
    Array.isArray((value as { imageUrls?: unknown }).imageUrls) &&
    (value as { imageUrls?: unknown[] }).imageUrls?.every((url) => typeof url === "string") === true
  );
};

export function resolveImageModelLabel(
  imageModel?: string | null,
  modelLabel?: string | null,
): string | null {
  if (modelLabel) {
    return modelLabel;
  }
  if (imageModel === "gemini-3-pro-image-preview") {
    return "Nano Banana Pro";
  }
  return imageModel ?? null;
}

export function resolveVeoModelLabel(
  veoModel?: string | null,
  modelLabel?: string | null,
  t?: (key: string) => string,
): string | null {
  if (modelLabel) {
    return modelLabel;
  }
  const label = t ?? ((k: string) => k);
  switch (veoModel) {
    case "veo-3.1-generate-preview":
      return label("Veo 3.1");
    case "veo-3.1-fast-generate-preview":
      return label("Veo 3.1 Fast");
    default:
      return veoModel ?? null;
  }
}
