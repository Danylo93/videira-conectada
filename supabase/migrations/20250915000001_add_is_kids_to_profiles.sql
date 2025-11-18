-- Add is_kids column to profiles table to separate Kids mode profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_kids BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_kids ON public.profiles(is_kids);

-- Update existing profiles to be non-kids (normal mode)
UPDATE public.profiles 
SET is_kids = false 
WHERE is_kids IS NULL;

