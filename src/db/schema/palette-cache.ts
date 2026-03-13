import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ImageAspectRatio, ImageModel, ImageResolution } from "@/lib/image";

export type CachedPaletteImage = {
  imageBytes: string;
  mimeType: string;
};

export const paletteImageCache = pgTable(
  "palette_image_cache",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    cacheKey: text("cache_key").notNull(),
    model: text("model").$type<ImageModel>().notNull(),
    aspectRatio: text("aspect_ratio").$type<ImageAspectRatio | null>(),
    resolution: text("resolution").$type<ImageResolution | null>(),
    numberOfImages: integer("number_of_images").notNull(),
    images: jsonb("images").$type<CachedPaletteImage[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("palette_image_cache_key_idx").on(table.cacheKey),
    index("palette_image_cache_model_idx").on(table.model),
  ],
);
