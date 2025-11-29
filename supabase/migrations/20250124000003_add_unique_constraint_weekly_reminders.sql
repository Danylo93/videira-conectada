-- Adicionar constraint UNIQUE para evitar envios duplicados de lembretes de relatórios semanais
-- Um líder só pode receber um lembrete por semana

-- Primeiro, remover duplicatas mantendo apenas o registro mais recente
-- Usar CTE para identificar os registros a manter (mais recente por grupo)
WITH duplicados AS (
  SELECT 
    id,
    lider_id,
    week_start_date,
    ROW_NUMBER() OVER (
      PARTITION BY lider_id, week_start_date 
      ORDER BY sent_at DESC, id DESC
    ) as rn
  FROM public.weekly_reminders_log
)
DELETE FROM public.weekly_reminders_log w
WHERE EXISTS (
  SELECT 1 
  FROM duplicados d
  WHERE d.id = w.id 
    AND d.rn > 1
);

-- Agora podemos criar a constraint UNIQUE
ALTER TABLE public.weekly_reminders_log
  DROP CONSTRAINT IF EXISTS weekly_reminders_log_lider_id_week_start_date_key;

ALTER TABLE public.weekly_reminders_log
  ADD CONSTRAINT weekly_reminders_log_lider_id_week_start_date_key 
  UNIQUE (lider_id, week_start_date);

-- Comentário
COMMENT ON CONSTRAINT weekly_reminders_log_lider_id_week_start_date_key ON public.weekly_reminders_log IS 
'Garante que cada líder receba apenas um lembrete por semana';

