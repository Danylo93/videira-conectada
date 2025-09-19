-- Hierarchical Reports Flow Migration
-- Implements the correct flow: Leader -> Discipulador -> Pastor

-- ==================== UPDATE REPORTS TABLE ====================

-- Add hierarchical fields to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS discipulador_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS pastor_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS parent_report_id UUID REFERENCES public.reports(id),
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 1 CHECK (hierarchy_level IN (1, 2, 3)), -- 1: Leader, 2: Discipulador, 3: Pastor
ADD COLUMN IF NOT EXISTS aggregated_data JSONB; -- For discipulador and pastor reports

-- Update existing reports to have hierarchy_level = 1 (leader level)
UPDATE public.reports SET hierarchy_level = 1 WHERE hierarchy_level IS NULL;

-- ==================== CREATE REPORT AGGREGATION FUNCTIONS ====================

-- Function to aggregate leader reports into discipulador report
CREATE OR REPLACE FUNCTION public.aggregate_leader_reports_to_discipulador(
    p_discipulador_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    aggregated_data JSONB;
    leader_reports RECORD;
    total_meetings INTEGER := 0;
    total_attendance INTEGER := 0;
    total_visitors INTEGER := 0;
    total_conversions INTEGER := 0;
    total_offerings DECIMAL(10,2) := 0;
    cell_count INTEGER := 0;
BEGIN
    -- Get all leader reports for this discipulador in the period
    SELECT COUNT(*) INTO cell_count
    FROM public.profiles 
    WHERE discipulador_uuid = p_discipulador_id 
    AND role = 'lider';
    
    -- Aggregate data from leader reports
    FOR leader_reports IN
        SELECT r.data, r.report_type
        FROM public.reports r
        JOIN public.profiles p ON r.submitted_by = p.user_id
        WHERE p.discipulador_uuid = p_discipulador_id
        AND r.period_start >= p_period_start
        AND r.period_end <= p_period_end
        AND r.hierarchy_level = 1
        AND r.status = 'submitted'
    LOOP
        -- Aggregate cell report data
        IF leader_reports.report_type = 'cell' THEN
            total_meetings := total_meetings + COALESCE((leader_reports.data->>'total_meetings')::INTEGER, 0);
            total_attendance := total_attendance + COALESCE((leader_reports.data->>'total_attendance')::INTEGER, 0);
            total_visitors := total_visitors + COALESCE((leader_reports.data->>'total_visitors')::INTEGER, 0);
            total_conversions := total_conversions + COALESCE((leader_reports.data->>'total_conversions')::INTEGER, 0);
        END IF;
        
        -- Aggregate culto report data
        IF leader_reports.report_type = 'culto' THEN
            total_attendance := total_attendance + COALESCE((leader_reports.data->>'total_presence')::INTEGER, 0);
            total_visitors := total_visitors + COALESCE((leader_reports.data->>'total_visitors_culto')::INTEGER, 0);
            total_conversions := total_conversions + COALESCE((leader_reports.data->>'total_conversions_culto')::INTEGER, 0);
            total_offerings := total_offerings + COALESCE((leader_reports.data->>'total_offerings')::DECIMAL, 0);
        END IF;
    END LOOP;
    
    -- Build aggregated data
    aggregated_data := jsonb_build_object(
        'total_cells', cell_count,
        'total_meetings', total_meetings,
        'total_attendance', total_attendance,
        'total_visitors', total_visitors,
        'total_conversions', total_conversions,
        'total_offerings', total_offerings,
        'average_attendance_per_cell', CASE WHEN cell_count > 0 THEN total_attendance / cell_count ELSE 0 END,
        'conversion_rate', CASE WHEN total_visitors > 0 THEN (total_conversions::DECIMAL / total_visitors) * 100 ELSE 0 END,
        'aggregated_from', 'leader_reports',
        'period_start', p_period_start,
        'period_end', p_period_end
    );
    
    RETURN aggregated_data;
END;
$$;

-- Function to aggregate discipulador reports into pastor report
CREATE OR REPLACE FUNCTION public.aggregate_discipulador_reports_to_pastor(
    p_pastor_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    aggregated_data JSONB;
    discipulador_reports RECORD;
    total_networks INTEGER := 0;
    total_cells INTEGER := 0;
    total_meetings INTEGER := 0;
    total_attendance INTEGER := 0;
    total_visitors INTEGER := 0;
    total_conversions INTEGER := 0;
    total_offerings DECIMAL(10,2) := 0;
BEGIN
    -- Count networks (discipuladores)
    SELECT COUNT(*) INTO total_networks
    FROM public.profiles 
    WHERE pastor_uuid = p_pastor_id 
    AND role = 'discipulador';
    
    -- Aggregate data from discipulador reports
    FOR discipulador_reports IN
        SELECT r.aggregated_data
        FROM public.reports r
        JOIN public.profiles p ON r.submitted_by = p.user_id
        WHERE p.pastor_uuid = p_pastor_id
        AND r.period_start >= p_period_start
        AND r.period_end <= p_period_end
        AND r.hierarchy_level = 2
        AND r.status = 'submitted'
    LOOP
        total_cells := total_cells + COALESCE((discipulador_reports.aggregated_data->>'total_cells')::INTEGER, 0);
        total_meetings := total_meetings + COALESCE((discipulador_reports.aggregated_data->>'total_meetings')::INTEGER, 0);
        total_attendance := total_attendance + COALESCE((discipulador_reports.aggregated_data->>'total_attendance')::INTEGER, 0);
        total_visitors := total_visitors + COALESCE((discipulador_reports.aggregated_data->>'total_visitors')::INTEGER, 0);
        total_conversions := total_conversions + COALESCE((discipulador_reports.aggregated_data->>'total_conversions')::INTEGER, 0);
        total_offerings := total_offerings + COALESCE((discipulador_reports.aggregated_data->>'total_offerings')::DECIMAL, 0);
    END LOOP;
    
    -- Build aggregated data
    aggregated_data := jsonb_build_object(
        'total_networks', total_networks,
        'total_cells', total_cells,
        'total_meetings', total_meetings,
        'total_attendance', total_attendance,
        'total_visitors', total_visitors,
        'total_conversions', total_conversions,
        'total_offerings', total_offerings,
        'average_attendance_per_network', CASE WHEN total_networks > 0 THEN total_attendance / total_networks ELSE 0 END,
        'conversion_rate', CASE WHEN total_visitors > 0 THEN (total_conversions::DECIMAL / total_visitors) * 100 ELSE 0 END,
        'aggregated_from', 'discipulador_reports',
        'period_start', p_period_start,
        'period_end', p_period_end
    );
    
    RETURN aggregated_data;
END;
$$;

-- ==================== UPDATE RLS POLICIES ====================

-- Update reports RLS to support hierarchical access
DROP POLICY IF EXISTS "Discipuladores podem ver relatórios de sua rede" ON public.reports;
DROP POLICY IF EXISTS "Líderes podem ver seus próprios relatórios" ON public.reports;

-- New hierarchical policies
CREATE POLICY "Líderes podem ver e gerenciar seus próprios relatórios" ON public.reports
    FOR ALL USING (
        submitted_by = auth.uid() AND hierarchy_level = 1
    );

CREATE POLICY "Discipuladores podem ver relatórios de sua rede" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'discipulador'
            AND (
                -- Can see leader reports from their network
                (hierarchy_level = 1 AND EXISTS (
                    SELECT 1 FROM public.profiles p2 
                    WHERE p2.user_id = reports.submitted_by 
                    AND p2.discipulador_uuid = profiles.id
                ))
                OR
                -- Can see their own discipulador reports
                (hierarchy_level = 2 AND submitted_by = auth.uid())
            )
        )
    );

CREATE POLICY "Discipuladores podem criar relatórios de rede" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'discipulador'
            AND hierarchy_level = 2
        )
    );

CREATE POLICY "Pastores podem ver todos os relatórios" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('pastor', 'obreiro')
        )
    );

-- ==================== CREATE HELPER FUNCTIONS ====================

-- Function to get user's hierarchy level
CREATE OR REPLACE FUNCTION public.get_user_hierarchy_level(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE user_id = p_user_id;
    
    CASE user_role
        WHEN 'lider' THEN RETURN 1;
        WHEN 'discipulador' THEN RETURN 2;
        WHEN 'pastor' THEN RETURN 3;
        WHEN 'obreiro' THEN RETURN 3;
        ELSE RETURN 0;
    END CASE;
END;
$$;

-- Function to get user's network (leaders under discipulador)
CREATE OR REPLACE FUNCTION public.get_user_network(p_user_id UUID)
RETURNS TABLE(leader_id UUID, leader_name TEXT, leader_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.email
    FROM public.profiles p
    WHERE p.discipulador_uuid = (
        SELECT id FROM public.profiles WHERE user_id = p_user_id
    )
    AND p.role = 'lider';
END;
$$;

-- Function to get user's networks (discipuladores under pastor)
CREATE OR REPLACE FUNCTION public.get_user_networks(p_user_id UUID)
RETURNS TABLE(discipulador_id UUID, discipulador_name TEXT, discipulador_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.email
    FROM public.profiles p
    WHERE p.pastor_uuid = (
        SELECT id FROM public.profiles WHERE user_id = p_user_id
    )
    AND p.role = 'discipulador';
END;
$$;

-- ==================== CREATE INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_reports_hierarchy_level ON public.reports(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_reports_leader_id ON public.reports(leader_id);
CREATE INDEX IF NOT EXISTS idx_reports_discipulador_id ON public.reports(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_reports_pastor_id ON public.reports(pastor_id);
CREATE INDEX IF NOT EXISTS idx_reports_parent_report_id ON public.reports(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_profiles_discipulador_uuid ON public.profiles(discipulador_uuid);
CREATE INDEX IF NOT EXISTS idx_profiles_pastor_uuid ON public.profiles(pastor_uuid);

-- ==================== SAMPLE DATA FOR TESTING ====================

-- Note: Sample data will be inserted through the application interface
-- to maintain proper foreign key relationships and user authentication
