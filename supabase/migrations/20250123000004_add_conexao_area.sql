-- Adicionar área de Conexão e suas subdivisões

-- Adicionar 'conexao' ao enum area_servico
DO $$ 
BEGIN
    -- Verificar se 'conexao' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'conexao' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'area_servico')
    ) THEN
        ALTER TYPE public.area_servico ADD VALUE 'conexao';
    END IF;
END $$;

-- Criar enum para funções de Conexão
DO $$ BEGIN
    CREATE TYPE public.funcao_conexao AS ENUM (
        'recepcao1',
        'recepcao2',
        'estacionamento1',
        'estacionamento2',
        'nave_igreja',
        'porta_kids'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna funcao_conexao na tabela escalas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'escalas' 
        AND column_name = 'funcao_conexao'
    ) THEN
        ALTER TABLE public.escalas 
        ADD COLUMN funcao_conexao public.funcao_conexao;
    END IF;
END $$;

-- Adicionar comentários para documentação
COMMENT ON TYPE public.funcao_conexao IS 'Funções dentro da área de Conexão: Recepção 1, Recepção 2, Estacionamento 1, Estacionamento 2, Nave da igreja, Porta dos Kids';
COMMENT ON COLUMN public.escalas.funcao_conexao IS 'Função específica dentro da área de Conexão (quando area = conexao)';

