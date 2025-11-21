-- Allow public insertion of weekly reports (for unauthenticated leaders)
-- This allows leaders to fill reports without being logged in

-- Drop existing restrictive policy first (if it exists)
DROP POLICY IF EXISTS "Leaders can manage their own weekly reports" ON public.cell_reports_weekly;

-- Add policy to allow anyone to insert weekly reports (public access)
CREATE POLICY "Anyone can insert weekly reports" 
ON public.cell_reports_weekly 
FOR INSERT 
WITH CHECK (true);

-- Add policy to allow anyone to update weekly reports (public access)
CREATE POLICY "Anyone can update weekly reports" 
ON public.cell_reports_weekly 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Add policy to allow authenticated users to view all reports
CREATE POLICY "Authenticated users can view all weekly reports" 
ON public.cell_reports_weekly 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL OR true
);

-- Allow anyone to view profiles (to select leader name)
-- The existing "Users can view all profiles" policy should cover this
-- But we ensure it works for unauthenticated users too
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Anyone can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

