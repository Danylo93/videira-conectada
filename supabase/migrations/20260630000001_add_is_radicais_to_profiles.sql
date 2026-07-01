-- Add is_radicais column to profiles table to separate Radicais Livres (jovens) mode profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_radicais BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_radicais ON public.profiles(is_radicais);

-- Ensure existing profiles default to non-radicais (normal/kids mode)
UPDATE public.profiles
SET is_radicais = false
WHERE is_radicais IS NULL;
