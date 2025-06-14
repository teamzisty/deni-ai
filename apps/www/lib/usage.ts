import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MODEL_LIMITS, UsageInfo, UsageLimit } from "@/lib/usage-client";

// Re-export client-side functions and types
export { MODEL_LIMITS, getModelDisplayName, isModelPremium } from "@/lib/usage-client";
export type { UsageInfo, UsageLimit } from "@/lib/usage-client";

/**
 * Get current usage for a user and model for today
 */
export async function getCurrentUsage(userId: string, model: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('uses')
    .select('count')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }

  return data?.count || 0;
}

/**
 * Get usage information for all models for a user (optimized)
 */
export async function getAllUsage(userId: string, onlyUsedModels: boolean = false): Promise<UsageInfo[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Get all usage data for today in a single query
  const { data: usageData, error } = await supabase
    .from('uses')
    .select('model, count')
    .eq('user_id', userId)
    .eq('date', today);

  if (error) {
    throw error;
  }

  // Create a map for quick lookup
  const usageMap = new Map<string, number>();
  if (usageData) {
    for (const usage of usageData) {
      usageMap.set(usage.model, usage.count);
    }
  }
  // Generate results for all models or only used models
  const results: UsageInfo[] = [];
  const modelsToProcess = onlyUsedModels 
    ? Object.entries(MODEL_LIMITS).filter(([modelKey, config]) => usageMap.has(modelKey) || config.isPremium)
    : Object.entries(MODEL_LIMITS);
  for (const [modelKey, config] of modelsToProcess) {
    const currentCount = usageMap.get(modelKey) ?? 0;
    const canUse = config.limit === -1 || currentCount < config.limit;
    const remaining = config.limit === -1 ? -1 : Math.max(0, config.limit - currentCount);

    results.push({
      model: modelKey,
      displayName: config.displayName,
      count: currentCount,
      limit: config.limit,
      isPremium: config.isPremium,
      canUse,
      remaining,
    });
  }

  return results;
}

/**
 * Check if a user can use a specific model
 */
export async function canUseModel(userId: string, model: string): Promise<boolean> {
  const config = MODEL_LIMITS[model];
  
  // If model is not in the limits config, allow unlimited usage
  if (!config) {
    return true;
  }

  // If limit is -1, it means unlimited
  if (config.limit === -1) {
    return true;
  }

  const currentUsage = await getCurrentUsage(userId, model);
  return currentUsage < config.limit;
}

/**
 * Record usage for a model
 */
export async function recordUsage(userId: string, model: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Try to increment existing record first
  const { data: existingRecord } = await supabase
    .from('uses')
    .select('*')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();

  if (existingRecord) {
    // Update existing record
    const { error } = await supabase
      .from('uses')
      .update({ 
        count: existingRecord.count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRecord.id);

    if (error) {
      throw error;
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from('uses')
      .insert({
        user_id: userId,
        model,
        count: 1,
        date: today,
      });

    if (error) {
      throw error;
    }
  }
}

/**
 * Get usage statistics for a user (optimized)
 */
export async function getUsageStats(userId: string, days: number = 30): Promise<any[]> {
  const supabase = await createSupabaseServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('uses')
    .select('model, count, date')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .order('date', { ascending: false })
    .limit(100); // Limit results to prevent excessive data transfer

  if (error) {
    throw error;
  }

  return data || [];
}
