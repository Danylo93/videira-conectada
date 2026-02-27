-- Allow deletion from public Kids follow-up page
DROP POLICY IF EXISTS "Anyone can delete encounter kids registrations"
  ON public.encounter_kids_registrations;

CREATE POLICY "Anyone can delete encounter kids registrations"
ON public.encounter_kids_registrations
FOR DELETE
USING (true);
