# Troubleshooting - Tesoureiro não vê Dizimistas

## Problema
O tesoureiro (Jonas Pereira) não consegue ver os dizimistas cadastrados.

## Verificações Necessárias

### 1. Verificar se o campo is_tesoureiro foi criado

Execute no SQL Editor do Supabase:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'is_tesoureiro';
```

Se não retornar nada, execute a migration:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_tesoureiro BOOLEAN NOT NULL DEFAULT false;
```

### 2. Verificar se Jonas Pereira está marcado como tesoureiro

Execute:

```sql
SELECT id, name, email, role, is_tesoureiro 
FROM public.profiles 
WHERE name ILIKE '%jonas%pereira%' OR name ILIKE '%jonas pereira%';
```

Se `is_tesoureiro` for `false` ou `null`, execute:

```sql
UPDATE public.profiles 
SET is_tesoureiro = true 
WHERE name ILIKE '%jonas%pereira%' OR name ILIKE '%jonas pereira%';
```

### 3. Verificar a política RLS da tabela dizimistas

Execute:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'dizimistas';
```

A política deve incluir `is_tesoureiro = true`. Se não estiver, execute:

```sql
DROP POLICY IF EXISTS "Pastors and obreiros can view dizimistas" ON public.dizimistas;
DROP POLICY IF EXISTS "Pastors, obreiros and tesoureiros can view dizimistas" ON public.dizimistas;

CREATE POLICY "Pastors, obreiros and tesoureiros can view dizimistas" 
ON public.dizimistas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.role IN ('pastor', 'obreiro')
      OR profiles.is_tesoureiro = true
    )
  )
);
```

### 4. Verificar se há dados na tabela dizimistas

Execute:

```sql
SELECT COUNT(*) as total FROM public.dizimistas;
```

Se retornar 0, não há dizimistas cadastrados ainda.

### 5. Testar acesso direto via SQL

Execute como o usuário do Jonas (substitua o user_id):

```sql
-- Primeiro, encontre o user_id do Jonas
SELECT id, name, email, user_id, role, is_tesoureiro 
FROM public.profiles 
WHERE name ILIKE '%jonas%pereira%';

-- Depois, teste a query (substitua o user_id)
SET LOCAL request.jwt.claim.sub = 'USER_ID_DO_JONAS_AQUI';
SELECT * FROM public.dizimistas;
```

### 6. Verificar no Console do Navegador

Abra o Console do navegador (F12) e verifique:
- Se aparece "User data:" com `isTesoureiro: true`
- Se aparece "Has financial access: true"
- Se há erros na query de dizimistas

## Solução Rápida

Execute todas as migrations em ordem:

```bash
npx supabase migration up
```

Ou execute manualmente no Supabase SQL Editor:

1. Execute `20250122000002_add_tesoureiro_field.sql`
2. Execute `20250122000003_update_dizimistas_rls_for_tesoureiro.sql`

## Após as Correções

1. Faça logout e login novamente com a conta do Jonas
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Verifique se o item "Dizimistas" aparece na navegação
4. Tente acessar `/dizimistas`

