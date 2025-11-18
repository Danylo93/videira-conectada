# Configuração N8N para Envio de Eventos para WhatsApp

Este documento descreve como configurar a automação N8N para enviar eventos automaticamente para grupos do WhatsApp.

## Pré-requisitos

1. **N8N instalado e configurado**
   - Pode ser self-hosted ou N8N Cloud
   - URL de acesso ao N8N

2. **Acesso ao WhatsApp Business API**
   - Conta WhatsApp Business
   - API Key ou Token de acesso
   - ID do grupo do WhatsApp onde os eventos serão enviados

3. **Acesso ao Supabase**
   - URL do projeto Supabase
   - Service Role Key (para atualizar o campo `whatsapp_sent`)

## Passo 1: Configurar Webhook no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Webhooks**
3. Clique em **Create a new webhook**
4. Configure:
   - **Name**: `eventos-whatsapp`
   - **Table**: `events`
   - **Events**: Selecione `INSERT` e `UPDATE`
   - **HTTP Request**:
     - **URL**: `https://seu-n8n.com/webhook/supabase-webhook`
     - **Method**: `POST`
     - **Headers**: 
       - `Content-Type: application/json`
     - **Body**: 
       ```json
       {
         "record": {
           "id": "{{ $event.data.id }}",
           "name": "{{ $event.data.name }}",
           "description": "{{ $event.data.description }}",
           "event_date": "{{ $event.data.event_date }}",
           "location": "{{ $event.data.location }}",
           "type": "{{ $event.data.type }}",
           "active": "{{ $event.data.active }}",
           "whatsapp_sent": "{{ $event.data.whatsapp_sent }}"
         }
       }
       ```

## Passo 2: Importar Workflow no N8N

1. Acesse seu N8N
2. Clique em **Workflows** > **Import from File**
3. Selecione o arquivo `n8n/eventos-whatsapp-workflow.json`
4. O workflow será importado com os nós configurados

## Passo 3: Configurar Credenciais no N8N

### Credencial WhatsApp API

1. No N8N, vá em **Credentials** > **Add Credential**
2. Selecione **HTTP Header Auth**
3. Configure:
   - **Name**: `WhatsApp API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer SEU_TOKEN_WHATSAPP`
   - Salve a credencial

### Credencial Supabase API

1. No N8N, vá em **Credentials** > **Add Credential**
2. Selecione **HTTP Header Auth**
3. Configure:
   - **Name**: `Supabase API`
   - **Header Name**: `apikey`
   - **Header Value**: `SUA_SERVICE_ROLE_KEY_DO_SUPABASE`
   - Adicione também:
     - **Header Name**: `Authorization`
     - **Header Value**: `Bearer SUA_SERVICE_ROLE_KEY_DO_SUPABASE`
   - Salve a credencial

## Passo 4: Configurar Variáveis de Ambiente

No N8N, configure as seguintes variáveis de ambiente:

```env
WHATSAPP_GROUP_ID=seu-grupo-id-aqui
SUPABASE_URL=https://seu-projeto.supabase.co
```

### Como obter o ID do grupo do WhatsApp:

1. Use a API do WhatsApp Business
2. Ou use ferramentas como Evolution API, Baileys, etc.
3. O ID geralmente é no formato: `120363123456789012@g.us`

## Passo 5: Ajustar Nó de Envio WhatsApp

O nó "Enviar para WhatsApp" precisa ser ajustado conforme sua API do WhatsApp:

### Evolution API (Nó Oficial do N8N)

O workflow usa o nó oficial da Evolution API do N8N, que é muito mais simples de configurar:

1. **Instalar o nó Evolution API (se ainda não tiver):**
   - No N8N, vá em **Settings** > **Community Nodes**
   - Procure por `@evolution-api/n8n-nodes-evolution-api`
   - Clique em **Install**

2. **Configurar variáveis de ambiente no N8N:**
   ```env
   EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia
   WHATSAPP_GROUP_ID=120363123456789012@g.us
   SUPABASE_URL=https://seu-projeto.supabase.co
   ```

3. **Configurar credencial Evolution API:**
   - No N8N, vá em **Credentials** > **Add Credential**
   - Procure por **Evolution API** (ou crie uma nova)
   - Configure:
     - **Name**: `Evolution API`
     - **API URL**: `https://sua-evolution-api.com` (URL base da sua Evolution API)
     - **API Key**: `SUA_API_KEY_DA_EVOLUTION`
     - Salve a credencial

4. **Configuração do nó no workflow:**
   O nó "Enviar via Evolution API" já está configurado com:
   - **Operation**: `sendText`
   - **Instance Name**: `{{ $env.EVOLUTION_INSTANCE_NAME }}`
   - **Number**: `{{ $json.groupId }}` (ID do grupo do WhatsApp)
   - **Text**: `{{ $json.message }}` (mensagem formatada)

**Vantagens do nó oficial:**
- ✅ Mais fácil de configurar
- ✅ Validação automática de parâmetros
- ✅ Melhor tratamento de erros
- ✅ Interface visual mais clara

## Passo 6: Ativar o Workflow

1. No N8N, abra o workflow importado
2. Clique no botão **Active** no canto superior direito
3. O workflow estará ativo e pronto para receber webhooks

## Passo 7: Testar

1. Crie um novo evento na aplicação
2. Verifique se o webhook foi recebido no N8N
3. Verifique se a mensagem foi enviada para o WhatsApp
4. Verifique se o campo `whatsapp_sent` foi atualizado no Supabase

## Troubleshooting

### Webhook não está sendo recebido
- Verifique se o webhook está ativo no Supabase
- Verifique se a URL do webhook está correta
- Verifique os logs do N8N

### Mensagem não está sendo enviada
- Verifique as credenciais do WhatsApp
- Verifique se o ID do grupo está correto
- Verifique os logs do N8N para erros

### Campo whatsapp_sent não está sendo atualizado
- Verifique as credenciais do Supabase
- Verifique se a Service Role Key está correta
- Verifique se o RLS permite a atualização

## Estrutura da Mensagem

A mensagem enviada terá o seguinte formato:

```
📅 *Nome do Evento*

Descrição do evento

📍 *Local:* Local do evento
📆 *Data:* Data formatada em português
🏷️ *Tipo:* Tipo do evento

_Evento criado na Agenda da Videira Conectada_
```

## Notas Importantes

- O evento só será enviado se `active = true` e `whatsapp_sent = false`
- Após o envio, o campo `whatsapp_sent` é marcado como `true`
- Para reenviar um evento, é necessário atualizar manualmente `whatsapp_sent = false` no banco
- O webhook é acionado tanto em INSERT quanto em UPDATE

