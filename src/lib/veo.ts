export const veoModelValues = [
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
] as const;

export type VeoModel = (typeof veoModelValues)[number];

export const veoModels = [...veoModelValues] as const satisfies VeoModel[];

export const veoAspectRatios = ["16:9", "9:16"] as const;
export type VeoAspectRatio = (typeof veoAspectRatios)[number];

export const veoResolutions = ["720p", "1080p"] as const;
export type VeoResolution = (typeof veoResolutions)[number];

export const veoDurations = [4, 6, 8] as const;
export type VeoDurationSeconds = (typeof veoDurations)[number];
