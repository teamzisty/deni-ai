-- Optimized indexes for uses table performance
-- Run these commands in Supabase SQL Editor for better query performance

-- Composite index for the most common query pattern (user_id + date)
CREATE INDEX IF NOT EXISTS idx_uses_user_date 
ON uses (user_id, date);

-- Composite index for user_id + model + date (for specific model queries)
CREATE INDEX IF NOT EXISTS idx_uses_user_model_date 
ON uses (user_id, model, date);

-- Index on date for cleanup and analytics queries
CREATE INDEX IF NOT EXISTS idx_uses_date 
ON uses (date);
