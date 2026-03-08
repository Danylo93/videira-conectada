-- Public weekly attendance lists for Trilho do Vencedor (Ceifeiros / CTL)

CREATE TABLE IF NOT EXISTS public.public_course_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilho_nome TEXT NOT NULL CHECK (trilho_nome IN ('ceifeiros', 'ctl')),
  turma_dia TEXT NOT NULL CHECK (turma_dia IN ('domingo', 'terca')),
  nome_completo TEXT NOT NULL CHECK (char_length(trim(nome_completo)) > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_course_students_turma_nome
  ON public.public_course_students (trilho_nome, turma_dia, lower(nome_completo));

CREATE INDEX IF NOT EXISTS idx_public_course_students_trilho_turma
  ON public.public_course_students (trilho_nome, turma_dia);

CREATE TABLE IF NOT EXISTS public.public_course_weekly_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilho_nome TEXT NOT NULL CHECK (trilho_nome IN ('ceifeiros', 'ctl')),
  turma_dia TEXT NOT NULL CHECK (turma_dia IN ('domingo', 'terca')),
  list_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (trilho_nome, turma_dia, list_date)
);

CREATE INDEX IF NOT EXISTS idx_public_course_weekly_lists_lookup
  ON public.public_course_weekly_lists (trilho_nome, turma_dia, list_date DESC);

CREATE TABLE IF NOT EXISTS public.public_course_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_list_id UUID NOT NULL REFERENCES public.public_course_weekly_lists(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.public_course_students(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT false,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (weekly_list_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_public_course_attendance_weekly_list
  ON public.public_course_attendance (weekly_list_id);

ALTER TABLE public.public_course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_course_weekly_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_course_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public course students" ON public.public_course_students;
DROP POLICY IF EXISTS "Anyone can insert public course students" ON public.public_course_students;
DROP POLICY IF EXISTS "Anyone can update public course students" ON public.public_course_students;
DROP POLICY IF EXISTS "Anyone can delete public course students" ON public.public_course_students;

CREATE POLICY "Anyone can view public course students"
ON public.public_course_students
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert public course students"
ON public.public_course_students
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update public course students"
ON public.public_course_students
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete public course students"
ON public.public_course_students
FOR DELETE
USING (true);

DROP POLICY IF EXISTS "Anyone can view public course weekly lists" ON public.public_course_weekly_lists;
DROP POLICY IF EXISTS "Anyone can insert public course weekly lists" ON public.public_course_weekly_lists;
DROP POLICY IF EXISTS "Anyone can update public course weekly lists" ON public.public_course_weekly_lists;
DROP POLICY IF EXISTS "Anyone can delete public course weekly lists" ON public.public_course_weekly_lists;

CREATE POLICY "Anyone can view public course weekly lists"
ON public.public_course_weekly_lists
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert public course weekly lists"
ON public.public_course_weekly_lists
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update public course weekly lists"
ON public.public_course_weekly_lists
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete public course weekly lists"
ON public.public_course_weekly_lists
FOR DELETE
USING (true);

DROP POLICY IF EXISTS "Anyone can view public course attendance" ON public.public_course_attendance;
DROP POLICY IF EXISTS "Anyone can insert public course attendance" ON public.public_course_attendance;
DROP POLICY IF EXISTS "Anyone can update public course attendance" ON public.public_course_attendance;
DROP POLICY IF EXISTS "Anyone can delete public course attendance" ON public.public_course_attendance;

CREATE POLICY "Anyone can view public course attendance"
ON public.public_course_attendance
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert public course attendance"
ON public.public_course_attendance
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update public course attendance"
ON public.public_course_attendance
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete public course attendance"
ON public.public_course_attendance
FOR DELETE
USING (true);

DROP TRIGGER IF EXISTS update_public_course_students_updated_at
  ON public.public_course_students;
CREATE TRIGGER update_public_course_students_updated_at
BEFORE UPDATE ON public.public_course_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_course_weekly_lists_updated_at
  ON public.public_course_weekly_lists;
CREATE TRIGGER update_public_course_weekly_lists_updated_at
BEFORE UPDATE ON public.public_course_weekly_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_course_attendance_updated_at
  ON public.public_course_attendance;
CREATE TRIGGER update_public_course_attendance_updated_at
BEFORE UPDATE ON public.public_course_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
