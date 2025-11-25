-- Correção rápida para permitir bloquear/desbloquear escalas na versão pública
-- Execute este SQL diretamente no Supabase SQL Editor

-- Remover a política antiga que está causando o problema
DROP POLICY IF EXISTS "Public can update unlocked escalas" ON public.escalas;

-- Criar nova política que permite atualizar sempre (incluindo o campo locked)
CREATE POLICY "Public can update escalas"
ON public.escalas
FOR UPDATE
USING (true)
WITH CHECK (true);

