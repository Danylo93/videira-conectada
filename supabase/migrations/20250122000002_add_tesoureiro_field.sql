-- Add is_tesoureiro field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_tesoureiro BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_tesoureiro ON public.profiles(is_tesoureiro);

-- Update Jonas Pereira to be tesoureiro
-- Note: This will update any profile with name containing "Jonas Pereira"
UPDATE public.profiles 
SET is_tesoureiro = true 
WHERE LOWER(name) LIKE '%jonas%pereira%' OR LOWER(name) LIKE '%jonas pereira%';

