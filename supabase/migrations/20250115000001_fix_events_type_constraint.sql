-- Migração para corrigir a constraint de tipo de eventos
-- Execute este SQL diretamente no painel do Supabase

-- Remover constraint existente se houver
DO $$ 
BEGIN
  -- Verificar se a constraint existe e removê-la
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_type_check' 
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_type_check;
    RAISE NOTICE 'Constraint events_type_check removida com sucesso';
  ELSE
    RAISE NOTICE 'Constraint events_type_check não encontrada';
  END IF;
END $$;

-- Criar nova constraint com os valores corretos
ALTER TABLE events ADD CONSTRAINT events_type_check 
  CHECK (type IN ('conferencia', 'retiro', 'workshop', 'culto', 'outro'));

-- Verificar se a constraint foi criada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_type_check' 
    AND table_name = 'events'
  ) THEN
    RAISE NOTICE 'Nova constraint events_type_check criada com sucesso';
  ELSE
    RAISE NOTICE 'Erro ao criar constraint events_type_check';
  END IF;
END $$;
