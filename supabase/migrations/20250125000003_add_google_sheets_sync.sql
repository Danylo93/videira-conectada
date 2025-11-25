-- Adicionar tabela para configuração do Google Sheets
CREATE TABLE IF NOT EXISTS public.google_sheets_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id TEXT NOT NULL UNIQUE,
  sheet_name TEXT NOT NULL DEFAULT 'Batizantes',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir apenas pastores e obreiros configurarem
CREATE POLICY "Only pastors and obreiros can manage Google Sheets config"
ON public.google_sheets_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Criar função para notificar Edge Function quando há mudanças
CREATE OR REPLACE FUNCTION notify_batismo_sync()
RETURNS TRIGGER AS $$
DECLARE
  config_enabled BOOLEAN;
  sheet_id_val TEXT;
BEGIN
  -- Verificar se a sincronização está habilitada
  SELECT enabled, google_sheets_config.sheet_id INTO config_enabled, sheet_id_val
  FROM public.google_sheets_config
  LIMIT 1;
  
  -- Se habilitado, notificar via pg_notify (será capturado pela Edge Function via webhook)
  IF config_enabled AND sheet_id_val IS NOT NULL THEN
    PERFORM pg_notify(
      'batismo_sync',
      json_build_object(
        'action', TG_OP,
        'id', COALESCE(NEW.id, OLD.id),
        'sheet_id', sheet_id_val
      )::text
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronização
DROP TRIGGER IF EXISTS batismo_sync_trigger ON public.batismo_registrations;
CREATE TRIGGER batismo_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.batismo_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_batismo_sync();

