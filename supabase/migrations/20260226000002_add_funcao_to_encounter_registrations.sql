-- Add funcao to public encounter registrations
ALTER TABLE public.encounter_registrations
ADD COLUMN IF NOT EXISTS funcao TEXT NOT NULL DEFAULT 'encontrista'
CHECK (funcao IN ('equipe', 'encontrista'));

-- Keep existing records consistent
UPDATE public.encounter_registrations
SET funcao = 'encontrista'
WHERE funcao IS NULL;

CREATE INDEX IF NOT EXISTS idx_encounter_registrations_funcao
  ON public.encounter_registrations(funcao);
