-- Migration script for Intellipulse Action Keys table
-- Run this SQL in your Supabase SQL Editor or via CLI

-- Create the intellipulse_action_keys table
CREATE TABLE IF NOT EXISTS intellipulse_action_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  key_value VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intellipulse_action_keys_user_id ON intellipulse_action_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_intellipulse_action_keys_key_value ON intellipulse_action_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_intellipulse_action_keys_is_active ON intellipulse_action_keys(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_intellipulse_action_keys_updated_at ON intellipulse_action_keys;
CREATE TRIGGER update_intellipulse_action_keys_updated_at
  BEFORE UPDATE ON intellipulse_action_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE intellipulse_action_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own action keys" ON intellipulse_action_keys;
DROP POLICY IF EXISTS "Users can insert their own action keys" ON intellipulse_action_keys;
DROP POLICY IF EXISTS "Users can update their own action keys" ON intellipulse_action_keys;
DROP POLICY IF EXISTS "Users can delete their own action keys" ON intellipulse_action_keys;

-- Create policies for RLS
CREATE POLICY "Users can view their own action keys" 
  ON intellipulse_action_keys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action keys" 
  ON intellipulse_action_keys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action keys" 
  ON intellipulse_action_keys FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action keys" 
  ON intellipulse_action_keys FOR DELETE 
  USING (auth.uid() = user_id);
