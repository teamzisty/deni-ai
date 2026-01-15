export const imageModelValues = [
  "gemini-3-pro-image-preview",
] as const;

export type ImageModel = (typeof imageModelValues)[number];

export const imageModels = [...imageModelValues] as const satisfies ImageModel[];

export const imageAspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"] as const;
export type ImageAspectRatio = (typeof imageAspectRatios)[number];

export const imageResolutions = ["1K", "2K", "4K"] as const;
export type ImageResolution = (typeof imageResolutions)[number];
