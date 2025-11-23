-- Create escalas system
-- Tabela para armazenar as escalas semanais

-- Enum para as áreas de serviço
DO $$ BEGIN
    CREATE TYPE public.area_servico AS ENUM ('midia', 'domingo_kids', 'louvor', 'mesa_som', 'cantina');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de servos (pessoas que podem ser escaladas)
CREATE TABLE IF NOT EXISTS public.servos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de escalas
CREATE TABLE IF NOT EXISTS public.escalas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana_inicio DATE NOT NULL, -- Data do sábado da semana
  area area_servico NOT NULL,
  servo_id UUID NOT NULL,
  dia TEXT NOT NULL CHECK (dia IN ('sabado', 'domingo')),
  locked BOOLEAN NOT NULL DEFAULT false, -- Se true, não pode ser alterado (exceto por pastor/líder/discipulador)
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(semana_inicio, area, servo_id, dia) -- Garante que um servo não pode estar na mesma área no mesmo dia da mesma semana
);

-- Adicionar foreign key para servo_id após criar a tabela
DO $$
BEGIN
  -- Verificar se a foreign key já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'escalas_servo_id_fkey' 
    AND table_name = 'escalas'
    AND table_schema = 'public'
  ) THEN
    -- Verificar se a tabela servos existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'servos'
    ) THEN
      ALTER TABLE public.escalas 
      ADD CONSTRAINT escalas_servo_id_fkey 
      FOREIGN KEY (servo_id) 
      REFERENCES public.servos(id) 
      ON DELETE CASCADE;
      
      RAISE NOTICE 'Foreign key escalas_servo_id_fkey criada';
    END IF;
  END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_escalas_semana ON public.escalas(semana_inicio);
CREATE INDEX IF NOT EXISTS idx_escalas_servo ON public.escalas(servo_id);
CREATE INDEX IF NOT EXISTS idx_escalas_area ON public.escalas(area);
CREATE INDEX IF NOT EXISTS idx_servos_ativo ON public.servos(ativo);

-- Função para verificar se um servo já está em outra escala na mesma semana/dia
CREATE OR REPLACE FUNCTION public.check_servo_duplicado()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o servo já está em outra escala no mesmo dia da mesma semana
  IF EXISTS (
    SELECT 1 FROM public.escalas
    WHERE semana_inicio = NEW.semana_inicio
      AND dia = NEW.dia
      AND servo_id = NEW.servo_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Servo já está escalado para este dia nesta semana';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar duplicatas
DROP TRIGGER IF EXISTS check_servo_duplicado_trigger ON public.escalas;
CREATE TRIGGER check_servo_duplicado_trigger
  BEFORE INSERT OR UPDATE ON public.escalas
  FOR EACH ROW
  EXECUTE FUNCTION public.check_servo_duplicado();

-- Enable RLS
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar escalas
DROP POLICY IF EXISTS "Anyone can view escalas" ON public.escalas;
CREATE POLICY "Anyone can view escalas"
ON public.escalas
FOR SELECT
USING (true);

-- Policy: Apenas pastor, discipulador ou líder podem criar/atualizar escalas
DROP POLICY IF EXISTS "Authorized users can manage escalas" ON public.escalas;
CREATE POLICY "Authorized users can manage escalas"
ON public.escalas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
);

-- Policy: Apenas pastor, discipulador ou líder podem atualizar escalas não bloqueadas
-- Ou podem atualizar qualquer escala se forem pastor/discipulador/líder
DROP POLICY IF EXISTS "Authorized users can update escalas" ON public.escalas;
CREATE POLICY "Authorized users can update escalas"
ON public.escalas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
  AND (
    locked = false
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('pastor', 'discipulador', 'lider')
    )
  )
);

-- Policy: Apenas pastor, discipulador ou líder podem deletar escalas
DROP POLICY IF EXISTS "Authorized users can delete escalas" ON public.escalas;
CREATE POLICY "Authorized users can delete escalas"
ON public.escalas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_escalas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_escalas_updated_at ON public.escalas;
CREATE TRIGGER update_escalas_updated_at
  BEFORE UPDATE ON public.escalas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_escalas_updated_at();

-- Enable RLS para servos
ALTER TABLE public.servos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar servos ativos, ou usuários autorizados podem ver todos
DROP POLICY IF EXISTS "Anyone can view servos" ON public.servos;
CREATE POLICY "Anyone can view servos"
ON public.servos
FOR SELECT
USING (
  ativo = true
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
);

-- Policy: Apenas pastor, discipulador ou líder podem gerenciar servos
DROP POLICY IF EXISTS "Authorized users can manage servos" ON public.servos;
CREATE POLICY "Authorized users can manage servos"
ON public.servos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
);

-- Função para atualizar updated_at dos servos
CREATE OR REPLACE FUNCTION public.update_servos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at dos servos
DROP TRIGGER IF EXISTS update_servos_updated_at ON public.servos;
CREATE TRIGGER update_servos_updated_at
  BEFORE UPDATE ON public.servos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_servos_updated_at();

