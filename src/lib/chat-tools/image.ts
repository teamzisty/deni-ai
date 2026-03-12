import { tool } from "ai";
import { env } from "@/env";
import {
  buildGeminiImageGenerationConfig,
  extractGeminiImageErrorMessage,
  extractGeneratedImages,
} from "@/lib/gemini-image";
import {
  buildImagenImageGenerationParams,
  extractImagenErrorMessage,
  extractImagenGeneratedImages,
} from "@/lib/imagen-image";
import {
  imageAspectRatios,
  imageModelValues,
  imageResolutions,
  type ImageModel,
  isImagenImageModel,
  resolveImageModelLabel,
  supportsImageHighResolution,
} from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import { imageToolInputSchema } from "./types";

function buildGenerationConfig(
  model: ImageModel,
  aspectRatio?: (typeof imageAspectRatios)[number],
  resolution?: (typeof imageResolutions)[number],
) {
  return buildGeminiImageGenerationConfig(model, aspectRatio, resolution);
}

async function generateImageWithGemini(
  prompt: string,
  model: ImageModel,
  aspectRatio: (typeof imageAspectRatios)[number],
  resolution: (typeof imageResolutions)[number],
  numberOfImages: number,
  signal?: AbortSignal,
): Promise<Array<{ imageBytes: string; mimeType: string }>> {
  if (isImagenImageModel(model)) {
    const effectiveResolution = supportsImageHighResolution(model) ? resolution : undefined;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: buildImagenImageGenerationParams(
            aspectRatio,
            effectiveResolution,
            numberOfImages,
          ),
        }),
        signal,
      },
    );

    let responseData: unknown = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(extractImagenErrorMessage(responseData, "Failed to generate image."));
    }

    const images = extractImagenGeneratedImages(responseData);
    if (images.length === 0) {
      throw new Error(extractImagenErrorMessage(responseData, "No images generated."));
    }

    return images;
  }

  const contents = [{ parts: [{ text: prompt }] }];
  const images: Array<{ imageBytes: string; mimeType: string }> = [];
  const generationConfig = buildGenerationConfig(model, aspectRatio, resolution);

  for (let index = 0; index < numberOfImages; index += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          ...(generationConfig ? { generationConfig } : {}),
        }),
        signal,
      },
    );

    let responseData: unknown = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(extractGeminiImageErrorMessage(responseData, "Failed to generate image."));
    }

    const nextImages = extractGeneratedImages(responseData);
    if (nextImages.length === 0) {
      throw new Error(extractGeminiImageErrorMessage(responseData, "No images generated."));
    }

    images.push(...nextImages);
  }

  if (images.length === 0) {
    throw new Error("No images generated.");
  }

  return images;
}

export function createImageTool() {
  return tool({
    description:
      "Generate images with Nano Banana, Nano Banana 2, Nano Banana Pro, or Imagen 4 Fast. Provide a vivid visual prompt and optional settings.",
    inputSchema: imageToolInputSchema,
    execute: async (
      { prompt, model: requestedModel, aspectRatio, resolution, numberOfImages },
      { abortSignal },
    ) => {
      const model = requestedModel ?? imageModelValues[0];
      const finalAspectRatio = aspectRatio ?? "1:1";
      const finalResolution = resolution ?? "1K";
      const effectiveResolution = supportsImageHighResolution(model) ? finalResolution : "1K";
      const finalNumberOfImages = numberOfImages ?? 1;

      const generatedImages = await generateImageWithGemini(
        prompt,
        model,
        finalAspectRatio,
        finalResolution,
        finalNumberOfImages,
        abortSignal,
      );

      const imageUrls = await Promise.all(
        generatedImages.map(async (img, idx) => {
          const uploaded = await uploadImage(img.imageBytes, img.mimeType);
          if (uploaded) return uploaded;
          // Fallback to base64 proxy URL when UploadThing is not configured
          return `/api/image/file?data=${encodeURIComponent(img.imageBytes)}&mimeType=${encodeURIComponent(img.mimeType)}&index=${idx}`;
        }),
      );
      const modelLabel = resolveImageModelLabel(model);

      return {
        imageUrls,
        model,
        modelLabel,
        aspectRatio: finalAspectRatio,
        resolution: effectiveResolution,
        numberOfImages: finalNumberOfImages,
      };
    },
  });
}
