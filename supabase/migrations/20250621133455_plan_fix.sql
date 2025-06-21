

-- Drop policy for service role to view all data
DROP POLICY "Service role can view all profiles" ON users;

-- Drop policy for service role to update all data
DROP POLICY "Service role can update all profiles" ON users;

-- Create policy for service role to view all data
CREATE POLICY "User can view my profiles" ON users
    FOR SELECT USING (auth.uid() = id);

-- Create policy for service role to update all data
CREATE POLICY "User can update my profiles" ON users
    FOR UPDATE USING (auth.uid() = id);