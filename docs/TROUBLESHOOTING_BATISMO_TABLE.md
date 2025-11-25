# Solução: Tabela batismo_registrations não aparece no Webhook

Se a tabela `batismo_registrations` não aparece na lista de tabelas ao configurar o webhook, siga estes passos:

## 1. Verificar se a tabela existe

Execute este SQL no SQL Editor do Supabase:

```sql
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename = 'batismo_registrations';
```

**Resultado esperado**: Deve retornar `public.batismo_registrations`

## 2. Verificar se a tabela está no schema público

```sql
SELECT 
    table_schema,
    table_name 
FROM information_schema.tables 
WHERE table_name = 'batismo_registrations';
```

## 3. Se a tabela existir mas não aparecer no dropdown

### Solução A: Atualizar cache do Supabase

1. Feche completamente o navegador
2. Abra novamente e acesse o Supabase Dashboard
3. Vá em Database > Webhooks
4. Tente criar o webhook novamente

### Solução B: Usar o nome completo da tabela

No campo de seleção, tente digitar manualmente:
- `public.batismo_registrations`

### Solução C: Verificar permissões

Execute este SQL para garantir que a tabela está acessível:

```sql
-- Garantir que a tabela está no schema público
ALTER TABLE IF EXISTS batismo_registrations SET SCHEMA public;

-- Verificar permissões
GRANT ALL ON TABLE public.batismo_registrations TO authenticated;
GRANT ALL ON TABLE public.batismo_registrations TO anon;
GRANT ALL ON TABLE public.batismo_registrations TO service_role;
```

## 4. Criar webhook manualmente via SQL (Alternativa)

Se nada funcionar, você pode criar o webhook diretamente via SQL. Mas note que os webhooks do Supabase são normalmente criados via Dashboard. Esta é uma alternativa se o Dashboard não funcionar:

```sql
-- Nota: Webhooks do Supabase são geralmente criados via Dashboard
-- Esta query apenas verifica se a tabela está acessível para webhooks
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'batismo_registrations';
```

## 5. Verificar se há dados na tabela

```sql
SELECT COUNT(*) FROM public.batismo_registrations;
```

Se retornar um número, a tabela existe e está funcionando.

## 6. Contato com Suporte

Se após todos esses passos a tabela ainda não aparecer no dropdown:

1. Verifique se você está no projeto correto do Supabase
2. Verifique se você tem permissões de administrador
3. Tente criar o webhook em outro navegador ou modo anônimo
4. Entre em contato com o suporte do Supabase se o problema persistir


