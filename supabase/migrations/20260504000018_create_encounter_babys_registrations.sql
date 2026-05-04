CREATE TABLE IF NOT EXISTS public.encounter_babys_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'encontrista',
  idade INTEGER,
  nome_responsavel TEXT NOT NULL DEFAULT '',
  discipuladora_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lider_nome TEXT,
  participacao_confirmada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT encounter_babys_registrations_funcao_check
    CHECK (funcao IN ('encontrista', 'equipe', 'discipuladora')),
  CONSTRAINT encounter_babys_registrations_idade_check
    CHECK (idade IS NULL OR (idade >= 0 AND idade <= 17))
);

CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_discipuladora_id
  ON public.encounter_babys_registrations(discipuladora_id);
CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_lider_id
  ON public.encounter_babys_registrations(lider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_lider_nome
  ON public.encounter_babys_registrations(lider_nome);
CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_idade
  ON public.encounter_babys_registrations(idade);
CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_participacao_confirmada
  ON public.encounter_babys_registrations(participacao_confirmada);
CREATE INDEX IF NOT EXISTS idx_encounter_babys_reg_created_at
  ON public.encounter_babys_registrations(created_at);

ALTER TABLE public.encounter_babys_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert encounter babys registrations"
  ON public.encounter_babys_registrations;
CREATE POLICY "Anyone can insert encounter babys registrations"
ON public.encounter_babys_registrations
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view encounter babys registrations"
  ON public.encounter_babys_registrations;
CREATE POLICY "Anyone can view encounter babys registrations"
ON public.encounter_babys_registrations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can update encounter babys registrations"
  ON public.encounter_babys_registrations;
CREATE POLICY "Anyone can update encounter babys registrations"
ON public.encounter_babys_registrations
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS update_encounter_babys_registrations_updated_at
  ON public.encounter_babys_registrations;
CREATE TRIGGER update_encounter_babys_registrations_updated_at
BEFORE UPDATE ON public.encounter_babys_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
