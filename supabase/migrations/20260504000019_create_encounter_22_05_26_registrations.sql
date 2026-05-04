CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.encounter_22_05_26 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'encontrista',
  discipulador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ja_pagou BOOLEAN NOT NULL DEFAULT false,
  presenca_confirmada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT encounter_22_05_26_funcao_check
    CHECK (funcao IN ('equipe', 'encontrista', 'discipulador'))
);

CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_funcao
  ON public.encounter_22_05_26(funcao);
CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_discipulador_id
  ON public.encounter_22_05_26(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_lider_id
  ON public.encounter_22_05_26(lider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_ja_pagou
  ON public.encounter_22_05_26(ja_pagou);
CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_presenca_confirmada
  ON public.encounter_22_05_26(presenca_confirmada);
CREATE INDEX IF NOT EXISTS idx_encounter_22_05_26_created_at
  ON public.encounter_22_05_26(created_at);

ALTER TABLE public.encounter_22_05_26 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert encounter 22 05 26 registrations"
  ON public.encounter_22_05_26;
CREATE POLICY "Anyone can insert encounter 22 05 26 registrations"
ON public.encounter_22_05_26
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view encounter 22 05 26 registrations"
  ON public.encounter_22_05_26;
CREATE POLICY "Anyone can view encounter 22 05 26 registrations"
ON public.encounter_22_05_26
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can update encounter 22 05 26 registrations"
  ON public.encounter_22_05_26;
CREATE POLICY "Anyone can update encounter 22 05 26 registrations"
ON public.encounter_22_05_26
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete encounter 22 05 26 registrations"
  ON public.encounter_22_05_26;
CREATE POLICY "Anyone can delete encounter 22 05 26 registrations"
ON public.encounter_22_05_26
FOR DELETE
USING (true);

DROP TRIGGER IF EXISTS update_encounter_22_05_26_updated_at
  ON public.encounter_22_05_26;
CREATE TRIGGER update_encounter_22_05_26_updated_at
BEFORE UPDATE ON public.encounter_22_05_26
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
