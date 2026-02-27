-- Add funcao to Encontro Kids registrations
ALTER TABLE public.encounter_kids_registrations
ADD COLUMN IF NOT EXISTS funcao TEXT NOT NULL DEFAULT 'encontrista';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'encounter_kids_registrations_funcao_check'
  ) THEN
    ALTER TABLE public.encounter_kids_registrations
    ADD CONSTRAINT encounter_kids_registrations_funcao_check
    CHECK (funcao IN ('encontrista', 'equipe'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_funcao
  ON public.encounter_kids_registrations(funcao);
