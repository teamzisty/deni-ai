-- Create chat_streams table for resumable streams
CREATE TABLE IF NOT EXISTS chat_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  stream_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for faster lookups
  INDEX idx_chat_streams_chat_id (chat_id),
  INDEX idx_chat_streams_stream_id (stream_id),
  INDEX idx_chat_streams_created_at (created_at)
);

-- Add RLS (Row Level Security) if needed
ALTER TABLE chat_streams ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access their own streams
-- Note: This assumes chat_id maps to session IDs that belong to users
-- You may need to adjust this based on your authentication setup
CREATE POLICY "Users can access their own chat streams" ON chat_streams
  FOR ALL USING (
    -- Add appropriate user check here based on your auth setup
    -- For now, allowing all authenticated users
    auth.role() = 'authenticated'
  );
