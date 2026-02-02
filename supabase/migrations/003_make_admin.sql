-- Make kees.tuijp@mza.nl an admin
UPDATE public.profiles
SET role = 'admin', naam = 'Kees Tuijp'
WHERE email = 'kees.tuijp@mza.nl';
