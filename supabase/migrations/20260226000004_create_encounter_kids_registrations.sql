-- Public registrations for Encontro Kids
CREATE TABLE IF NOT EXISTS public.encounter_kids_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  discipuladora_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_discipuladora_id
  ON public.encounter_kids_registrations(discipuladora_id);
CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_lider_id
  ON public.encounter_kids_registrations(lider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_kids_reg_created_at
  ON public.encounter_kids_registrations(created_at);

ALTER TABLE public.encounter_kids_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert encounter kids registrations"
  ON public.encounter_kids_registrations;
DROP POLICY IF EXISTS "Anyone can view encounter kids registrations"
  ON public.encounter_kids_registrations;

CREATE POLICY "Anyone can insert encounter kids registrations"
ON public.encounter_kids_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view encounter kids registrations"
ON public.encounter_kids_registrations
FOR SELECT
USING (true);

DROP TRIGGER IF EXISTS update_encounter_kids_registrations_updated_at
  ON public.encounter_kids_registrations;
CREATE TRIGGER update_encounter_kids_registrations_updated_at
BEFORE UPDATE ON public.encounter_kids_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
