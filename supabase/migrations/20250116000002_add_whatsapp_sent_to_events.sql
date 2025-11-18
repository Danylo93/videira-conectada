-- Adicionar coluna para rastrear se o evento foi enviado para WhatsApp
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

-- Adicionar coluna para armazenar o ID do grupo do WhatsApp (opcional)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS whatsapp_group_id VARCHAR(255);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_events_whatsapp_sent ON public.events(whatsapp_sent);

-- Nota: O webhook do Supabase será configurado manualmente via Dashboard
-- ou usando a API do Supabase. O trigger abaixo é opcional e pode ser usado
-- para notificações em tempo real via PostgreSQL LISTEN/NOTIFY

-- Criar função para notificar quando um evento é criado ou atualizado (opcional)
CREATE OR REPLACE FUNCTION notify_event_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificação via pg_notify para webhook (se usar LISTEN/NOTIFY)
  PERFORM pg_notify(
    'event_change',
    json_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'description', NEW.description,
      'event_date', NEW.event_date,
      'location', NEW.location,
      'type', NEW.type,
      'action', TG_OP,
      'whatsapp_sent', NEW.whatsapp_sent
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para eventos INSERT e UPDATE (opcional)
-- O webhook do Supabase já captura essas mudanças automaticamente
-- Este trigger é útil apenas se você usar LISTEN/NOTIFY diretamente
DROP TRIGGER IF EXISTS event_change_trigger ON public.events;
CREATE TRIGGER event_change_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW
  WHEN (NEW.active = true)
  EXECUTE FUNCTION notify_event_change();
