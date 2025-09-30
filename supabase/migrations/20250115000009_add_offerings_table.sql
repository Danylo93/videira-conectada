-- Create offerings table for encounter with God
CREATE TABLE public.encounter_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_event_id UUID REFERENCES public.encounter_events(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  offering_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.encounter_offerings ENABLE ROW LEVEL SECURITY;

-- Create policies for encounter_offerings
CREATE POLICY "Pastors can manage all offerings" 
ON public.encounter_offerings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'pastor'
  )
);

CREATE POLICY "Discipuladores can manage offerings they created" 
ON public.encounter_offerings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'discipulador'
    AND id = created_by
  )
);

-- Create indexes for better performance
CREATE INDEX idx_encounter_offerings_event_id ON public.encounter_offerings(encounter_event_id);
CREATE INDEX idx_encounter_offerings_created_by ON public.encounter_offerings(created_by);
CREATE INDEX idx_encounter_offerings_offering_date ON public.encounter_offerings(offering_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_encounter_offerings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_encounter_offerings_updated_at
  BEFORE UPDATE ON public.encounter_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_encounter_offerings_updated_at();
