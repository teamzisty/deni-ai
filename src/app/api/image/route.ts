import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateImages } from "@/lib/image-generation";
import {
  imageAspectRatios,
  imageModelValues,
  imageResolutions,
  resolveImageUsageCategory,
} from "@/lib/image";
import { cachePaletteImages, getCachedPaletteImages } from "@/lib/palette-cache";
import { parseJsonRequest } from "@/lib/json-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeUsage, refundUsage, UsageLimitError } from "@/lib/usage";

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.enum(imageModelValues),
  aspectRatio: z.enum(imageAspectRatios).optional(),
  resolution: z.enum(imageResolutions).optional(),
  numberOfImages: z.number().int().min(1).max(4).optional(),
  bypassCache: z.boolean().optional(),
});

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

  const parsedRequest = await parseJsonRequest(req);
  if (!parsedRequest.ok) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsedBody = requestSchema.safeParse(parsedRequest.body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = parsedBody.data;
  const requestedCount = data.numberOfImages ?? 1;
  const usageCategory = resolveImageUsageCategory(data.model);
  const bypassCache = data.bypassCache ?? false;
  const cacheInput = {
    userId,
    prompt: data.prompt,
    model: data.model,
    aspectRatio: data.aspectRatio,
    resolution: data.resolution,
    numberOfImages: requestedCount,
  };

  try {
    await consumeUsage({ userId, category: usageCategory, amount: requestedCount });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
    }
    return NextResponse.json({ error: "Unable to check usage" }, { status: 500 });
  }

  if (!bypassCache) {
    try {
      const cachedImages = await getCachedPaletteImages(cacheInput);
      if (cachedImages) {
        return NextResponse.json({ images: cachedImages });
      }
    } catch (error) {
      console.error("Palette cache lookup failed:", error);
    }
  }

  try {
    const images = await generateImages({
      prompt: data.prompt,
      model: data.model,
      aspectRatio: data.aspectRatio,
      resolution: data.resolution,
      numberOfImages: requestedCount,
      signal: req.signal,
    });

    if (images.length === 0) {
      await refundUsage({ userId, category: usageCategory, amount: requestedCount });
      return NextResponse.json({ error: "No images generated." }, { status: 500 });
    }

    if (!bypassCache) {
      try {
        await cachePaletteImages(cacheInput, images);
      } catch (error) {
        console.error("Palette cache write failed:", error);
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    await refundUsage({ userId, category: usageCategory, amount: requestedCount });
    console.error("Image generation API error:", error);
    const message = error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
