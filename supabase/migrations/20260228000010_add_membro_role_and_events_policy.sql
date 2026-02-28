-- Add dedicated member role for mobile-only member experience.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role'
      AND n.nspname = 'public'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'membro';
  END IF;
END
$$;

-- Ensure members can read active agenda/events in environments with strict RLS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'events'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Membros podem ver eventos ativos'
  ) THEN
    CREATE POLICY "Membros podem ver eventos ativos"
      ON public.events
      FOR SELECT
      USING (
        active = true
        AND EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.user_id = auth.uid()
            AND profiles.role::text = 'membro'
        )
      );
  END IF;
END
$$;
