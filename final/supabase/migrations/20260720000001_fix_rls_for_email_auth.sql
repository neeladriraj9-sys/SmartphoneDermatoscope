-- Drop existing RLS policies that require Supabase JWT auth
ALTER TABLE public.spots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Add user_email column to spots and scans if not exists
ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create indexes for email-based queries
CREATE INDEX IF NOT EXISTS idx_spots_user_email ON public.spots(user_email);
CREATE INDEX IF NOT EXISTS idx_scans_user_email ON public.scans(user_email);
