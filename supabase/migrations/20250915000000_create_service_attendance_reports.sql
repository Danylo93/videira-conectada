-- Create service attendance reports table
CREATE TABLE public.service_attendance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  members_present UUID[],
  visitors_present UUID[],
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'needs_correction')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lider_id, service_date)
);

-- Enable RLS for service attendance reports
ALTER TABLE public.service_attendance_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for service attendance reports
CREATE POLICY "Leaders can manage their own service reports" 
ON public.service_attendance_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = service_attendance_reports.lider_id OR 
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_attendance_reports_updated_at
  BEFORE UPDATE ON public.service_attendance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

