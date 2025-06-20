-- Create chat_streams table for resumable stream tracking
CREATE TABLE IF NOT EXISTS public.chat_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL,
    stream_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_streams_chat_id ON public.chat_streams(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_streams_stream_id ON public.chat_streams(stream_id);
CREATE INDEX IF NOT EXISTS idx_chat_streams_created_at ON public.chat_streams(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (commented out until chat_sessions table exists)
-- CREATE POLICY "Users can read their own chat streams" ON public.chat_streams
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.chat_sessions cs 
--             WHERE cs.id = chat_streams.chat_id 
--             AND cs.user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Users can insert their own chat streams" ON public.chat_streams
--     FOR INSERT WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM public.chat_sessions cs 
--             WHERE cs.id = chat_streams.chat_id 
--             AND cs.user_id = auth.uid()
--         )
--     );

-- Add comments for documentation
COMMENT ON TABLE public.chat_streams IS 'Tracks resumable stream IDs for chat sessions';
COMMENT ON COLUMN public.chat_streams.chat_id IS 'References the chat session ID (UUID)';
COMMENT ON COLUMN public.chat_streams.stream_id IS 'Unique identifier for the resumable stream';
COMMENT ON COLUMN public.chat_streams.created_at IS 'When the stream was created';
COMMENT ON COLUMN public.chat_streams.updated_at IS 'When the record was last updated';