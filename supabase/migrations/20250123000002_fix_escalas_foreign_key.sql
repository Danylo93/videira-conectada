-- Fix foreign key constraint for escalas.servo_id
-- Remove any incorrect foreign key and recreate it pointing to servos table

-- Drop the incorrect foreign key if it exists
DO $$ 
BEGIN
  -- Verificar e remover foreign key antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'escalas_servo_id_fkey' 
    AND table_name = 'escalas'
  ) THEN
    ALTER TABLE public.escalas DROP CONSTRAINT escalas_servo_id_fkey;
    RAISE NOTICE 'Foreign key escalas_servo_id_fkey removida';
  END IF;
END $$;

-- Criar a foreign key correta apontando para servos
DO $$
BEGIN
  -- Verificar se a tabela servos existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'servos'
  ) THEN
    -- Verificar se a coluna servo_id existe na tabela escalas
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'escalas' 
      AND column_name = 'servo_id'
    ) THEN
      -- Criar a foreign key correta
      ALTER TABLE public.escalas 
      ADD CONSTRAINT escalas_servo_id_fkey 
      FOREIGN KEY (servo_id) 
      REFERENCES public.servos(id) 
      ON DELETE CASCADE;
      
      RAISE NOTICE 'Foreign key escalas_servo_id_fkey criada corretamente apontando para servos';
    ELSE
      RAISE NOTICE 'Coluna servo_id não encontrada na tabela escalas';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela servos não encontrada';
  END IF;
END $$;

