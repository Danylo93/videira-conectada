# Configurar Webhook para Sincronização Automática

Para que a sincronização aconteça automaticamente quando novos batizantes forem cadastrados, você precisa configurar um webhook no Supabase.

## ⚠️ IMPORTANTE: Aplicar Migrations Primeiro!

**Antes de configurar o webhook, você PRECISA aplicar as migrations no banco de dados.** Se a tabela `batismo_registrations` não aparecer na lista de tabelas, significa que as migrations ainda não foram aplicadas.

### Passo 0: Aplicar Migrations (OBRIGATÓRIO)

1. **Abra o terminal** na pasta do projeto

2. **Execute o comando**:
   ```bash
   npx supabase db push
   ```

3. **Aguarde a conclusão** - Isso criará:
   - Tabela `batismo_registrations`
   - Tabela `google_sheets_config`
   - Triggers e funções necessárias

4. **Se der erro de "already exists"**:
   - Isso significa que a tabela já foi criada
   - Apenas atualize a página do webhook (F5)
   - A tabela deve aparecer na lista

4. **Verifique se funcionou**:
   - Vá no Supabase Dashboard > Database > Tables
   - Procure por `batismo_registrations` na lista
   - Se aparecer, as migrations foram aplicadas com sucesso!

5. **Atualize a página do webhook**:
   - Volte para Database > Webhooks
   - Atualize a página (F5 ou Ctrl+R)
   - Agora a tabela `batismo_registrations` deve aparecer na lista

## Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto

## Passo 2: Configurar Webhook

1. No menu lateral, vá em **Database** > **Webhooks**
2. Clique em **Create a new webhook**
3. Preencha os campos:

   **Informações Básicas:**
   - **Name**: `batizantes-google-sheets-sync`
   - **Table**: `batismo_registrations`
   - **Events**: Selecione `INSERT`, `UPDATE` e `DELETE`

   **HTTP Request:**
   - **URL**: 
     ```
     https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/sync-batizantes-google-sheets
     ```
   - **HTTP Method**: `POST`
   
   **Headers:**
   - Clique em **Add Header**
   - **Name**: `Authorization`
   - **Value**: `Bearer SEU_SERVICE_ROLE_KEY`
     - Você encontra a Service Role Key em: **Settings** > **API** > **service_role key**
   
   - Clique em **Add Header** novamente
   - **Name**: `Content-Type`
   - **Value**: `application/json`

4. Clique em **Create webhook**

## Passo 3: Verificar se a Edge Function está Deployada

Antes de testar, certifique-se de que a Edge Function foi deployada:

```bash
npx supabase functions deploy sync-batizantes-google-sheets
```

## Passo 4: Testar

1. **Teste Manual**:
   - Na página de Batizantes, clique em **"Sincronizar Agora"**
   - Verifique se os dados aparecem no Google Sheets

2. **Teste Automático**:
   - Acesse a página pública de cadastro de batismo
   - Cadastre um novo batizante
   - Aguarde alguns segundos
   - Verifique se o novo registro aparece automaticamente no Google Sheets

## Troubleshooting

### A sincronização não acontece automaticamente

1. **Verifique o webhook**:
   - No Dashboard, vá em Database > Webhooks
   - Certifique-se de que o webhook está **Active**
   - Verifique os logs do webhook

2. **Verifique os logs da Edge Function**:
   - Vá em **Edge Functions** > **sync-batizantes-google-sheets** > **Logs**
   - Procure por erros ou mensagens

3. **Verifique a configuração**:
   - Na interface, certifique-se de que o badge mostra **"Google Sheets Ativo"**
   - Verifique se o ID da planilha está correto

### Erro: "Edge Function not found"

- Certifique-se de que fez o deploy da Edge Function
- Verifique se a URL do webhook está correta

### Erro: "Authorization failed"

- Verifique se a Service Role Key está correta no header do webhook
- A Service Role Key pode ser encontrada em Settings > API > service_role key

## Próximos Passos

Após configurar o webhook, os dados serão sincronizados automaticamente:
- ✅ Quando um novo batizante for cadastrado
- ✅ Quando um batizante for atualizado
- ✅ Quando um batizante for excluído

A sincronização manual continua disponível através do botão **"Sincronizar Agora"**.
