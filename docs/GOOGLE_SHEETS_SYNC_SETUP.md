# Configuração de Sincronização Automática com Google Sheets

## Visão Geral

O sistema de sincronização automática permite que os dados dos batizantes sejam atualizados automaticamente no Google Sheets sempre que houver um novo cadastro, atualização ou exclusão.

## Como Funciona

1. **Trigger no Banco de Dados**: Quando há uma mudança na tabela `batismo_registrations`, um trigger é acionado
2. **Notificação**: O trigger notifica a Edge Function via `pg_notify`
3. **Sincronização**: A Edge Function busca todos os dados e atualiza o Google Sheets

## Configuração Inicial

### Passo 1: Aplicar Migrations

```bash
npx supabase db push
```

Isso criará:
- Tabela `google_sheets_config` para armazenar a configuração
- Trigger `batismo_sync_trigger` para detectar mudanças
- Função `notify_batismo_sync` para notificar mudanças

### Passo 2: Deploy da Edge Function

```bash
npx supabase functions deploy sync-batizantes-google-sheets
```

### Passo 3: Configurar Webhook no Supabase

Para sincronização automática, configure um webhook que chama a Edge Function quando houver mudanças:

1. **No Supabase Dashboard**: Database > Webhooks > Create a new webhook
2. Configure:
   - **Name**: `batizantes-google-sheets-sync`
   - **Table**: `batismo_registrations`
   - **Events**: `INSERT`, `UPDATE`, `DELETE`
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/sync-batizantes-google-sheets`
   - **Method**: `POST`
   - **Headers**: 
     - `Authorization`: `Bearer SEU_SERVICE_ROLE_KEY`
     - `Content-Type`: `application/json`

Veja o arquivo `docs/GOOGLE_SHEETS_WEBHOOK_SETUP.md` para instruções detalhadas.

### Passo 4: Configurar Webhook no Google Sheets (via N8N ou Similar) - Opcional

1. Crie um workflow no N8N que:
   - Recebe dados da Edge Function
   - Autentica com Google Sheets API
   - Atualiza a planilha

2. Configure a variável de ambiente `GOOGLE_SHEETS_WEBHOOK_URL` no Supabase:
   - Acesse: Supabase Dashboard > Project Settings > Edge Functions > Secrets
   - Adicione: `GOOGLE_SHEETS_WEBHOOK_URL=https://seu-n8n.com/webhook/google-sheets`

### Passo 4: Configurar a Planilha na Interface

1. Acesse a página de **Batizantes**
2. Clique em **Configurar** (apenas pastores e obreiros)
3. Cole o ID da planilha do Google Sheets
4. Defina o nome da aba (padrão: "Batizantes")
5. Habilite a sincronização automática
6. Clique em **Salvar Configuração**

## Como Obter o ID da Planilha

O ID da planilha está na URL do Google Sheets:

```
https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit
                         ^^^^^^^^^^^^^^^^^^^^^^^^
                         Este é o ID
```

Você pode colar a URL completa ou apenas o ID.

## Estrutura da Planilha

A planilha será atualizada com as seguintes colunas:

| Nome Completo | Líder | Tamanho Camiseta | Data de Cadastro |
|---------------|-------|------------------|------------------|
| João Silva    | Maria Santos | M | 25/01/2025 |

## Sincronização Manual

Você também pode sincronizar manualmente a qualquer momento:

1. Na página de **Batizantes**
2. Clique em **Sincronizar Agora**
3. Os dados serão atualizados imediatamente no Google Sheets

## Permissões

- **Configurar**: Apenas pastores e obreiros
- **Sincronizar**: Todos os usuários autenticados (quando configurado)
- **Ver Status**: Todos os usuários autenticados

## Troubleshooting

### A sincronização não está funcionando

1. Verifique se a configuração está habilitada
2. Verifique se o ID da planilha está correto
3. Verifique se a Edge Function foi deployada
4. Verifique se o webhook está configurado corretamente
5. Verifique os logs da Edge Function no Supabase Dashboard

### Erro: "Google Sheets sync not configured"

- Certifique-se de que configurou a planilha na interface
- Verifique se a sincronização está habilitada

### Erro: "Webhook failed"

- Verifique se a URL do webhook está correta
- Verifique se o serviço (N8N) está ativo e acessível
- Verifique as credenciais de autenticação do Google Sheets

## Próximos Passos

Para uma integração mais avançada:

1. Configure autenticação OAuth 2.0 com Google
2. Use a Google Sheets API diretamente na Edge Function
3. Configure sincronização em tempo real usando WebSockets

