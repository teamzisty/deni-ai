-- Drop the existing enum type if it exists
DROP TYPE IF EXISTS subscription_plan CASCADE;

-- Create the new enum type with updated values
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'max', 'team', 'enterprise');