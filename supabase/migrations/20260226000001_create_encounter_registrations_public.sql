-- Create table for public encounter registrations
CREATE TABLE IF NOT EXISTS public.encounter_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  discipulador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_encounter_registrations_discipulador_id
  ON public.encounter_registrations(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_encounter_registrations_lider_id
  ON public.encounter_registrations(lider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_registrations_created_at
  ON public.encounter_registrations(created_at);

-- Enable RLS
ALTER TABLE public.encounter_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can insert encounter registrations" ON public.encounter_registrations;
DROP POLICY IF EXISTS "Anyone can view encounter registrations" ON public.encounter_registrations;

CREATE POLICY "Anyone can insert encounter registrations"
ON public.encounter_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view encounter registrations"
ON public.encounter_registrations
FOR SELECT
USING (true);

-- Updated at trigger support
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_encounter_registrations_updated_at ON public.encounter_registrations;
CREATE TRIGGER update_encounter_registrations_updated_at
BEFORE UPDATE ON public.encounter_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Dedicated Google Sheets config for encounter registrations
CREATE TABLE IF NOT EXISTS public.google_sheets_encounter_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id TEXT NOT NULL UNIQUE,
  sheet_name TEXT NOT NULL DEFAULT 'Encontristas',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_sheets_encounter_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only pastors and obreiros can manage encounter sheets config"
  ON public.google_sheets_encounter_config;

CREATE POLICY "Only pastors and obreiros can manage encounter sheets config"
ON public.google_sheets_encounter_config
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('pastor', 'obreiro')
  )
);

DROP TRIGGER IF EXISTS update_google_sheets_encounter_config_updated_at
  ON public.google_sheets_encounter_config;
CREATE TRIGGER update_google_sheets_encounter_config_updated_at
BEFORE UPDATE ON public.google_sheets_encounter_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional bootstrap from existing batismo config if present
INSERT INTO public.google_sheets_encounter_config (sheet_id, sheet_name, enabled)
SELECT gsc.sheet_id, 'Encontristas', gsc.enabled
FROM public.google_sheets_config gsc
LIMIT 1
ON CONFLICT (sheet_id) DO NOTHING;
