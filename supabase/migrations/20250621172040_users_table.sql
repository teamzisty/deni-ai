-- Drop the existing enum type if it exists
DROP TYPE IF EXISTS subscription_plan CASCADE;

-- Create the new enum type with updated values
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'max', 'team', 'enterprise');

-- Drop the existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

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

-- Create policy for service role to view all data
CREATE POLICY "User can view my profiles" ON users
    FOR SELECT USING (auth.uid() = id);

-- Create policy for service role to update all data
CREATE POLICY "User can update my profiles" ON users
    FOR UPDATE USING (auth.uid() = id);