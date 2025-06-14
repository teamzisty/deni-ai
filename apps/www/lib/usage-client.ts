import { modelDescriptions } from "@/lib/modelDescriptions";

export interface UsageLimit {
  model: string;
  displayName: string;
  limit: number;
  isPremium: boolean;
}

export interface UsageInfo {
  model: string;
  displayName: string;
  count: number;
  limit: number;
  isPremium: boolean;
  canUse: boolean;
  remaining: number;
}

// Premium models configuration
const PREMIUM_LIMIT = 30;

// Define which models are considered premium based on their characteristics
function isPremiumModel(modelKey: string): boolean {
  const model = modelDescriptions[modelKey];
  if (!model) return false;

  return model.isPremium || false;
}

// Generate model limits configuration from modelDescriptions
export const MODEL_LIMITS: Record<string, UsageLimit> = Object.entries(modelDescriptions).reduce((acc, [modelKey, modelData]) => {
  const premium = isPremiumModel(modelKey);
  acc[modelKey] = {
    model: modelKey,
    displayName: modelData.displayName,
    limit: premium ? PREMIUM_LIMIT : -1, // -1 means unlimited
    isPremium: premium,
  };
  return acc;
}, {} as Record<string, UsageLimit>);

/**
 * Get display name for a model (client-side safe)
 */
export function getModelDisplayName(model: string): string {
  const config = MODEL_LIMITS[model];
  return config?.displayName || model;
}

/**
 * Check if a model is premium (client-side safe)
 */
export function isModelPremium(model: string): boolean {
  const config = MODEL_LIMITS[model];
  return config?.isPremium || false;
}
