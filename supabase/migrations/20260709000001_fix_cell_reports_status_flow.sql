-- Corrige o fluxo de status dos relatórios de célula.
--
-- Problema: o CHECK original só permitia ('draft','submitted','approved'),
-- mas o app usa 'needs_correction' ao solicitar correção — o UPDATE falhava.
-- Além disso, relatórios criados pelo líder nasciam como 'draft' (default),
-- e a tela de aprovação (NetworkReports) só exibe as ações de Aprovar/
-- Solicitar Correção para relatórios 'submitted' — o fluxo nunca andava.

-- 1) Permite o status 'needs_correction' usado pelo app.
ALTER TABLE public.cell_reports
  DROP CONSTRAINT IF EXISTS cell_reports_status_check;

ALTER TABLE public.cell_reports
  ADD CONSTRAINT cell_reports_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'needs_correction'));

-- 2) Criar um relatório já é o envio dele: default passa a 'submitted'.
ALTER TABLE public.cell_reports
  ALTER COLUMN status SET DEFAULT 'submitted';

-- 3) Relatórios antigos presos em 'draft' eram, na prática, envios do líder
--    (a UI nunca teve etapa de rascunho) — entram na fila de aprovação.
UPDATE public.cell_reports SET status = 'submitted' WHERE status = 'draft';
