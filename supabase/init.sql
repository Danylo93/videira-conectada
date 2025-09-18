-- Script de inicialização do banco de dados para Docker
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar tabela de perfis (se não existir)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('pastor', 'obreiro', 'discipulador', 'lider')),
    phone VARCHAR(20),
    discipulador_uuid UUID REFERENCES profiles(id),
    pastor_uuid UUID REFERENCES profiles(id),
    celula VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de membros (se não existir)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('member', 'frequentador')),
    lider_id UUID NOT NULL REFERENCES profiles(id),
    active BOOLEAN DEFAULT true,
    join_date DATE DEFAULT CURRENT_DATE,
    last_presence DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relatórios de células (se não existir)
CREATE TABLE IF NOT EXISTS cell_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lider_id UUID NOT NULL REFERENCES profiles(id),
    week_start DATE NOT NULL,
    members_present UUID[] DEFAULT '{}',
    visitors_present UUID[] DEFAULT '{}',
    new_members UUID[] DEFAULT '{}',
    phase VARCHAR(50) NOT NULL CHECK (phase IN ('Comunhão', 'Edificação', 'Evangelismo', 'Multiplicação')),
    multiplication_date DATE,
    observations TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'needs_correction')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de eventos (se não existir)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Encontro', 'Conferência', 'Imersão')),
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    max_capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de cursos (se não existir)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL CHECK (name IN ('Maturidade no Espírito', 'CTL')),
    description TEXT,
    duration VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de inscrições em cursos (se não existir)
CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id),
    member_id UUID NOT NULL REFERENCES members(id),
    lider_id UUID NOT NULL REFERENCES profiles(id),
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_members_lider_id ON members(lider_id);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(active);
CREATE INDEX IF NOT EXISTS idx_cell_reports_lider_id ON cell_reports(lider_id);
CREATE INDEX IF NOT EXISTS idx_cell_reports_week_start ON cell_reports(week_start);
CREATE INDEX IF NOT EXISTS idx_cell_reports_status ON cell_reports(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_reports_updated_at BEFORE UPDATE ON cell_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_registrations_updated_at BEFORE UPDATE ON course_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo (opcional)
INSERT INTO profiles (user_id, name, email, role) VALUES 
    (uuid_generate_v4(), 'Pastor Principal', 'pastor@videira.com', 'pastor'),
    (uuid_generate_v4(), 'Obreiro Principal', 'obreiro@videira.com', 'obreiro')
ON CONFLICT (email) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE members IS 'Membros das células';
COMMENT ON TABLE cell_reports IS 'Relatórios semanais das células';
COMMENT ON TABLE events IS 'Eventos da igreja';
COMMENT ON TABLE courses IS 'Cursos disponíveis';
COMMENT ON TABLE course_registrations IS 'Inscrições em cursos';

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados Videira Conectada inicializado com sucesso!';
END $$;
