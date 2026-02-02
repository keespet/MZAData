-- Fix RLS policies voor profiles tabel
-- Het probleem is dat de huidige policies mogelijk niet correct werken

-- Verwijder bestaande policies
DROP POLICY IF EXISTS "Gebruikers kunnen eigen profiel zien" ON profiles;
DROP POLICY IF EXISTS "Admins kunnen alle profielen zien" ON profiles;
DROP POLICY IF EXISTS "Admins kunnen profielen aanpassen" ON profiles;
DROP POLICY IF EXISTS "Service role kan profielen aanmaken" ON profiles;

-- Simpele policy: elke ingelogde user kan zijn eigen profiel lezen
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Admins kunnen alle profielen lezen (zonder circulaire dependency)
CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Admins kunnen profielen updaten
CREATE POLICY "Admins can update profiles" ON profiles
    FOR UPDATE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Admins kunnen profielen verwijderen
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Trigger/service role kan profielen aanmaken (voor nieuwe users)
CREATE POLICY "Enable insert for authentication trigger" ON profiles
    FOR INSERT
    WITH CHECK (true);

-- Zorg dat actief standaard true is
ALTER TABLE profiles ALTER COLUMN actief SET DEFAULT true;

-- Update bestaande profielen waar actief NULL of false is
UPDATE profiles SET actief = true WHERE actief IS NULL OR actief = false;
