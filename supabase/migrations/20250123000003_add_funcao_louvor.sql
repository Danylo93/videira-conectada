-- Adicionar campo de função para o setor de Louvor
-- Este campo será usado para categorizar os servos no Louvor (Ministro, Violão, Voz 1, etc.)

-- Enum para as funções do Louvor
DO $$ BEGIN
    CREATE TYPE public.funcao_louvor AS ENUM (
      'ministro',
      'violao',
      'voz1',
      'voz2',
      'baixo',
      'teclado',
      'bateria',
      'guitarra'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna funcao_louvor na tabela escalas (opcional, apenas para área de louvor)
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS funcao_louvor public.funcao_louvor;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_escalas_funcao_louvor ON public.escalas(funcao_louvor) WHERE funcao_louvor IS NOT NULL;

