-- Ensure funcao accepts discipulador in all environments
DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'encounter_registrations'
      AND c.contype = 'c'
      AND a.attname = 'funcao'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.encounter_registrations DROP CONSTRAINT IF EXISTS %I',
      constraint_row.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.encounter_registrations
ADD CONSTRAINT encounter_registrations_funcao_check
CHECK (funcao IN ('equipe', 'encontrista', 'discipulador'));
