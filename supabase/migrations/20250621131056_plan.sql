-- Create enum for subscription plans
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create user table with plan
CREATE TABLE users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, --- user id
    plan subscription_plan NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to view all data
CREATE POLICY "Service role can view all profiles" ON users
    FOR SELECT USING (auth.role() = 'service_role');

-- Create policy for service role to update all data
CREATE POLICY "Service role can update all profiles" ON users
    FOR UPDATE USING (auth.role() = 'service_role');