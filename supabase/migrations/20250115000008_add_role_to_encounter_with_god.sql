-- Add role column to encounter_with_god table
ALTER TABLE public.encounter_with_god 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'encontrista' 
CHECK (role IN ('equipe', 'encontrista', 'cozinha'));

-- Update existing records to have the default role
UPDATE public.encounter_with_god 
SET role = 'encontrista' 
WHERE role IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_encounter_with_god_role ON public.encounter_with_god(role);
