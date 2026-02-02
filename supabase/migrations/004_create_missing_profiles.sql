-- Create profiles for any existing auth users that don't have one
-- This handles users created before the trigger was properly set up

INSERT INTO public.profiles (id, email, naam, role)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'naam', ''),
    'user'::user_role
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Ensure the trigger function works correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, naam, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'naam', ''), 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
