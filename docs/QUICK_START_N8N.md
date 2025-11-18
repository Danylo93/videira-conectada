# Guia Rápido: Configurar N8N para WhatsApp

## Resumo

Quando um evento é criado ou atualizado na Agenda, ele será automaticamente enviado para um grupo do WhatsApp.

## Passos Rápidos

### 1. Aplicar Migration no Supabase

```bash
npx supabase db push
```

Isso adiciona:
- Coluna `whatsapp_sent` na tabela `events`
- Coluna `whatsapp_group_id` (opcional)
- Trigger para notificar mudanças

### 2. Configurar Webhook no Supabase

**Opção A: Via Dashboard**
1. Acesse: Supabase Dashboard > Database > Webhooks
2. Clique em "Create a new webhook"
3. Preencha:
   - **Name**: `eventos-whatsapp`
   - **Table**: `events`
   - **Events**: Marque `INSERT` e `UPDATE`
   - **URL**: `https://seu-n8n.com/webhook/supabase-webhook`
   - **HTTP Method**: `POST`

**Opção B: Via SQL** (mais rápido)
Execute no SQL Editor do Supabase:

```sql
-- Criar webhook (ajuste a URL)
INSERT INTO supabase_functions.webhooks (name, url, events, table_name)
VALUES (
  'eventos-whatsapp',
  'https://seu-n8n.com/webhook/supabase-webhook',
  ARRAY['INSERT', 'UPDATE'],
  'events'
);
```

### 3. Importar Workflow no N8N

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione: `n8n/eventos-whatsapp-workflow.json`
4. O workflow será importado

### 4. Instalar Nó Evolution API

1. No N8N, vá em **Settings** > **Community Nodes**
2. Procure por `@evolution-api/n8n-nodes-evolution-api`
3. Clique em **Install**
4. Aguarde a instalação concluir

### 5. Configurar Variáveis de Ambiente

No N8N, configure as seguintes variáveis de ambiente:

```env
EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia
WHATSAPP_GROUP_ID=120363123456789012@g.us
SUPABASE_URL=https://seu-projeto.supabase.co
```

### 6. Configurar Credenciais

#### Evolution API
1. No N8N, vá em **Credentials** > **Add Credential**
2. Procure por **Evolution API** (ou crie uma nova)
3. Configure:
   - **Name**: `Evolution API`
   - **API URL**: `https://sua-evolution-api.com`
   - **API Key**: `SUA_API_KEY_DA_EVOLUTION`
   - Salve

#### Supabase API
1. No N8N, vá em **Credentials** > **Add Credential**
2. Selecione **HTTP Header Auth**
3. Configure:
   - **Name**: `Supabase API`
   - **Header Name**: `apikey`
   - **Header Value**: `SUA_SERVICE_ROLE_KEY_DO_SUPABASE`
   - Adicione também:
     - **Header Name**: `Authorization`
     - **Header Value**: `Bearer SUA_SERVICE_ROLE_KEY_DO_SUPABASE`
   - Salve

### 7. Ativar Workflow

Clique no botão **Active** no workflow do N8N.

## Como obter o ID do grupo do WhatsApp

1. Use a Evolution API para listar grupos:
   ```bash
   curl -X GET "https://sua-evolution-api.com/group/fetchAllGroups/SEU_INSTANCE" \
     -H "apikey: SUA_API_KEY"
   ```

2. O ID do grupo geralmente está no formato: `120363123456789012@g.us`

## Teste

1. Crie um evento na Agenda
2. Verifique se chegou no N8N
3. Verifique se foi enviado no WhatsApp
4. Verifique se `whatsapp_sent = true` no banco

## Formato da Mensagem

```
📅 *Nome do Evento*

Descrição do evento

📍 *Local:* Local
📆 *Data:* Data formatada
🏷️ *Tipo:* Tipo

_Evento criado na Agenda da Videira Conectada_
```

## Próximos Passos

- Configure múltiplos grupos do WhatsApp
- Adicione filtros por tipo de evento
- Personalize a mensagem conforme necessário

