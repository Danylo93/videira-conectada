-- Allow deletion from public Encontro follow-up page
DROP POLICY IF EXISTS "Anyone can delete encounter registrations"
  ON public.encounter_registrations;

CREATE POLICY "Anyone can delete encounter registrations"
ON public.encounter_registrations
FOR DELETE
USING (true);
