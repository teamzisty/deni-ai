import { imageAspectRatios, type ImageModel, imageResolutions } from "@/lib/image";

type GeminiImageCandidate = {
  content?: {
    parts?: Array<{
      inlineData?: { data?: string; mimeType?: string };
      text?: string;
    }>;
  };
  finishReason?: string;
};

type GeminiImageResponse = {
  error?: { message?: string };
  candidates?: GeminiImageCandidate[];
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
};

export type GeneratedImage = {
  imageBytes: string;
  mimeType: string;
};

export function buildGeminiImageGenerationConfig(
  model: ImageModel,
  aspectRatio?: (typeof imageAspectRatios)[number],
  resolution?: (typeof imageResolutions)[number],
) {
  const imageConfig: Record<string, unknown> = {};

  if (aspectRatio) {
    imageConfig.aspectRatio = aspectRatio;
  }

  if (resolution && model !== "gemini-2.5-flash-image") {
    imageConfig.imageSize = resolution;
  }

  return {
    responseModalities: ["IMAGE"],
    ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {}),
  };
}

export function extractGeneratedImages(responseData: unknown): GeneratedImage[] {
  const candidates =
    typeof responseData === "object" && responseData !== null
      ? (responseData as GeminiImageResponse).candidates
      : undefined;

  if (!candidates?.length) {
    return [];
  }

  const images: GeneratedImage[] = [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (!part.inlineData?.data) {
        continue;
      }

      images.push({
        imageBytes: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      });
    }
  }

  return images;
}

export function extractGeminiImageErrorMessage(responseData: unknown, fallback: string): string {
  if (typeof responseData !== "object" || responseData === null) {
    return fallback;
  }

  const data = responseData as GeminiImageResponse;
  if (data.error?.message) {
    return data.error.message;
  }

  if (data.promptFeedback?.blockReasonMessage) {
    return data.promptFeedback.blockReasonMessage;
  }

  if (data.promptFeedback?.blockReason) {
    return `Image generation was blocked: ${data.promptFeedback.blockReason}.`;
  }

  const finishReason = data.candidates?.find((candidate) => candidate.finishReason)?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    return `Image generation finished without an image (${finishReason}).`;
  }

  const responseText = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join(" ")
    .trim();

  if (responseText) {
    return responseText;
  }

  return fallback;
}
