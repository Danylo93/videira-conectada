-- Add idade to Encontro Kids registrations
ALTER TABLE public.encounter_kids_registrations
ADD COLUMN IF NOT EXISTS idade INTEGER;

-- Optional data quality guard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'encounter_kids_registrations_idade_check'
  ) THEN
    ALTER TABLE public.encounter_kids_registrations
    ADD CONSTRAINT encounter_kids_registrations_idade_check
    CHECK (idade IS NULL OR (idade >= 0 AND idade <= 17));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_idade
  ON public.encounter_kids_registrations(idade);
