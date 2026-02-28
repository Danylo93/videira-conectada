-- Allow free-text leader name on Kids registrations
ALTER TABLE public.encounter_kids_registrations
ADD COLUMN IF NOT EXISTS lider_nome TEXT;

-- Backfill leader name from profile when possible
UPDATE public.encounter_kids_registrations ekr
SET lider_nome = p.name
FROM public.profiles p
WHERE ekr.lider_id = p.id
  AND (ekr.lider_nome IS NULL OR btrim(ekr.lider_nome) = '');

-- Keep FK for known leaders, but allow null when leader is free text
ALTER TABLE public.encounter_kids_registrations
ALTER COLUMN lider_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_lider_nome
  ON public.encounter_kids_registrations(lider_nome);
