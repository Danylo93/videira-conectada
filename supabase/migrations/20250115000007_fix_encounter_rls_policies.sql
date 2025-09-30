-- Fix RLS policies for encounter_with_god table
-- The original policies were incorrectly referencing auth.uid() directly with profiles.id
-- They should reference profiles.user_id = auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "Pastors can manage all encounters" ON public.encounter_with_god;
DROP POLICY IF EXISTS "Discipuladores can manage encounters they created or are assigned to" ON public.encounter_with_god;

-- Create corrected policies
CREATE POLICY "Pastors can manage all encounters" 
ON public.encounter_with_god 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'pastor'
  )
);

CREATE POLICY "Discipuladores can manage encounters they created or are assigned to" 
ON public.encounter_with_god 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'discipulador'
    AND (
      id = created_by 
      OR id = discipulador_id
    )
  )
);

-- Add policy for leaders to manage encounters they are assigned to
CREATE POLICY "Leaders can manage encounters they are assigned to" 
ON public.encounter_with_god 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'lider'
    AND id = leader_id
  )
);
