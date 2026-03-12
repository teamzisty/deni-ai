import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/lib/auth";
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
  supportsImageHighResolution,
} from "@/lib/image";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeUsage, UsageLimitError } from "@/lib/usage";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.enum(imageModelValues),
  aspectRatio: z.enum(imageAspectRatios).optional(),
  resolution: z.enum(imageResolutions).optional(),
  numberOfImages: z.number().int().min(1).max(4).optional(),
});

class ImageGenerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function buildGenerationConfig(
  model: ImageModel,
  aspectRatio?: (typeof imageAspectRatios)[number],
  resolution?: (typeof imageResolutions)[number],
) {
  return buildGeminiImageGenerationConfig(model, aspectRatio, resolution);
}

async function generateSingleImage(
  prompt: string,
  model: ImageModel,
  aspectRatio?: (typeof imageAspectRatios)[number],
  resolution?: (typeof imageResolutions)[number],
  numberOfImages = 1,
): Promise<Array<{ imageBytes: string; mimeType: string }>> {
  if (isImagenImageModel(model)) {
    const effectiveResolution = supportsImageHighResolution(model) ? resolution : undefined;
    const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:predict`, {
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
    });

    let responseData: unknown = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      console.error("Image generation API error:", responseData);
      throw new ImageGenerationError(
        extractImagenErrorMessage(responseData, "Image generation failed."),
        response.status,
      );
    }

    const images = extractImagenGeneratedImages(responseData);
    if (images.length === 0) {
      throw new ImageGenerationError(
        extractImagenErrorMessage(responseData, "No images generated."),
        502,
      );
    }

    return images;
  }

  const contents = [{ parts: [{ text: prompt }] }];
  const generationConfig = buildGenerationConfig(model, aspectRatio, resolution);

  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    body: JSON.stringify({
      contents,
      ...(generationConfig ? { generationConfig } : {}),
    }),
  });

  let responseData: unknown = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    console.error("Image generation API error:", responseData);
    throw new ImageGenerationError(
      extractGeminiImageErrorMessage(responseData, "Image generation failed."),
      response.status,
    );
  }
  const images = extractGeneratedImages(responseData);

  if (images.length === 0) {
    throw new ImageGenerationError(
      extractGeminiImageErrorMessage(responseData, "No images generated."),
      502,
    );
  }

  return images;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.session.userId;

  const rateCheck = await checkRateLimit({
    key: `image:${userId}`,
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  const body = await req.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await consumeUsage({ userId, category: "premium" });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
    }
    return NextResponse.json({ error: "Unable to check usage" }, { status: 500 });
  }

  const data = parsedBody.data;
  const requestedCount = data.numberOfImages ?? 1;

  try {
    const generatedBatches = isImagenImageModel(data.model)
      ? [
          await generateSingleImage(
            data.prompt,
            data.model,
            data.aspectRatio,
            data.resolution,
            requestedCount,
          ),
        ]
      : await Promise.all(
          Array.from({ length: requestedCount }, () =>
            generateSingleImage(data.prompt, data.model, data.aspectRatio, data.resolution),
          ),
        );
    const images = generatedBatches.flat();

    if (images.length === 0) {
      return NextResponse.json({ error: "No images generated." }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Image generation API error:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
