-- Permitir edição pública de escalas
-- Esta migration ajusta as RLS policies para permitir que qualquer pessoa possa editar escalas

-- Primeiro, precisamos obter ou criar um perfil "sistema" para usar como created_by padrão
-- Vamos buscar um pastor ou criar um UUID fixo para operações públicas

-- Criar uma função que retorna um UUID de perfil sistema (primeiro pastor encontrado)
CREATE OR REPLACE FUNCTION public.get_system_profile_id()
RETURNS UUID AS $$
DECLARE
  system_id UUID;
BEGIN
  -- Tentar pegar o primeiro pastor encontrado como sistema
  SELECT id INTO system_id
  FROM public.profiles
  WHERE role = 'pastor'
  LIMIT 1;
  
  -- Se não encontrar, retornar NULL (vai usar um valor padrão)
  RETURN COALESCE(system_id, NULL);
END;
$$ LANGUAGE plpgsql;

-- Remover policies antigas que podem conflitar
DROP POLICY IF EXISTS "Authorized users can manage escalas" ON public.escalas;
DROP POLICY IF EXISTS "Authorized users can update escalas" ON public.escalas;
DROP POLICY IF EXISTS "Authorized users can delete escalas" ON public.escalas;

-- Policy: Permitir que qualquer pessoa possa inserir escalas (para versão pública)
-- Usar service_role para criar com created_by válido
CREATE POLICY "Public can insert escalas"
ON public.escalas
FOR INSERT
WITH CHECK (true);

-- Policy simplificada: Permitir que qualquer pessoa possa atualizar escalas
-- Permite atualizar sempre, incluindo o campo locked (para bloquear/desbloquear)
-- A proteção para não mover escalas bloqueadas é feita no código da aplicação (handleDragEnd)
CREATE POLICY "Public can update escalas"
ON public.escalas
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Permitir que qualquer pessoa possa deletar escalas não bloqueadas
CREATE POLICY "Public can delete unlocked escalas"
ON public.escalas
FOR DELETE
USING (
  locked = false
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('pastor', 'discipulador', 'lider')
  )
);

-- Permitir que qualquer pessoa possa gerenciar servos (para versão pública)
DROP POLICY IF EXISTS "Authorized users can manage servos" ON public.servos;
CREATE POLICY "Public can manage servos"
ON public.servos
FOR ALL
USING (true)
WITH CHECK (true);

