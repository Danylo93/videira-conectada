# Configuração do Tesoureiro

## Visão Geral

O sistema agora suporta a função de **Tesoureiro**, que permite que um usuário (normalmente um líder) tenha acesso às funcionalidades financeiras do sistema, além de suas funções normais.

## Como Funciona

- Um usuário pode ser **líder** E **tesoureiro** ao mesmo tempo
- O campo `is_tesoureiro` na tabela `profiles` controla essa função adicional
- Tesoureiros têm acesso a:
  - **Financeiro** (`/financeiro`)
  - **Dízimos e Ofertas** (`/dizimos-ofertas`)
  - **Dizimistas** (`/dizimistas`)

## Configurar Jonas Pereira como Tesoureiro

### Opção 1: Via Migration (Automático)

A migration `20250122000002_add_tesoureiro_field.sql` já inclui um comando para marcar Jonas Pereira automaticamente:

```sql
UPDATE public.profiles 
SET is_tesoureiro = true 
WHERE LOWER(name) LIKE '%jonas%pereira%' OR LOWER(name) LIKE '%jonas pereira%';
```

Execute a migration:
```bash
npx supabase migration up
```

### Opção 2: Via Supabase Dashboard (Manual)

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → **profiles**
3. Encontre o registro de "Jonas Pereira"
4. Edite o campo `is_tesoureiro` e altere para `true`
5. Salve as alterações

### Opção 3: Via SQL direto

Execute no SQL Editor do Supabase:

```sql
UPDATE public.profiles 
SET is_tesoureiro = true 
WHERE name ILIKE '%Jonas%Pereira%';
```

## Verificar se está Funcionando

1. Faça login com a conta de Jonas Pereira
2. Verifique se aparece o item "Dizimistas" na navegação
3. Verifique se aparece o item "Financeiro" na navegação
4. Tente acessar `/dizimistas` - deve funcionar
5. Tente acessar `/financeiro` - deve funcionar
6. Tente acessar `/dizimos-ofertas` - deve funcionar

## Adicionar Outros Tesoureiros

Para adicionar outros usuários como tesoureiros, execute:

```sql
UPDATE public.profiles 
SET is_tesoureiro = true 
WHERE email = 'email@exemplo.com';
-- ou
WHERE name ILIKE '%Nome do Usuário%';
```

## Remover Função de Tesoureiro

Para remover a função de tesoureiro de um usuário:

```sql
UPDATE public.profiles 
SET is_tesoureiro = false 
WHERE email = 'email@exemplo.com';
```

## Notas Importantes

- O campo `is_tesoureiro` é um boolean adicional, não substitui o role principal
- Um usuário pode ser `role = 'lider'` e `is_tesoureiro = true` simultaneamente
- Apenas **Pastor**, **Obreiro** e **Tesoureiro** têm acesso às funcionalidades financeiras
- A função de tesoureiro não aparece no enum `app_role`, é um campo separado para permitir múltiplas funções

