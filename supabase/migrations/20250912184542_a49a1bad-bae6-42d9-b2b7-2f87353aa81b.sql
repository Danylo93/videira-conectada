-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('pastor', 'obreiro', 'discipulador', 'lider');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL,
  discipulador_id UUID REFERENCES public.profiles(id),
  pastor_id UUID REFERENCES public.profiles(id),
  celula TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('member', 'frequentador')),
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_presence DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policies for members
CREATE POLICY "Leaders can manage their own members" 
ON public.members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = members.lider_id OR 
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create cell reports table
CREATE TABLE public.cell_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  year INTEGER NOT NULL,
  multiplication_date DATE,
  observations TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lider_id, month, year)
);

-- Enable RLS for cell reports
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for cell reports
CREATE POLICY "Leaders can manage their own reports" 
ON public.cell_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = cell_reports.lider_id OR 
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (name IN ('Maturidade no Espírito', 'CTL')),
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  price DECIMAL(10,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default courses
INSERT INTO public.courses (name, description, duration, price) VALUES
('Maturidade no Espírito', 'Curso de maturidade espiritual para crescimento cristão', '8 semanas', 50.00),
('CTL', 'Curso de Treinamento de Liderança para formação de novos líderes', '12 semanas', 80.00);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policy for courses (public read)
CREATE POLICY "Anyone can view courses" 
ON public.courses 
FOR SELECT 
USING (active = true);

-- Create course registrations table
CREATE TABLE public.course_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for course registrations
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for course registrations
CREATE POLICY "Leaders can manage their members' registrations" 
ON public.course_registrations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = course_registrations.lider_id OR 
      profiles.role IN ('pastor', 'obreiro', 'discipulador')
    )
  )
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Encontro', 'Conferência', 'Imersão')),
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_capacity INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Anyone can view active events" 
ON public.events 
FOR SELECT 
USING (active = true);

CREATE POLICY "Authorized users can manage events" 
ON public.events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro', 'discipulador')
  )
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  discipulador_name TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for event registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy for event registrations
CREATE POLICY "Anyone can view event registrations" 
ON public.event_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can register for events" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cell_reports_updated_at
  BEFORE UPDATE ON public.cell_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_registrations_updated_at
  BEFORE UPDATE ON public.course_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with default role as 'lider'
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'lider'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert test users profiles (these will be created when users sign up)
-- We'll handle this in the application code to maintain the demo users