-- Allow discipuladora in Kids registration role
DO $$
DECLARE
  current_constraint_name TEXT;
BEGIN
  SELECT con.conname INTO current_constraint_name
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE con.contype = 'c'
    AND n.nspname = 'public'
    AND t.relname = 'encounter_kids_registrations'
    AND con.conname = 'encounter_kids_registrations_funcao_check'
  LIMIT 1;

  IF current_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.encounter_kids_registrations DROP CONSTRAINT IF EXISTS %I',
      current_constraint_name
    );
  END IF;
END $$;

ALTER TABLE public.encounter_kids_registrations
ADD CONSTRAINT encounter_kids_registrations_funcao_check
CHECK (funcao IN ('encontrista', 'equipe', 'discipuladora'));
