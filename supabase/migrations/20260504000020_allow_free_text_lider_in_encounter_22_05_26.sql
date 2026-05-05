ALTER TABLE public.encounter_22_05_26
ADD COLUMN IF NOT EXISTS lider_nome TEXT;

UPDATE public.encounter_22_05_26 e
SET lider_nome = p.name
FROM public.profiles p
WHERE e.lider_id = p.id
  AND (e.lider_nome IS NULL OR btrim(e.lider_nome) = '');

ALTER TABLE public.encounter_22_05_26
ALTER COLUMN lider_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_lider_nome
  ON public.encounter_22_05_26(lider_nome);
