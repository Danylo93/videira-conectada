-- Verificar e garantir que a tabela batismo_registrations existe e está configurada corretamente
-- Este script pode ser executado múltiplas vezes sem erros

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.batismo_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tamanho_camiseta TEXT NOT NULL CHECK (tamanho_camiseta IN ('P', 'M', 'G', 'GG')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_batismo_registrations_lider_id ON public.batismo_registrations(lider_id);
CREATE INDEX IF NOT EXISTS idx_batismo_registrations_created_at ON public.batismo_registrations(created_at);

-- Enable RLS se ainda não estiver habilitado
ALTER TABLE public.batismo_registrations ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Anyone can insert batismo registrations" ON public.batismo_registrations;
DROP POLICY IF EXISTS "Authenticated users can view batismo registrations" ON public.batismo_registrations;

-- Recriar políticas
CREATE POLICY "Anyone can insert batismo registrations" 
ON public.batismo_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view batismo registrations" 
ON public.batismo_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('pastor', 'obreiro', 'discipulador', 'lider')
  )
);

-- Criar ou substituir trigger para updated_at
DROP TRIGGER IF EXISTS update_batismo_registrations_updated_at ON public.batismo_registrations;

CREATE TRIGGER update_batismo_registrations_updated_at
BEFORE UPDATE ON public.batismo_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela está no schema público e visível
COMMENT ON TABLE public.batismo_registrations IS 'Tabela para cadastros de batismo - criada automaticamente';

