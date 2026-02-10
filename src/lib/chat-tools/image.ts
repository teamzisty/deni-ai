import { tool } from "ai";
import { env } from "@/env";
import { imageModelValues } from "@/lib/image";
import { extractVeoErrorMessage } from "./helpers";
import { imageToolInputSchema } from "./types";

async function generateImageWithGemini(
  prompt: string,
  model: string,
  aspectRatio: string,
  resolution: string,
  numberOfImages: number,
  signal?: AbortSignal,
): Promise<Array<{ imageBytes: string; mimeType: string }>> {
  const contents = [{ parts: [{ text: prompt }] }];

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["IMAGE"],
    numberOfImages,
  };

  if (aspectRatio) {
    generationConfig.aspectRatio = aspectRatio;
  }

  if (resolution) {
    generationConfig.resolution = resolution;
  }

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
        generationConfig,
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
    throw new Error(extractVeoErrorMessage(responseData, "Failed to generate image."));
  }

  const candidates =
    typeof responseData === "object" &&
    responseData !== null &&
    (
      responseData as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: { data?: string; mimeType?: string };
            }>;
          };
        }>;
      }
    ).candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("No image candidates returned.");
  }

  const images: Array<{ imageBytes: string; mimeType: string }> = [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        images.push({
          imageBytes: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? "image/png",
        });
      }
    }
  }

  if (images.length === 0) {
    throw new Error("No images generated.");
  }

  return images;
}

export function createImageTool() {
  return tool({
    description:
      "Generate images with Nano Banana Pro (Gemini 3 Pro Image). Provide a vivid visual prompt and optional settings.",
    inputSchema: imageToolInputSchema,
    execute: async (
      { prompt, model: requestedModel, aspectRatio, resolution, numberOfImages },
      { abortSignal },
    ) => {
      const model = requestedModel ?? imageModelValues[0];
      const finalAspectRatio = aspectRatio ?? "1:1";
      const finalResolution = resolution ?? "1K";
      const finalNumberOfImages = numberOfImages ?? 1;

      const generatedImages = await generateImageWithGemini(
        prompt,
        model,
        finalAspectRatio,
        finalResolution,
        finalNumberOfImages,
        abortSignal,
      );

      const imageUrls = generatedImages.map(
        (img, idx) =>
          `/api/image/file?data=${encodeURIComponent(img.imageBytes)}&mimeType=${encodeURIComponent(img.mimeType)}&index=${idx}`,
      );
      const modelLabel = "Nano Banana Pro";

      return {
        imageUrls,
        model,
        modelLabel,
        aspectRatio: finalAspectRatio,
        resolution: finalResolution,
        numberOfImages: finalNumberOfImages,
      };
    },
  });
}
