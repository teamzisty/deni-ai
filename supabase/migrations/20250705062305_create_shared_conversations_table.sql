-- Create shared_conversations table
CREATE TABLE IF NOT EXISTS public.shared_conversations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    session_type text CHECK (session_type IN ('chat', 'intellipulse')),
    title text NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb,
    view_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shared_conversations_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_conversations_user_id ON public.shared_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_expires_at ON public.shared_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_created_at ON public.shared_conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can insert their own shared conversations
CREATE POLICY "Users can insert own shared conversations"
    ON public.shared_conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own shared conversations
CREATE POLICY "Users can view own shared conversations"
    ON public.shared_conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Anyone can view non-expired shared conversations
CREATE POLICY "Anyone can view non-expired shared conversations"
    ON public.shared_conversations
    FOR SELECT
    TO anon, authenticated
    USING ((expires_at IS NULL OR expires_at > now()));

-- Users can update their own shared conversations
CREATE POLICY "Users can update own shared conversations"
    ON public.shared_conversations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own shared conversations
CREATE POLICY "Users can delete own shared conversations"
    ON public.shared_conversations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.shared_conversations TO authenticated;
GRANT SELECT ON public.shared_conversations TO anon;