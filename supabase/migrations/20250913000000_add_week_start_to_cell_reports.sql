ALTER TABLE public.cell_reports
  ADD COLUMN week_start DATE;

UPDATE public.cell_reports
SET week_start = to_date(concat(year, '-', month, '-01'), 'YYYY-MM-DD')
WHERE week_start IS NULL;

ALTER TABLE public.cell_reports
  ALTER COLUMN week_start SET NOT NULL,
  ALTER COLUMN month DROP NOT NULL,
  ALTER COLUMN year DROP NOT NULL;

ALTER TABLE public.cell_reports
  DROP CONSTRAINT IF EXISTS cell_reports_lider_id_month_year_key,
  ADD CONSTRAINT cell_reports_lider_id_week_start_key UNIQUE (lider_id, week_start);
