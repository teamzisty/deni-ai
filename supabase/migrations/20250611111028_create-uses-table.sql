-- Migration script for uses table
-- Run this SQL in your Supabase SQL Editor or via CLI

-- Create the uses table
CREATE TABLE IF NOT EXISTS "public"."uses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "model" TEXT NOT NULL,
  "count" INTEGER DEFAULT 1,
  "date" DATE DEFAULT CURRENT_DATE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "uses_user_model_date_unique" UNIQUE ("user_id", "model", "date")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_uses_user_id" ON "public"."uses" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_uses_date" ON "public"."uses" USING btree ("date");
CREATE INDEX IF NOT EXISTS "idx_uses_model" ON "public"."uses" USING btree ("model");

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER "update_uses_updated_at" 
  BEFORE UPDATE ON "public"."uses" 
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable RLS (Row Level Security)
ALTER TABLE "public"."uses" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own uses" ON "public"."uses" 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uses" ON "public"."uses" 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own uses" ON "public"."uses" 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE "public"."uses" TO "anon";
GRANT ALL ON TABLE "public"."uses" TO "authenticated";
GRANT ALL ON TABLE "public"."uses" TO "service_role";
