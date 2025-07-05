-- Add conversations column to hubs table to support drag and drop functionality
ALTER TABLE "public"."hubs" 
ADD COLUMN "conversations" jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN "public"."hubs"."conversations" IS 'Array of conversation IDs that belong to this hub';