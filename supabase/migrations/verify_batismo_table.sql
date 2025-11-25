-- Script para verificar e garantir que a tabela batismo_registrations está visível para webhooks
-- Execute este SQL no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'batismo_registrations';

-- 2. Garantir que está no schema público
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'batismo_registrations';

-- 3. Verificar permissões (opcional - apenas para debug)
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'batismo_registrations';

-- 4. Listar todas as tabelas do schema público (para comparação)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

