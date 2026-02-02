-- Fix: Allow the trigger to insert new profiles
-- The handle_new_user trigger needs to be able to insert profiles for new users

-- Drop and recreate the function with proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, naam, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'naam', ''), 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to postgres (the trigger owner)
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Add policy to allow service role to insert profiles (for the trigger)
CREATE POLICY "Service role kan profielen aanmaken" ON profiles
    FOR INSERT
    WITH CHECK (true);
