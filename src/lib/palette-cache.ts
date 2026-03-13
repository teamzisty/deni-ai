import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { paletteImageCache, type CachedPaletteImage } from "@/db/schema";
import type { ImageAspectRatio, ImageModel, ImageResolution } from "@/lib/image";
import { sha256Hex } from "@/lib/hash";

type PaletteCacheInput = {
  prompt: string;
  model: ImageModel;
  aspectRatio?: ImageAspectRatio;
  resolution?: ImageResolution;
  numberOfImages: number;
};

async function buildPaletteCacheKey(input: PaletteCacheInput) {
  return sha256Hex(
    JSON.stringify({
      version: 1,
      prompt: input.prompt.trim(),
      model: input.model,
      aspectRatio: input.aspectRatio ?? null,
      resolution: input.resolution ?? null,
      numberOfImages: input.numberOfImages,
    }),
  );
}

export async function getCachedPaletteImages(input: PaletteCacheInput) {
  const cacheKey = await buildPaletteCacheKey(input);
  const [entry] = await db
    .select({ images: paletteImageCache.images })
    .from(paletteImageCache)
    .where(eq(paletteImageCache.cacheKey, cacheKey))
    .limit(1);

  return entry?.images ?? null;
}

export async function cachePaletteImages(input: PaletteCacheInput, images: CachedPaletteImage[]) {
  if (images.length === 0) {
    return;
  }

  const cacheKey = await buildPaletteCacheKey(input);

  await db
    .insert(paletteImageCache)
    .values({
      cacheKey,
      model: input.model,
      aspectRatio: input.aspectRatio ?? null,
      resolution: input.resolution ?? null,
      numberOfImages: input.numberOfImages,
      images,
    })
    .onConflictDoNothing({ target: paletteImageCache.cacheKey });
}
