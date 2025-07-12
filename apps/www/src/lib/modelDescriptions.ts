import { models } from "./constants";

export type reasoningEffortType = "disabled" | "low" | "medium" | "high";

export type modelDescriptionType = typeof models;

export const modelDescriptions = models;