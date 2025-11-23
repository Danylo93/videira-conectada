-- Tabela para registrar histórico de lembretes de relatórios semanais enviados
-- Isso permite rastrear quando e para quem os lembretes foram enviados

CREATE TABLE IF NOT EXISTS public.weekly_reminders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_via_whatsapp BOOLEAN DEFAULT false,
  sent_via_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_weekly_reminders_log_lider_id ON public.weekly_reminders_log(lider_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reminders_log_week_start_date ON public.weekly_reminders_log(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reminders_log_sent_at ON public.weekly_reminders_log(sent_at);

-- RLS Policies
ALTER TABLE public.weekly_reminders_log ENABLE ROW LEVEL SECURITY;

-- Pastores podem ver todos os logs
CREATE POLICY "Pastores podem ver todos os logs de lembretes"
  ON public.weekly_reminders_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'pastor'
    )
  );

-- Apenas service role pode inserir (via edge function)
CREATE POLICY "Service role pode inserir logs de lembretes"
  ON public.weekly_reminders_log
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.weekly_reminders_log IS 'Registra histórico de lembretes de relatórios semanais enviados para líderes';
COMMENT ON COLUMN public.weekly_reminders_log.lider_id IS 'ID do líder que recebeu o lembrete';
COMMENT ON COLUMN public.weekly_reminders_log.week_start_date IS 'Data de início da semana do relatório (segunda-feira)';
COMMENT ON COLUMN public.weekly_reminders_log.sent_at IS 'Data e hora em que o lembrete foi enviado';
COMMENT ON COLUMN public.weekly_reminders_log.sent_via_whatsapp IS 'Se o lembrete foi enviado via WhatsApp';
COMMENT ON COLUMN public.weekly_reminders_log.sent_via_email IS 'Se o lembrete foi enviado via email';

