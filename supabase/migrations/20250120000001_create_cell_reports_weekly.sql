-- Create cell_reports_weekly table for simplified weekly cell reports
CREATE TABLE IF NOT EXISTS public.cell_reports_weekly (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  members_count INTEGER NOT NULL DEFAULT 0 CHECK (members_count >= 0),
  frequentadores_count INTEGER NOT NULL DEFAULT 0 CHECK (frequentadores_count >= 0),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lider_id, report_date)
);

-- Enable RLS for cell_reports_weekly
ALTER TABLE public.cell_reports_weekly ENABLE ROW LEVEL SECURITY;

-- Create policies for cell_reports_weekly
CREATE POLICY "Leaders can manage their own weekly reports" 
ON public.cell_reports_weekly 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = cell_reports_weekly.lider_id OR 
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cell_reports_weekly_lider_id ON public.cell_reports_weekly(lider_id);
CREATE INDEX IF NOT EXISTS idx_cell_reports_weekly_report_date ON public.cell_reports_weekly(report_date);
CREATE INDEX IF NOT EXISTS idx_cell_reports_weekly_created_at ON public.cell_reports_weekly(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cell_reports_weekly_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cell_reports_weekly_updated_at
  BEFORE UPDATE ON public.cell_reports_weekly
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cell_reports_weekly_updated_at();

