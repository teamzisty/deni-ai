import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeUsage, UsageLimitError } from "@/lib/usage";
import { veoAspectRatios, veoDurations, veoModelValues, veoResolutions } from "@/lib/veo";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.enum(veoModelValues),
  negativePrompt: z.string().max(2000).optional(),
  aspectRatio: z.enum(veoAspectRatios).optional(),
  resolution: z.enum(veoResolutions).optional(),
  durationSeconds: z
    .number()
    .int()
    .refine((value) => veoDurations.some((duration) => duration === value), {
      message: "Invalid duration",
    })
    .optional(),
  seed: z.number().int().min(0).max(2_147_483_647).optional(),
  image: z
    .object({
      imageBytes: z.string().min(1),
      mimeType: z.string().min(1),
    })
    .optional(),
});

const operationNameSchema = z
  .string()
  .min(1)
  .max(512)
  .refine((value) => !/\s/.test(value), {
    message: "Invalid operation name.",
  });

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.session.userId;

  const rateCheck = checkRateLimit({ key: `veo:${userId}`, windowMs: 60_000, maxRequests: 5 });
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
  if (data.resolution === "1080p" && data.durationSeconds !== 8) {
    return NextResponse.json(
      { error: "1080p output requires 8 seconds duration." },
      { status: 400 },
    );
  }

  const instances: Record<string, unknown>[] = [
    {
      prompt: data.prompt,
      ...(data.image ? { image: data.image } : {}),
    },
  ];

  const parameters: Record<string, unknown> = {};
  if (data.negativePrompt) {
    parameters.negativePrompt = data.negativePrompt;
  }
  if (data.aspectRatio) {
    parameters.aspectRatio = data.aspectRatio;
  }
  if (data.resolution) {
    parameters.resolution = data.resolution;
  }
  if (data.durationSeconds) {
    parameters.durationSeconds = data.durationSeconds;
  }
  if (data.seed !== undefined) {
    parameters.seed = data.seed;
  }

  const payload = Object.keys(parameters).length > 0 ? { instances, parameters } : { instances };

  const response = await fetch(`${BASE_URL}/models/${data.model}:predictLongRunning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  let responseData: unknown = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const message =
      typeof responseData === "object" && responseData !== null
        ? (responseData as { error?: { message?: string } }).error?.message
        : undefined;
    return NextResponse.json(
      { error: message || "Failed to start video generation." },
      { status: response.status },
    );
  }

  const operationName =
    typeof responseData === "object" && responseData !== null
      ? (responseData as { name?: string }).name
      : undefined;

  if (!operationName) {
    return NextResponse.json({ error: "Missing operation name." }, { status: 500 });
  }

  return NextResponse.json({ operationName });
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const nameParam = searchParams.get("name");
  if (!nameParam) {
    return NextResponse.json({ error: "Missing operation name." }, { status: 400 });
  }

  const parsedName = operationNameSchema.safeParse(nameParam);
  if (!parsedName.success) {
    return NextResponse.json({ error: "Invalid operation name." }, { status: 400 });
  }

  const response = await fetch(`${BASE_URL}/${parsedName.data}`, {
    headers: {
      "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  });

  let responseData: unknown = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const message =
      typeof responseData === "object" && responseData !== null
        ? (responseData as { error?: { message?: string } }).error?.message
        : undefined;
    return NextResponse.json(
      { error: message || "Failed to check status." },
      { status: response.status },
    );
  }

  const done =
    typeof responseData === "object" && responseData !== null
      ? Boolean((responseData as { done?: boolean }).done)
      : false;
  const errorMessage =
    typeof responseData === "object" && responseData !== null
      ? (responseData as { error?: { message?: string } }).error?.message
      : null;
  const videoUri =
    typeof responseData === "object" && responseData !== null
      ? ((
          responseData as {
            response?: {
              generateVideoResponse?: {
                generatedSamples?: Array<{ video?: { uri?: string } }>;
              };
            };
          }
        ).response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? null)
      : null;

  return NextResponse.json({ done, error: errorMessage, videoUri });
}
