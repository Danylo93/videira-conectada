-- Create tithes and offerings table
CREATE TABLE public.tithes_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  person_type TEXT NOT NULL CHECK (person_type IN ('member', 'frequentador', 'lider', 'discipulador', 'pastor')),
  type TEXT NOT NULL CHECK (type IN ('tithe', 'offering', 'special_offering')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'pix', 'card', 'bank_transfer')),
  received_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  received_by_name TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_tithes_offerings_person_id ON public.tithes_offerings(person_id);
CREATE INDEX idx_tithes_offerings_person_type ON public.tithes_offerings(person_type);
CREATE INDEX idx_tithes_offerings_type ON public.tithes_offerings(type);
CREATE INDEX idx_tithes_offerings_month_year ON public.tithes_offerings(month, year);
CREATE INDEX idx_tithes_offerings_received_by ON public.tithes_offerings(received_by);
CREATE INDEX idx_tithes_offerings_received_at ON public.tithes_offerings(received_at);

-- Enable RLS
ALTER TABLE public.tithes_offerings ENABLE ROW LEVEL SECURITY;

-- Create policies for tithes and offerings
CREATE POLICY "Pastors can manage all tithes and offerings" 
ON public.tithes_offerings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'pastor'
  )
);

CREATE POLICY "Obreiros can manage all tithes and offerings" 
ON public.tithes_offerings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'obreiro'
  )
);

CREATE POLICY "Discipuladores can view tithes and offerings from their network" 
ON public.tithes_offerings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'discipulador'
    AND (
      tithes_offerings.received_by = profiles.id 
      OR tithes_offerings.person_type = 'lider'
      OR tithes_offerings.person_type = 'member'
      OR tithes_offerings.person_type = 'frequentador'
    )
  )
);

CREATE POLICY "Líderes can view their own tithes and offerings" 
ON public.tithes_offerings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'lider'
    AND (
      tithes_offerings.person_id = profiles.id 
      OR tithes_offerings.received_by = profiles.id
    )
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tithes_offerings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_tithes_offerings_updated_at
  BEFORE UPDATE ON public.tithes_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_tithes_offerings_updated_at();
