-- Criar tabela de eventos de encontro
CREATE TABLE IF NOT EXISTS encounter_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_dates DATE[] NOT NULL, -- Array de datas para o encontro
  location VARCHAR(255) NOT NULL,
  encounter_type VARCHAR(20) NOT NULL CHECK (encounter_type IN ('jovens', 'adultos')),
  max_capacity INTEGER,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para encounter_events
ALTER TABLE encounter_events ENABLE ROW LEVEL SECURITY;

-- Criar políticas para encounter_events
CREATE POLICY "Anyone can view active encounter events" 
ON encounter_events 
FOR SELECT 
USING (true);

CREATE POLICY "Authorized users can manage encounter events" 
ON encounter_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'discipulador')
  )
);

-- Adicionar coluna event_id na tabela encounter_with_god se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'encounter_with_god' 
    AND column_name = 'event_id'
  ) THEN
    ALTER TABLE encounter_with_god 
    ADD COLUMN event_id UUID REFERENCES encounter_events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_encounter_events_encounter_type ON encounter_events(encounter_type);
CREATE INDEX IF NOT EXISTS idx_encounter_events_created_by ON encounter_events(created_by);
CREATE INDEX IF NOT EXISTS idx_encounter_events_event_dates ON encounter_events USING GIN(event_dates);
CREATE INDEX IF NOT EXISTS idx_encounter_with_god_event_id ON encounter_with_god(event_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_encounter_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_encounter_events_updated_at ON encounter_events;
CREATE TRIGGER update_encounter_events_updated_at
  BEFORE UPDATE ON encounter_events
  FOR EACH ROW
  EXECUTE FUNCTION update_encounter_events_updated_at();

