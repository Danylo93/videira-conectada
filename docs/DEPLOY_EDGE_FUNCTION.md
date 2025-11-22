# Como Fazer Deploy da Edge Function

## Erro: "Requested function was not found"

Este erro significa que a Edge Function não foi deployada no Supabase. Siga os passos abaixo:

## Passo 1: Verificar se está logado no Supabase CLI

```bash
# Verificar se está logado
npx supabase login

# Se não estiver logado, faça login
# Isso abrirá o navegador para autenticação
```

## Passo 2: Linkar o projeto local ao projeto Supabase

```bash
# No diretório do projeto
npx supabase link --project-ref seu-project-ref

# O project-ref pode ser encontrado na URL do Supabase:
# https://app.supabase.com/project/wkdfeizgfdkkkyatevpc
# O project-ref é: wkdfeizgfdkkkyatevpc
```

## Passo 3: Fazer deploy da função

```bash
# Deploy da função
npx supabase functions deploy weekly-reports-status

# Ou se quiser fazer deploy de todas as funções:
npx supabase functions deploy
```

## Passo 4: Verificar se o deploy foi bem-sucedido

Após o deploy, você deve ver uma mensagem como:

```
Deploying weekly-reports-status...
Function deployed successfully!
URL: https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/weekly-reports-status
```

## Passo 5: Configurar variáveis de ambiente no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** > **Edge Functions**
3. Clique em **Secrets**
4. Adicione as seguintes variáveis:
   - `SUPABASE_URL`: `https://wkdfeizgfdkkkyatevpc.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Sua Service Role Key (encontrada em Settings > API > service_role key)

## Passo 6: Testar a função

Após o deploy, teste a função diretamente no navegador ou via curl:

```bash
curl "https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/weekly-reports-status?date=2025-11-21" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY"
```

## Troubleshooting

### Erro: "Project not found"
- Verifique se o `project-ref` está correto
- Confirme que você tem acesso ao projeto no Supabase Dashboard

### Erro: "Function already exists"
- Isso é normal se você já fez deploy antes
- O deploy atualizará a função existente

### Erro: "Permission denied"
- Verifique se você tem permissões de deploy no projeto
- Confirme que está logado com a conta correta

### A função foi deployada mas ainda retorna erro
- Verifique se as variáveis de ambiente estão configuradas
- Confirme que o nome da função está correto na URL
- Teste a função diretamente no navegador primeiro

## Verificar funções deployadas

Para ver todas as funções deployadas:

```bash
npx supabase functions list
```

## Atualizar uma função existente

Se você fez alterações no código:

```bash
npx supabase functions deploy weekly-reports-status
```

A função será atualizada sem perder as configurações.




