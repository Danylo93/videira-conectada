-- Add lost_members column to cell_reports
-- This will store an array of objects with member/visitor id and reason
ALTER TABLE public.cell_reports
  ADD COLUMN IF NOT EXISTS lost_members JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.cell_reports.lost_members IS 'Array of objects: [{id: uuid, reason: "critico"|"regular"|"amarelo"}]';

