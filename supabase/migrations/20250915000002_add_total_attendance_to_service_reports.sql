-- Add total_attendance column to service_attendance_reports for normal mode
ALTER TABLE public.service_attendance_reports
  ADD COLUMN IF NOT EXISTS total_attendance INTEGER;

