-- Criar tabela de eventos se não existir
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  max_capacity INTEGER,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remover constraint existente se houver e recriar com valores corretos
DO $$ 
BEGIN
  -- Remover constraint existente se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_type_check' 
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_type_check;
  END IF;
  
  -- Criar nova constraint com os valores corretos
  ALTER TABLE events ADD CONSTRAINT events_type_check 
    CHECK (type IN ('conferencia', 'retiro', 'workshop', 'culto', 'outro'));
END $$;

-- Criar tabela de inscrições em eventos se não existir
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  discipulador_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(active);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_participant ON event_registrations(participant_name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para eventos
-- Pastores e obreiros podem ver todos os eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Pastores e obreiros podem ver todos os eventos'
  ) THEN
    CREATE POLICY "Pastores e obreiros podem ver todos os eventos" ON events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;

-- Discipuladores e líderes podem ver eventos ativos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Discipuladores e líderes podem ver eventos ativos'
  ) THEN
    CREATE POLICY "Discipuladores e líderes podem ver eventos ativos" ON events
      FOR SELECT USING (
        active = true AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('discipulador', 'lider')
          )
        )
      );
  END IF;
END $$;

-- Apenas pastores e obreiros podem criar eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Apenas pastores e obreiros podem criar eventos'
  ) THEN
    CREATE POLICY "Apenas pastores e obreiros podem criar eventos" ON events
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;

-- Apenas pastores e obreiros podem atualizar eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Apenas pastores e obreiros podem atualizar eventos'
  ) THEN
    CREATE POLICY "Apenas pastores e obreiros podem atualizar eventos" ON events
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;

-- Apenas pastores e obreiros podem deletar eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Apenas pastores e obreiros podem deletar eventos'
  ) THEN
    CREATE POLICY "Apenas pastores e obreiros podem deletar eventos" ON events
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;

-- Políticas de segurança para inscrições em eventos
-- Todos podem ver suas próprias inscrições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_registrations' 
    AND policyname = 'Usuários podem ver suas próprias inscrições'
  ) THEN
    CREATE POLICY "Usuários podem ver suas próprias inscrições" ON event_registrations
      FOR SELECT USING (
        leader_name = (SELECT name FROM profiles WHERE id = auth.uid()) OR
        discipulador_name = (SELECT name FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Pastores e obreiros podem ver todas as inscrições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_registrations' 
    AND policyname = 'Pastores e obreiros podem ver todas as inscrições'
  ) THEN
    CREATE POLICY "Pastores e obreiros podem ver todas as inscrições" ON event_registrations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;

-- Discipuladores podem se inscrever em eventos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_registrations' 
    AND policyname = 'Discipuladores podem se inscrever em eventos'
  ) THEN
    CREATE POLICY "Discipuladores podem se inscrever em eventos" ON event_registrations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'discipulador'
        )
      );
  END IF;
END $$;

-- Usuários podem cancelar suas próprias inscrições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_registrations' 
    AND policyname = 'Usuários podem cancelar suas próprias inscrições'
  ) THEN
    CREATE POLICY "Usuários podem cancelar suas próprias inscrições" ON event_registrations
      FOR DELETE USING (
        leader_name = (SELECT name FROM profiles WHERE id = auth.uid()) OR
        discipulador_name = (SELECT name FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Pastores e obreiros podem cancelar qualquer inscrição
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_registrations' 
    AND policyname = 'Pastores e obreiros podem cancelar qualquer inscrição'
  ) THEN
    CREATE POLICY "Pastores e obreiros podem cancelar qualquer inscrição" ON event_registrations
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('pastor', 'obreiro')
        )
      );
  END IF;
END $$;
