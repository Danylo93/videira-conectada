-- Update RLS policy for dizimistas to include tesoureiros
DROP POLICY IF EXISTS "Pastors and obreiros can view dizimistas" ON public.dizimistas;
DROP POLICY IF EXISTS "Pastors, obreiros and tesoureiros can view dizimistas" ON public.dizimistas;

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

