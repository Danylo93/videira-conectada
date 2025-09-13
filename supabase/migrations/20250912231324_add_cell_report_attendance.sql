-- Add attendance and phase fields to cell_reports
ALTER TABLE public.cell_reports
  ADD COLUMN IF NOT EXISTS members_present UUID[],
  ADD COLUMN IF NOT EXISTS visitors_present UUID[],
  ADD COLUMN IF NOT EXISTS phase TEXT;
