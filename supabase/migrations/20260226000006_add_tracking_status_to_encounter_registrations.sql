-- Tracking fields for public follow-up pages
ALTER TABLE public.encounter_registrations
ADD COLUMN IF NOT EXISTS ja_pagou BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.encounter_registrations
ADD COLUMN IF NOT EXISTS presenca_confirmada BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.encounter_kids_registrations
ADD COLUMN IF NOT EXISTS participacao_confirmada BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_encounter_registrations_ja_pagou
  ON public.encounter_registrations(ja_pagou);

CREATE INDEX IF NOT EXISTS idx_encounter_registrations_presenca_confirmada
  ON public.encounter_registrations(presenca_confirmada);

CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_participacao_confirmada
  ON public.encounter_kids_registrations(participacao_confirmada);

DROP POLICY IF EXISTS "Anyone can update encounter registrations"
  ON public.encounter_registrations;
CREATE POLICY "Anyone can update encounter registrations"
ON public.encounter_registrations
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update encounter kids registrations"
  ON public.encounter_kids_registrations;
CREATE POLICY "Anyone can update encounter kids registrations"
ON public.encounter_kids_registrations
FOR UPDATE
USING (true)
WITH CHECK (true);
