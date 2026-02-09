ALTER TABLE public.cell_reports_weekly
  ADD COLUMN IF NOT EXISTS visitantes_count INTEGER NOT NULL DEFAULT 0 CHECK (visitantes_count >= 0);
