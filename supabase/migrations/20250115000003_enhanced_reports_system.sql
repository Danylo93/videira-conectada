-- Enhanced Reports System Migration
-- Comprehensive reporting system connecting leaders to pastors

-- ==================== CULTOS (SERVICES) TABLES ====================

-- Cultos table
CREATE TABLE IF NOT EXISTS public.cultos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('adultos', 'jovens', 'criancas', 'especial')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(255),
    pastor_id UUID REFERENCES auth.users(id),
    obreiro_id UUID REFERENCES auth.users(id),
    total_attendance INTEGER DEFAULT 0,
    total_visitors INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_offerings DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Culto Attendance table
CREATE TABLE IF NOT EXISTS public.culto_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    culto_id UUID NOT NULL REFERENCES public.cultos(id) ON DELETE CASCADE,
    member_id UUID REFERENCES auth.users(id),
    visitor_name VARCHAR(255),
    visitor_phone VARCHAR(20),
    visitor_email VARCHAR(255),
    is_member BOOLEAN DEFAULT false,
    is_visitor BOOLEAN DEFAULT false,
    is_conversion BOOLEAN DEFAULT false,
    attendance_type VARCHAR(20) DEFAULT 'present' CHECK (attendance_type IN ('present', 'absent', 'late')),
    notes TEXT,
    registered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== LISTA DE PERDIDOS ====================

-- Lost Members table
CREATE TABLE IF NOT EXISTS public.lost_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    last_attendance_date DATE,
    last_cell_meeting_date DATE,
    last_culto_date DATE,
    reason VARCHAR(100) CHECK (reason IN ('moved', 'work', 'family', 'health', 'other', 'unknown')),
    reason_details TEXT,
    status VARCHAR(20) DEFAULT 'lost' CHECK (status IN ('lost', 'contacted', 'returned', 'transferred')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    contact_attempts INTEGER DEFAULT 0,
    last_contact_date DATE,
    last_contact_method VARCHAR(50),
    last_contact_notes TEXT,
    return_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Attempts table
CREATE TABLE IF NOT EXISTS public.contact_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lost_member_id UUID NOT NULL REFERENCES public.lost_members(id) ON DELETE CASCADE,
    contact_method VARCHAR(50) NOT NULL CHECK (contact_method IN ('phone', 'whatsapp', 'email', 'visit', 'letter', 'other')),
    contact_date DATE NOT NULL,
    contact_time TIME,
    success BOOLEAN DEFAULT false,
    response VARCHAR(20) CHECK (response IN ('answered', 'no_answer', 'busy', 'refused', 'wrong_number')),
    notes TEXT,
    next_contact_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== RELATÓRIOS HIERÁRQUICOS ====================

-- Report Templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cell', 'culto', 'monthly', 'quarterly', 'annual', 'custom')),
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.report_templates(id),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('cell', 'culto', 'monthly', 'quarterly', 'annual', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Submissions table
CREATE TABLE IF NOT EXISTS public.report_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    submitted_to UUID NOT NULL REFERENCES auth.users(id),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ROW LEVEL SECURITY POLICIES ====================

-- Cultos RLS
ALTER TABLE public.cultos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todos os cultos" ON public.cultos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver cultos de sua rede" ON public.cultos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver cultos gerais" ON public.cultos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar cultos" ON public.cultos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- Culto Attendance RLS
ALTER TABLE public.culto_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todas as presenças" ON public.culto_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver presenças de sua rede" ON public.culto_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver presenças de seus membros" ON public.culto_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar presenças" ON public.culto_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- Lost Members RLS
ALTER TABLE public.lost_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todos os perdidos" ON public.lost_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver perdidos de sua rede" ON public.lost_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver perdidos de seus membros" ON public.lost_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar perdidos" ON public.lost_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- Contact Attempts RLS
ALTER TABLE public.contact_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todas as tentativas" ON public.contact_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver tentativas de sua rede" ON public.contact_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver tentativas de seus membros" ON public.contact_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar tentativas" ON public.contact_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- Report Templates RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem gerenciar templates" ON public.report_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Todos podem ver templates ativos" ON public.report_templates
    FOR SELECT USING (is_active = true);

-- Reports RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todos os relatórios" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver relatórios de sua rede" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver seus próprios relatórios" ON public.reports
    FOR SELECT USING (
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar relatórios" ON public.reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- Report Submissions RLS
ALTER TABLE public.report_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastores e obreiros podem ver todas as submissões" ON public.report_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

CREATE POLICY "Discipuladores podem ver submissões de sua rede" ON public.report_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'discipulador'
        )
    );

CREATE POLICY "Líderes podem ver suas próprias submissões" ON public.report_submissions
    FOR SELECT USING (
        submitted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'lider'
        )
    );

CREATE POLICY "Pastores e obreiros podem gerenciar submissões" ON public.report_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_cultos_date ON public.cultos(date);
CREATE INDEX IF NOT EXISTS idx_cultos_type ON public.cultos(type);
CREATE INDEX IF NOT EXISTS idx_cultos_pastor ON public.cultos(pastor_id);
CREATE INDEX IF NOT EXISTS idx_culto_attendance_culto ON public.culto_attendance(culto_id);
CREATE INDEX IF NOT EXISTS idx_culto_attendance_member ON public.culto_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_lost_members_status ON public.lost_members(status);
CREATE INDEX IF NOT EXISTS idx_lost_members_priority ON public.lost_members(priority);
CREATE INDEX IF NOT EXISTS idx_lost_members_assigned ON public.lost_members(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_lost_member ON public.contact_attempts(lost_member_id);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_date ON public.contact_attempts(contact_date);
CREATE INDEX IF NOT EXISTS idx_reports_period ON public.reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_report_submissions_report ON public.report_submissions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_submissions_submitted_by ON public.report_submissions(submitted_by);

-- ==================== TRIGGERS ====================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cultos_updated_at BEFORE UPDATE ON public.cultos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lost_members_updated_at BEFORE UPDATE ON public.lost_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== SAMPLE DATA ====================

-- Insert sample cultos
INSERT INTO public.cultos (name, description, type, date, start_time, end_time, location, pastor_id, obreiro_id, total_attendance, total_visitors, total_conversions, total_offerings, notes, status) VALUES
('Culto de Jovens - Fogo Jovem', 'Culto especial para jovens com louvor e palavra', 'jovens', '2024-01-15', '19:00:00', '21:00:00', 'Templo Principal', NULL, NULL, 45, 8, 2, 150.00, 'Culto muito abençoado com várias conversões', 'completed'),
('Culto de Adultos - Avivamento', 'Culto de avivamento para adultos', 'adultos', '2024-01-14', '19:30:00', '21:30:00', 'Templo Principal', NULL, NULL, 120, 15, 5, 350.00, 'Culto de avivamento com muitas bênçãos', 'completed'),
('Culto de Crianças - Pequenos Heróis', 'Culto especial para crianças', 'criancas', '2024-01-13', '09:00:00', '11:00:00', 'Salão das Crianças', NULL, NULL, 25, 3, 1, 75.00, 'Culto das crianças com muitas atividades', 'completed');

-- Sample data will be inserted through the application interface
-- to avoid foreign key constraint violations
