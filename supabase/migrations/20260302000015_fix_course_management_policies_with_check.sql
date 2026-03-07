-- Fix course management policies to explicitly allow INSERT/UPDATE via WITH CHECK
-- This prevents "manage" operations from being blocked by RLS in some environments.

-- courses
DROP POLICY IF EXISTS "Pastors, obreiros and coordinators can manage courses" ON public.courses;
CREATE POLICY "Pastors, obreiros and coordinators can manage courses"
ON public.courses
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
);

-- course_modules
DROP POLICY IF EXISTS "Pastors, obreiros and coordinators can manage course modules" ON public.course_modules;
CREATE POLICY "Pastors, obreiros and coordinators can manage course modules"
ON public.course_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
);

-- course_lessons
DROP POLICY IF EXISTS "Pastors, obreiros and coordinators can manage course lessons" ON public.course_lessons;
CREATE POLICY "Pastors, obreiros and coordinators can manage course lessons"
ON public.course_lessons
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
);

-- course_instructors
DROP POLICY IF EXISTS "Pastors, obreiros and coordinators can manage course instructors" ON public.course_instructors;
CREATE POLICY "Pastors, obreiros and coordinators can manage course instructors"
ON public.course_instructors
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.role IN ('pastor', 'obreiro')
        OR profiles.is_curso_coordenador = true
      )
  )
);

-- course_registrations (manage)
DROP POLICY IF EXISTS "Users can manage course registrations" ON public.course_registrations;
CREATE POLICY "Users can manage course registrations"
ON public.course_registrations
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.id = course_registrations.leader_id
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.id = course_registrations.leader_id
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador')
      )
  )
);

-- course_attendance (manage)
DROP POLICY IF EXISTS "Users can manage course attendance" ON public.course_attendance;
CREATE POLICY "Users can manage course attendance"
ON public.course_attendance
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador', 'lider')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador', 'lider')
      )
  )
);

-- course_payments (manage)
DROP POLICY IF EXISTS "Users can manage course payments" ON public.course_payments;
CREATE POLICY "Users can manage course payments"
ON public.course_payments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador')
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.course_registrations cr ON cr.leader_id = p.id
    WHERE p.user_id = auth.uid()
      AND cr.id = course_payments.registration_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (
        profiles.is_curso_coordenador = true
        OR profiles.role IN ('pastor', 'obreiro', 'discipulador')
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.course_registrations cr ON cr.leader_id = p.id
    WHERE p.user_id = auth.uid()
      AND cr.id = course_payments.registration_id
  )
);
