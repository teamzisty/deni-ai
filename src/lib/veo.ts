export const veoModelValues = [
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
] as const;

export type VeoModel = (typeof veoModelValues)[number];

export const veoModels = [
  {
    value: "veo-3.1-generate-preview",
    label: "Veo 3.1",
    description: "Highest quality output.",
  },
  {
    value: "veo-3.1-fast-generate-preview",
    label: "Veo 3.1 Fast",
    description: "Lower latency output.",
  },
] as const satisfies Array<{
  value: VeoModel;
  label: string;
  description: string;
}>;

export const veoAspectRatios = ["16:9", "9:16"] as const;
export type VeoAspectRatio = (typeof veoAspectRatios)[number];

export const veoResolutions = ["720p", "1080p"] as const;
export type VeoResolution = (typeof veoResolutions)[number];

export const veoDurations = [4, 6, 8] as const;
export type VeoDurationSeconds = (typeof veoDurations)[number];
