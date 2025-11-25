-- Fix batismo_registrations table: rename numero_camiseta to tamanho_camiseta
-- This migration handles both cases: if table exists with old column or if it needs to be created

-- First, check if table exists and has the old column name
DO $$
BEGIN
  -- If table exists with numero_camiseta column, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'batismo_registrations' 
    AND column_name = 'numero_camiseta'
  ) THEN
    -- Rename the column
    ALTER TABLE public.batismo_registrations 
    RENAME COLUMN numero_camiseta TO tamanho_camiseta;
    
    -- Drop existing check constraint if it exists
    ALTER TABLE public.batismo_registrations 
    DROP CONSTRAINT IF EXISTS batismo_registrations_numero_camiseta_check;
    
    -- Add new check constraint for tamanho_camiseta
    ALTER TABLE public.batismo_registrations 
    ADD CONSTRAINT batismo_registrations_tamanho_camiseta_check 
    CHECK (tamanho_camiseta IN ('P', 'M', 'G', 'GG'));
    
    RAISE NOTICE 'Column renamed from numero_camiseta to tamanho_camiseta';
  END IF;
  
  -- If table exists but column doesn't exist at all, add it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'batismo_registrations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'batismo_registrations' 
    AND column_name = 'tamanho_camiseta'
  ) THEN
    -- Add the column with constraint
    ALTER TABLE public.batismo_registrations 
    ADD COLUMN tamanho_camiseta TEXT NOT NULL DEFAULT 'M';
    
    ALTER TABLE public.batismo_registrations 
    ADD CONSTRAINT batismo_registrations_tamanho_camiseta_check 
    CHECK (tamanho_camiseta IN ('P', 'M', 'G', 'GG'));
    
    ALTER TABLE public.batismo_registrations 
    ALTER COLUMN tamanho_camiseta DROP DEFAULT;
    
    RAISE NOTICE 'Column tamanho_camiseta added to batismo_registrations';
  END IF;
  
  -- Ensure constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'batismo_registrations_tamanho_camiseta_check'
  ) THEN
    ALTER TABLE public.batismo_registrations 
    ADD CONSTRAINT batismo_registrations_tamanho_camiseta_check 
    CHECK (tamanho_camiseta IN ('P', 'M', 'G', 'GG'));
    
    RAISE NOTICE 'Constraint batismo_registrations_tamanho_camiseta_check added';
  END IF;
END $$;

