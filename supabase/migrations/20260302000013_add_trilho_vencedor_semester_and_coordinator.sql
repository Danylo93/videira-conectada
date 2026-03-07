-- Add coordinator flag for Trilho do Vencedor
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_curso_coordenador BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_curso_coordenador
  ON public.profiles(is_curso_coordenador);

-- Add semester/track fields to courses
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS semester_label TEXT;

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS trilho_nome TEXT;

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS turma_dia TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_trilho_nome_check'
  ) THEN
    ALTER TABLE public.courses
    ADD CONSTRAINT courses_trilho_nome_check
    CHECK (trilho_nome IS NULL OR trilho_nome IN ('ceifeiros', 'ctl'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_turma_dia_check'
  ) THEN
    ALTER TABLE public.courses
    ADD CONSTRAINT courses_turma_dia_check
    CHECK (turma_dia IS NULL OR turma_dia IN ('domingo', 'terca'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_semester_trilho_turma
  ON public.courses(semester_label, trilho_nome, turma_dia);

-- Add denormalized semester/track fields to registrations
ALTER TABLE public.course_registrations
ADD COLUMN IF NOT EXISTS semester_label TEXT;

ALTER TABLE public.course_registrations
ADD COLUMN IF NOT EXISTS trilho_nome TEXT;

ALTER TABLE public.course_registrations
ADD COLUMN IF NOT EXISTS turma_dia TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_registrations_trilho_nome_check'
  ) THEN
    ALTER TABLE public.course_registrations
    ADD CONSTRAINT course_registrations_trilho_nome_check
    CHECK (trilho_nome IS NULL OR trilho_nome IN ('ceifeiros', 'ctl'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_registrations_turma_dia_check'
  ) THEN
    ALTER TABLE public.course_registrations
    ADD CONSTRAINT course_registrations_turma_dia_check
    CHECK (turma_dia IS NULL OR turma_dia IN ('domingo', 'terca'));
  END IF;
END $$;

-- Keep registration semester/track fields synchronized with selected course
CREATE OR REPLACE FUNCTION public.sync_course_registration_semester_fields()
RETURNS TRIGGER AS $$
BEGIN
  SELECT c.semester_label, c.trilho_nome, c.turma_dia
    INTO NEW.semester_label, NEW.trilho_nome, NEW.turma_dia
  FROM public.courses c
  WHERE c.id = NEW.course_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_course_registration_semester_fields
  ON public.course_registrations;

CREATE TRIGGER trg_sync_course_registration_semester_fields
BEFORE INSERT OR UPDATE OF course_id
ON public.course_registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_course_registration_semester_fields();

-- Backfill existing registrations
UPDATE public.course_registrations cr
SET
  semester_label = c.semester_label,
  trilho_nome = c.trilho_nome,
  turma_dia = c.turma_dia
FROM public.courses c
WHERE c.id = cr.course_id;

-- Student can enroll only once per semester/track (domingo OR terça)
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_registrations_student_semester_trilho
  ON public.course_registrations(student_id, semester_label, trilho_nome)
  WHERE semester_label IS NOT NULL
    AND trilho_nome IS NOT NULL
    AND status IN ('pending', 'approved', 'enrolled', 'completed', 'suspended');

-- Seed current semester courses for Trilho do Vencedor (Ceifeiros/CTL - Domingo/Terça)
DO $$
DECLARE
  v_semester_label TEXT;
  v_creator_id UUID;
BEGIN
  v_semester_label := CONCAT(
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    '-',
    CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE)::INT <= 6 THEN '1' ELSE '2' END
  );

  SELECT p.id
    INTO v_creator_id
  FROM public.profiles p
  WHERE p.role IN ('pastor', 'obreiro')
     OR p.is_curso_coordenador = true
  ORDER BY p.created_at
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.courses (
    name,
    description,
    duration_weeks,
    price,
    min_students,
    difficulty_level,
    category,
    status,
    active,
    certification_required,
    created_by,
    semester_label,
    trilho_nome,
    turma_dia
  )
  SELECT
    seed.name,
    seed.description,
    24,
    0.00,
    1,
    seed.difficulty_level,
    seed.category,
    'active',
    true,
    false,
    v_creator_id,
    v_semester_label,
    seed.trilho_nome,
    seed.turma_dia
  FROM (
    VALUES
      ('Ceifeiros - Domingo', 'Trilho do Vencedor - Ceifeiros (Turma de Domingo)', 'beginner', 'spiritual', 'ceifeiros', 'domingo'),
      ('Ceifeiros - Terça',   'Trilho do Vencedor - Ceifeiros (Turma de Terça)',   'beginner', 'spiritual', 'ceifeiros', 'terca'),
      ('CTL - Domingo',       'Trilho do Vencedor - CTL (Turma de Domingo)',       'intermediate', 'leadership', 'ctl', 'domingo'),
      ('CTL - Terça',         'Trilho do Vencedor - CTL (Turma de Terça)',         'intermediate', 'leadership', 'ctl', 'terca')
  ) AS seed(name, description, difficulty_level, category, trilho_nome, turma_dia)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.semester_label = v_semester_label
      AND c.trilho_nome = seed.trilho_nome
      AND c.turma_dia = seed.turma_dia
  );
END $$;
