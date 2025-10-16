-- Create encounter_with_god table
CREATE TABLE public.encounter_with_god (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  encounter_type TEXT NOT NULL CHECK (encounter_type IN ('jovens', 'adultos')),
  attended BOOLEAN NOT NULL DEFAULT false,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  discipulador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pastor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  encounter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.encounter_with_god ENABLE ROW LEVEL SECURITY;

-- Create policies for encounter_with_god
CREATE POLICY "Pastors can manage all encounters" 
ON public.encounter_with_god 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'pastor'
  )
);

CREATE POLICY "Discipuladores can manage encounters they created or are assigned to" 
ON public.encounter_with_god 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'discipulador'
    AND (
      id = created_by 
      OR id = discipulador_id
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_encounter_with_god_encounter_date ON public.encounter_with_god(encounter_date);
CREATE INDEX idx_encounter_with_god_encounter_type ON public.encounter_with_god(encounter_type);
CREATE INDEX idx_encounter_with_god_created_by ON public.encounter_with_god(created_by);
CREATE INDEX idx_encounter_with_god_discipulador_id ON public.encounter_with_god(discipulador_id);
CREATE INDEX idx_encounter_with_god_leader_id ON public.encounter_with_god(leader_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_encounter_with_god_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_encounter_with_god_updated_at
  BEFORE UPDATE ON public.encounter_with_god
  FOR EACH ROW
  EXECUTE FUNCTION update_encounter_with_god_updated_at();

