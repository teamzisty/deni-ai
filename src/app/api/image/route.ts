import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { imageAspectRatios, imageModelValues, imageResolutions } from "@/lib/image";
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

function extractErrorMessage(responseData: unknown, fallback: string): string {
  if (typeof responseData === "object" && responseData !== null) {
    const message = (responseData as { error?: { message?: string } }).error?.message;
    return message || fallback;
  }
  return fallback;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.session.userId;

  const rateCheck = checkRateLimit({ key: `image:${userId}`, windowMs: 60_000, maxRequests: 10 });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  try {
    await consumeUsage({ userId, category: "premium" });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
    }
    return NextResponse.json({ error: "Unable to check usage" }, { status: 500 });
  }

  const body = await req.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = parsedBody.data;

  const contents = [{ parts: [{ text: data.prompt }] }];

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["IMAGE"],
    numberOfImages: data.numberOfImages ?? 1,
  };

  if (data.aspectRatio) {
    generationConfig.aspectRatio = data.aspectRatio;
  }

  if (data.resolution) {
    generationConfig.resolution = data.resolution;
  }

  const response = await fetch(`${GEMINI_BASE_URL}/models/${data.model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    body: JSON.stringify({
      contents,
      generationConfig,
    }),
  });

  let responseData: unknown = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(responseData, "Failed to generate image.");
    return NextResponse.json({ error: errorMessage }, { status: response.status });
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
    return NextResponse.json({ error: "No image candidates returned." }, { status: 500 });
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
    return NextResponse.json({ error: "No images generated." }, { status: 500 });
  }

  return NextResponse.json({ images });
}
