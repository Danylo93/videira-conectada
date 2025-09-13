-- Allow pastors and discipuladores to insert profiles
CREATE POLICY "Pastors, obreiros and discipuladores can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('pastor','obreiro','discipulador')
  )
);
