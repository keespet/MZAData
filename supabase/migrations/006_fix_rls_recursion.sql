-- Fix RLS infinite recursion on profiles table
-- The problem: policies that query profiles to check admin role cause recursion

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication trigger" ON profiles;
DROP POLICY IF EXISTS "Gebruikers kunnen eigen profiel zien" ON profiles;
DROP POLICY IF EXISTS "Admins kunnen alle profielen zien" ON profiles;
DROP POLICY IF EXISTS "Admins kunnen profielen aanpassen" ON profiles;
DROP POLICY IF EXISTS "Service role kan profielen aanmaken" ON profiles;

-- Simple policy: authenticated users can read their own profile
-- This is all that's needed for login to work
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow inserts (for trigger and service role)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow updates on own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- For admin access to all profiles, we'll handle that in the application
-- using the service role client, which bypasses RLS
