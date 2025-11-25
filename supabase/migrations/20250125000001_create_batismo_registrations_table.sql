-- Create batismo_registrations table
CREATE TABLE IF NOT EXISTS public.batismo_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tamanho_camiseta TEXT NOT NULL CHECK (tamanho_camiseta IN ('P', 'M', 'G', 'GG')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_batismo_registrations_lider_id ON public.batismo_registrations(lider_id);
CREATE INDEX IF NOT EXISTS idx_batismo_registrations_created_at ON public.batismo_registrations(created_at);

-- Enable RLS
ALTER TABLE public.batismo_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert batismo registrations" ON public.batismo_registrations;
DROP POLICY IF EXISTS "Authenticated users can view batismo registrations" ON public.batismo_registrations;

-- Create policy to allow public insert (for public registration page)
CREATE POLICY "Anyone can insert batismo registrations" 
ON public.batismo_registrations 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow authenticated users (pastors, obreiros, discipuladores, leaders) to view registrations
CREATE POLICY "Authenticated users can view batismo registrations" 
ON public.batismo_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro', 'discipulador', 'lider')
  )
);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_batismo_registrations_updated_at ON public.batismo_registrations;

CREATE TRIGGER update_batismo_registrations_updated_at
BEFORE UPDATE ON public.batismo_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

