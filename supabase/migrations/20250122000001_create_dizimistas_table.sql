-- Create dizimistas table
CREATE TABLE IF NOT EXISTS public.dizimistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  conjugue TEXT,
  discipulador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  casado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dizimistas_discipulador_id ON public.dizimistas(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_dizimistas_created_at ON public.dizimistas(created_at);

-- Enable RLS
ALTER TABLE public.dizimistas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert dizimistas" ON public.dizimistas;
DROP POLICY IF EXISTS "Authenticated users can view dizimistas" ON public.dizimistas;
DROP POLICY IF EXISTS "Pastors and obreiros can view dizimistas" ON public.dizimistas;

-- Create policy to allow public insert (for public registration page)
CREATE POLICY "Anyone can insert dizimistas" 
ON public.dizimistas 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow pastors, obreiros and tesoureiros to view dizimistas
CREATE POLICY "Pastors, obreiros and tesoureiros can view dizimistas" 
ON public.dizimistas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.role IN ('pastor', 'obreiro')
      OR profiles.is_tesoureiro = true
    )
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_dizimistas_updated_at ON public.dizimistas;

CREATE TRIGGER update_dizimistas_updated_at
BEFORE UPDATE ON public.dizimistas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

