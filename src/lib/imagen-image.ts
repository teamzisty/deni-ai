import { imageAspectRatios, imageResolutions } from "@/lib/image";

type ImagenPrediction = {
  bytesBase64Encoded?: string;
  mimeType?: string;
};

type ImagenResponse = {
  error?: { message?: string };
  predictions?: ImagenPrediction[];
};

export type GeneratedImage = {
  imageBytes: string;
  mimeType: string;
};

export function buildImagenImageGenerationParams(
  aspectRatio?: (typeof imageAspectRatios)[number],
  resolution?: (typeof imageResolutions)[number],
  numberOfImages = 1,
) {
  return {
    sampleCount: numberOfImages,
    ...(aspectRatio ? { aspectRatio } : {}),
    ...(resolution ? { imageSize: resolution } : {}),
  };
}

export function extractImagenGeneratedImages(responseData: unknown): GeneratedImage[] {
  const predictions =
    typeof responseData === "object" && responseData !== null
      ? (responseData as ImagenResponse).predictions
      : undefined;

  if (!predictions?.length) {
    return [];
  }

  return predictions
    .filter((prediction) => Boolean(prediction.bytesBase64Encoded))
    .map((prediction) => ({
      imageBytes: prediction.bytesBase64Encoded!,
      mimeType: prediction.mimeType ?? "image/png",
    }));
}

export function extractImagenErrorMessage(responseData: unknown, fallback: string): string {
  if (typeof responseData !== "object" || responseData === null) {
    return fallback;
  }

  const message = (responseData as ImagenResponse).error?.message;
  return message || fallback;
}
