import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGateway, generateImage } from "ai";
import { env } from "@/env";
import {
  type ImageModel,
  isImagenImageModel,
  supportsImageHighResolution,
  type ImageAspectRatio,
  type ImageResolution,
} from "@/lib/image";

export type GeneratedImage = {
  imageBytes: string;
  mimeType: string;
};

const gateway = env.AI_GATEWAY_API_KEY
  ? createGateway({
      apiKey: env.AI_GATEWAY_API_KEY,
    })
  : null;

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function toGeneratedImages(images: Array<{ base64: string; mediaType: string }>): GeneratedImage[] {
  return images.map((image) => ({
    imageBytes: image.base64,
    mimeType: image.mediaType,
  }));
}

function buildGeminiProviderOptions(
  model: ImageModel,
  aspectRatio?: ImageAspectRatio,
  resolution?: ImageResolution,
  userId?: string,
) {
  const imageConfig = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...(resolution && supportsImageHighResolution(model) ? { imageSize: resolution } : {}),
  };

  return {
    ...(gateway
      ? {
          gateway: {
            only: ["google"],
            tags: ["image"],
            ...(userId ? { user: userId } : {}),
          },
        }
      : {}),
    google: Object.keys(imageConfig).length > 0 ? { imageConfig } : {},
  };
}

export async function generateImages({
  prompt,
  model,
  aspectRatio,
  resolution,
  numberOfImages = 1,
  userId,
  signal,
}: {
  prompt: string;
  model: ImageModel;
  aspectRatio?: ImageAspectRatio;
  resolution?: ImageResolution;
  numberOfImages?: number;
  userId?: string;
  signal?: AbortSignal;
}): Promise<GeneratedImage[]> {
  if (isImagenImageModel(model)) {
    const result = await generateImage({
      model: google.image(model),
      prompt,
      n: numberOfImages,
      ...(aspectRatio ? { aspectRatio } : {}),
      abortSignal: signal,
    });

    return toGeneratedImages(result.images);
  }

  const providerOptions = buildGeminiProviderOptions(model, aspectRatio, resolution, userId);
  const geminiModel = gateway ? gateway.image(`google/${model}`) : google.image(model);
  const images: GeneratedImage[] = [];

  for (let index = 0; index < numberOfImages; index += 1) {
    const result = await generateImage({
      model: geminiModel,
      prompt,
      ...(aspectRatio ? { aspectRatio } : {}),
      providerOptions,
      abortSignal: signal,
    });

    images.push(...toGeneratedImages(result.images));
  }

  return images;
}
