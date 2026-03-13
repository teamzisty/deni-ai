export const imageModelValues = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "imagen-4.0-fast-generate-001",
] as const;

export type ImageModel = (typeof imageModelValues)[number];

export const imageModels = [...imageModelValues] as const satisfies ImageModel[];

export const imageAspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"] as const;
export type ImageAspectRatio = (typeof imageAspectRatios)[number];

export const imageResolutions = ["1K", "2K", "4K"] as const;
export type ImageResolution = (typeof imageResolutions)[number];

export function isImagenImageModel(model: ImageModel): model is "imagen-4.0-fast-generate-001" {
  return model === "imagen-4.0-fast-generate-001";
}

export function isGeminiImageModel(
  model: ImageModel,
): model is Exclude<ImageModel, "imagen-4.0-fast-generate-001"> {
  return !isImagenImageModel(model);
}

export function resolveImageModelLabel(model: ImageModel): string {
  switch (model) {
    case "gemini-2.5-flash-image":
      return "Nano Banana";
    case "gemini-3.1-flash-image-preview":
      return "Nano Banana 2";
    case "gemini-3-pro-image-preview":
      return "Nano Banana Pro";
    case "imagen-4.0-fast-generate-001":
      return "Imagen 4 Fast";
  }
}

export function resolveImageUsageCategory(model: ImageModel): "basic" | "premium" {
  switch (model) {
    case "gemini-3-pro-image-preview":
      return "premium";
    case "gemini-2.5-flash-image":
    case "gemini-3.1-flash-image-preview":
    case "imagen-4.0-fast-generate-001":
      return "basic";
  }
}

export function supportsImageHighResolution(model: ImageModel): boolean {
  return model === "gemini-3.1-flash-image-preview" || model === "gemini-3-pro-image-preview";
}
