import { z } from "zod";

export const settingsSchema = z.object({
  advancedSearch: z.boolean(),
  autoScroll: z.boolean(),
  privacyMode: z.boolean(),
  hubs: z.boolean(),
  bots: z.boolean(),
  branch: z.boolean(),
  conversationsPrivacyMode: z.boolean(),
  enableLegacyModels: z.boolean(),
  modelVisibility: z.record(z.string(), z.boolean()).optional(),
  colorTheme: z.string().optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  advancedSearch: false,
  autoScroll: true,
  privacyMode: false,
  bots: true,
  hubs: true,
  branch: true,
  conversationsPrivacyMode: false,
  enableLegacyModels: false,
  colorTheme: "blue",
};