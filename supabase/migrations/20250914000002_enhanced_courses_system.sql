-- Enhanced Courses System Migration
-- This migration creates a comprehensive course management system

-- Drop existing course tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.course_attendance_entries CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.course_subjects CASCADE;
DROP TABLE IF EXISTS public.course_payments CASCADE;
DROP TABLE IF EXISTS public.course_registrations CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Create enhanced courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  price DECIMAL(10,2) DEFAULT 0.00,
  max_students INTEGER,
  min_students INTEGER DEFAULT 1,
  difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL DEFAULT 'spiritual' CHECK (category IN ('spiritual', 'leadership', 'ministry', 'biblical', 'practical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  registration_deadline DATE,
  requirements TEXT[],
  learning_objectives TEXT[],
  materials_included TEXT[],
  certification_required BOOLEAN DEFAULT false,
  certification_name TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course modules table (replaces subjects)
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_hours DECIMAL(4,2) DEFAULT 1.0,
  is_required BOOLEAN DEFAULT true,
  prerequisites TEXT[],
  learning_outcomes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course lessons table (enhanced)
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'classroom' CHECK (lesson_type IN ('classroom', 'online', 'practical', 'field_work', 'assessment')),
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  online_link TEXT,
  materials TEXT[],
  homework TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT true,
  max_attendance INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course instructors table
CREATE TABLE public.course_instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'mentor', 'evaluator')),
  is_primary BOOLEAN DEFAULT false,
  assigned_modules UUID[],
  hourly_rate DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, instructor_id)
);

-- Create enhanced course registrations table
CREATE TABLE public.course_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled', 'completed', 'dropped', 'suspended')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  scholarship_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_plan TEXT DEFAULT 'full' CHECK (payment_plan IN ('full', 'installments', 'scholarship')),
  installment_count INTEGER DEFAULT 1,
  notes TEXT,
  emergency_contact TEXT,
  medical_info TEXT,
  special_needs TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create course attendance table (enhanced)
CREATE TABLE public.course_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused', 'makeup')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  marked_by UUID REFERENCES public.profiles(id),
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, registration_id)
);

-- Create course payments table (enhanced)
CREATE TABLE public.course_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'scholarship')),
  payment_reference TEXT,
  installment_number INTEGER DEFAULT 1,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course assessments table
CREATE TABLE public.course_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'exam', 'project', 'presentation', 'practical', 'participation')),
  weight_percentage DECIMAL(5,2) DEFAULT 0.00,
  max_score DECIMAL(5,2) DEFAULT 100.00,
  passing_score DECIMAL(5,2) DEFAULT 70.00,
  due_date DATE,
  instructions TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course grades table
CREATE TABLE public.course_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.course_assessments(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 100.00,
  grade_letter TEXT,
  feedback TEXT,
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, registration_id)
);

-- Create course certificates table
CREATE TABLE public.course_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  digital_signature TEXT,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Anyone can view active courses" 
ON public.courses 
FOR SELECT 
USING (active = true AND status = 'active');

CREATE POLICY "Pastors and obreiros can manage courses" 
ON public.courses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Create RLS policies for course modules
CREATE POLICY "Anyone can view course modules" 
ON public.course_modules 
FOR SELECT 
USING (true);

CREATE POLICY "Pastors and obreiros can manage course modules" 
ON public.course_modules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Create RLS policies for course lessons
CREATE POLICY "Anyone can view course lessons" 
ON public.course_lessons 
FOR SELECT 
USING (true);

CREATE POLICY "Pastors and obreiros can manage course lessons" 
ON public.course_lessons 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Create RLS policies for course instructors
CREATE POLICY "Anyone can view course instructors" 
ON public.course_instructors 
FOR SELECT 
USING (true);

CREATE POLICY "Pastors and obreiros can manage course instructors" 
ON public.course_instructors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Create RLS policies for course registrations
CREATE POLICY "Users can view their own registrations" 
ON public.course_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = course_registrations.leader_id OR
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

CREATE POLICY "Leaders can manage their members' registrations" 
ON public.course_registrations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = course_registrations.leader_id OR
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create RLS policies for course attendance
CREATE POLICY "Users can view attendance for their courses" 
ON public.course_attendance 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    JOIN public.course_registrations ON course_registrations.leader_id = profiles.id
    WHERE profiles.user_id = auth.uid() 
    AND course_registrations.id = course_attendance.registration_id
    AND (
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

CREATE POLICY "Instructors and leaders can manage attendance" 
ON public.course_attendance 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro', 'discipulador', 'lider')
  )
);

-- Create RLS policies for course payments
CREATE POLICY "Users can view payments for their registrations" 
ON public.course_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    JOIN public.course_registrations ON course_registrations.leader_id = profiles.id
    WHERE profiles.user_id = auth.uid() 
    AND course_registrations.id = course_payments.registration_id
    AND (
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

CREATE POLICY "Leaders can manage payments for their members" 
ON public.course_payments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    JOIN public.course_registrations ON course_registrations.leader_id = profiles.id
    WHERE profiles.user_id = auth.uid() 
    AND course_registrations.id = course_payments.registration_id
    AND (
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create RLS policies for course assessments
CREATE POLICY "Anyone can view course assessments" 
ON public.course_assessments 
FOR SELECT 
USING (true);

CREATE POLICY "Pastors and obreiros can manage assessments" 
ON public.course_assessments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Create RLS policies for course grades
CREATE POLICY "Users can view grades for their registrations" 
ON public.course_grades 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    JOIN public.course_registrations ON course_registrations.leader_id = profiles.id
    WHERE profiles.user_id = auth.uid() 
    AND course_registrations.id = course_grades.registration_id
    AND (
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

CREATE POLICY "Instructors can manage grades" 
ON public.course_grades 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro', 'discipulador')
  )
);

-- Create RLS policies for course certificates
CREATE POLICY "Users can view their certificates" 
ON public.course_certificates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    JOIN public.course_registrations ON course_registrations.leader_id = profiles.id
    WHERE profiles.user_id = auth.uid() 
    AND course_registrations.id = course_certificates.registration_id
    AND (
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

CREATE POLICY "Pastors and obreiros can manage certificates" 
ON public.course_certificates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro')
  )
);

-- Insert sample courses (commented out - will be inserted manually after user registration)
-- INSERT INTO public.courses (
--   name, description, short_description, duration_weeks, price, 
--   difficulty_level, category, status, start_date, end_date,
--   requirements, learning_objectives, materials_included, certification_required,
--   certification_name, created_by
-- ) VALUES 
-- (
--   'Maturidade no Espírito',
--   'Curso completo de desenvolvimento espiritual e crescimento cristão, abordando fundamentos da fé, relacionamento com Deus e vida cristã prática.',
--   'Desenvolvimento espiritual e crescimento cristão',
--   8,
--   50.00,
--   'beginner',
--   'spiritual',
--   'active',
--   CURRENT_DATE + INTERVAL '7 days',
--   CURRENT_DATE + INTERVAL '63 days',
--   ARRAY['Ser membro ativo da igreja', 'Ter pelo menos 6 meses de conversão'],
--   ARRAY['Conhecer os fundamentos da fé cristã', 'Desenvolver relacionamento íntimo com Deus', 'Aplicar princípios bíblicos na vida diária'],
--   ARRAY['Apostila completa', 'Bíblia de estudo', 'Caderno de anotações'],
--   true,
--   'Certificado de Maturidade Espiritual',
--   (SELECT id FROM public.profiles WHERE role = 'pastor' LIMIT 1)
-- ),
-- (
--   'CTL - Curso de Treinamento de Liderança',
--   'Programa intensivo de formação de líderes, preparando discípulos para assumirem posições de liderança na igreja e na sociedade.',
--   'Formação de líderes cristãos',
--   12,
--   80.00,
--   'intermediate',
--   'leadership',
--   'active',
--   CURRENT_DATE + INTERVAL '14 days',
--   CURRENT_DATE + INTERVAL '98 days',
--   ARRAY['Ter completado Maturidade no Espírito', 'Ser indicado por um líder', 'Ter pelo menos 1 ano de conversão'],
--   ARRAY['Desenvolver habilidades de liderança', 'Aprender princípios de discipulado', 'Preparar-se para multiplicação'],
--   ARRAY['Manual do líder', 'Livros de referência', 'Material de apoio'],
--   true,
--   'Certificado de Liderança Cristã',
--   (SELECT id FROM public.profiles WHERE role = 'pastor' LIMIT 1)
-- );

-- Create indexes for better performance
CREATE INDEX idx_courses_status ON public.courses(status, active);
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_course_registrations_course_id ON public.course_registrations(course_id);
CREATE INDEX idx_course_registrations_student_id ON public.course_registrations(student_id);
CREATE INDEX idx_course_attendance_lesson_id ON public.course_attendance(lesson_id);
CREATE INDEX idx_course_attendance_registration_id ON public.course_attendance(registration_id);
CREATE INDEX idx_course_payments_registration_id ON public.course_payments(registration_id);
