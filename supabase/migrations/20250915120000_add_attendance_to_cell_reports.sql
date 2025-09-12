-- Add attendance arrays to cell_reports
ALTER TABLE public.cell_reports
  ADD COLUMN IF NOT EXISTS members_present UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequentadores_present UUID[] DEFAULT '{}';
