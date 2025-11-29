# Configuração de Lembretes Automáticos de Relatórios Semanais

Este documento explica como configurar a automação de envio de lembretes de relatórios semanais via WhatsApp para cada líder.

## Visão Geral

O sistema envia mensagens individuais para cada líder que ainda não preencheu o relatório semanal, contendo um link para preencher o relatório.

## Componentes

1. **Edge Function**: `send-weekly-reminders` - Busca líderes pendentes e gera mensagens personalizadas, verifica envios anteriores
2. **N8N Workflow**: Processa e envia mensagens via Evolution API com delay de 90 segundos entre envios
3. **Tabela de Log**: `weekly_reminders_log` - Rastreia todos os envios para evitar duplicatas
4. **Frontend**: Botão "Enviar Lembretes" no Dashboard

## Configuração do N8N

### 1. Importar Workflow

1. Abra o N8N em https://quantum-flow.tech
2. Vá em **Workflows** > **Import from File**
3. Selecione o arquivo `n8n/Lembretes Automáticos - Relatórios Semanais.json`
4. O workflow será importado

### 2. Configurar Credenciais

#### Evolution API
1. No nó **"Enviar texto"**, configure as credenciais da Evolution API
2. Configure as variáveis de ambiente no N8N:
   - `EVOLUTION_API_URL`: URL da sua instância Evolution API
   - `EVOLUTION_API_INSTANCE`: Nome da instância do WhatsApp
   - `EVOLUTION_API_KEY`: Chave de API da Evolution API

#### Supabase API
1. Nos nós **"Verificar se já foi enviado"** e **"Marcar como Enviado"**, configure as credenciais do Supabase
2. Crie uma credencial HTTP Header Auth com:
   - **Name**: `Supabase API`
   - **Header Name**: `apikey` e `Authorization`
   - **Header Value**: Use as variáveis de ambiente `$env.SUPABASE_ANON_KEY` e `$env.SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Variáveis de Ambiente no N8N

No N8N, configure as seguintes variáveis de ambiente:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_INSTANCE=nome-da-instancia
EVOLUTION_API_KEY=sua-chave-api
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Importante:** A `SUPABASE_SERVICE_ROLE_KEY` é necessária para inserir registros na tabela de log, pois ela bypassa RLS (Row Level Security).

### 4. Ativar Workflow

1. Ative o workflow no N8N
2. Copie a URL do webhook do nó **"Webhook Receber Dados"**
3. A URL deve ser: `https://webhook.quantum-flow.tech/webhook/weekly-report-reminders`

## Configuração no Supabase

### 1. Aplicar Migrations

Primeiro, aplique as migrations que criam/modificam a tabela de rastreamento:

```bash
npx supabase db push
```

Isso:
- Cria/atualiza a tabela `weekly_reminders_log` para rastrear os envios
- Adiciona constraint UNIQUE para evitar duplicatas
- Remove registros duplicados existentes

### 2. Configurar Variável de Ambiente no Supabase

**IMPORTANTE:** Configure a variável de ambiente `N8N_WEBHOOK_URL` no Supabase para apontar para o webhook do N8N.

#### Opção A: Via Dashboard do Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** > **Edge Functions** > **Environment Variables**
3. Clique em **Add new variable**
4. Configure:
   - **Name**: `N8N_WEBHOOK_URL`
   - **Value**: `https://webhook.quantum-flow.tech/webhook/weekly-report-reminders`
5. Clique em **Save**

#### Opção B: Via Supabase CLI

1. Edite o arquivo `.env` local ou crie/selecione um arquivo de ambiente
2. Adicione a linha:
   ```env
   N8N_WEBHOOK_URL=https://webhook.quantum-flow.tech/webhook/weekly-report-reminders
   ```
3. Faça o deploy usando:
   ```bash
   supabase secrets set N8N_WEBHOOK_URL=https://webhook.quantum-flow.tech/webhook/weekly-report-reminders
   ```

#### Opção C: Via API do Supabase

```bash
curl -X POST \
  'https://api.supabase.com/v1/projects/{project_id}/secrets' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "N8N_WEBHOOK_URL",
    "value": "https://webhook.quantum-flow.tech/webhook/weekly-report-reminders"
  }'
```

## Como Usar

### Envio Manual

1. Acesse o **Dashboard** como Pastor
2. Clique no botão **"Enviar Lembretes"** (disponível apenas de quinta 22h até domingo 23:59)
3. O sistema irá:
   - Buscar todos os líderes que ainda não preencheram o relatório da semana
   - Verificar quais líderes já receberam lembrete (para evitar duplicatas)
   - Filtrar apenas líderes pendentes que ainda não receberam lembrete
   - Gerar mensagem personalizada para cada líder
   - Enviar via WhatsApp através do N8N com delay de 90 segundos entre cada envio
   - Registrar cada envio na tabela de log para evitar duplicatas futuras

### Mensagem Enviada

Cada líder recebe uma mensagem personalizada contendo:

```
Olá *[Nome do Líder]*! 👋

📋 *LEMBRETE DE RELATÓRIO SEMANAL*

Você ainda não preencheu o relatório da sua célula para a semana:
*[Data Início] a [Data Fim]*

🔗 Clique no link abaixo para preencher:
[Link para preencher relatório]

⏰ Por favor, preencha até domingo para não perder o prazo!

_Que Deus abençoe sua célula!_ 🙏
```

## Funcionalidades Implementadas

### Verificação de Envios Duplicados
- O sistema verifica automaticamente se um lembrete já foi enviado para um líder específico na semana
- Utiliza a tabela `weekly_reminders_log` para rastrear envios
- Evita envios duplicados mesmo que o botão seja clicado várias vezes

### Delay Entre Envios
- Aguarda 90 segundos entre cada envio individual
- Permite que o WhatsApp processe cada mensagem antes de enviar a próxima
- Evita bloqueios e problemas de rate limiting

### Rastreamento Completo
- Todos os envios são registrados na tabela `weekly_reminders_log`
- Inclui informações de líder, semana, data de envio e método (WhatsApp)
- Permite consultar histórico de envios

### Período Permitido
- Envios permitidos apenas de quinta-feira às 22:00 até domingo às 23:59
- Protege contra envios fora do período adequado

## Requisitos

- Líderes devem ter telefone cadastrado na tabela `profiles`
- Telefone deve estar no formato brasileiro (com ou sem DDD)
- N8N deve estar configurado e ativo
- Evolution API deve estar funcionando
- Tabela `weekly_reminders_log` deve existir (criada via migration)
- Variável de ambiente `N8N_WEBHOOK_URL` configurada no Supabase

## Troubleshooting

### Nenhum líder recebeu mensagem

1. Verifique se os líderes têm telefone cadastrado
2. Verifique se o N8N está ativo
3. Verifique os logs da edge function no Supabase
4. Verifique os logs do N8N
5. Verifique se as migrations foram aplicadas
6. **Verifique se a variável de ambiente `N8N_WEBHOOK_URL` está configurada no Supabase**

### Erro ao enviar

1. Verifique se a URL do webhook N8N está correta na variável de ambiente
2. Verifique se as credenciais da Evolution API estão corretas
3. Verifique se a instância do WhatsApp está ativa
4. Verifique se as variáveis de ambiente do Supabase estão configuradas no N8N

### Líderes não recebem mesmo não tendo recebido antes

1. Verifique a tabela `weekly_reminders_log` para ver se há registros anteriores
2. Se necessário, delete os registros da semana específica:
   ```sql
   DELETE FROM weekly_reminders_log 
   WHERE week_start_date = '2025-01-20'; -- Substitua pela data desejada (segunda-feira da semana)
   ```
3. Verifique os logs do workflow no N8N para ver se a verificação está funcionando

### Delay não está funcionando

1. Verifique se o nó "Aguardar 90 segundos" está corretamente configurado
2. Verifique se o workflow está processando um item por vez (não em paralelo)
3. Considere aumentar o delay se houver problemas de rate limiting

### Erro: "N8N webhook URL não configurada"

1. Verifique se a variável de ambiente `N8N_WEBHOOK_URL` está configurada no Supabase
2. Verifique se o valor está correto: `https://webhook.quantum-flow.tech/webhook/weekly-report-reminders`
3. Reinicie a edge function após configurar a variável de ambiente

## Verificar Configuração da Variável de Ambiente

Para verificar se a variável de ambiente está configurada corretamente:

1. Acesse o Supabase Dashboard
2. Vá em **Project Settings** > **Edge Functions** > **Environment Variables**
3. Procure por `N8N_WEBHOOK_URL`
4. Verifique se o valor está: `https://webhook.quantum-flow.tech/webhook/weekly-report-reminders`

Ou via SQL (para verificar se está acessível):

```sql
-- Verificar logs da edge function para ver se a variável está sendo lida
SELECT * FROM supabase_functions.logs 
WHERE function_name = 'send-weekly-reminders'
ORDER BY created_at DESC
LIMIT 10;
```

## Estrutura de Dados

### Request para Edge Function

```json
{
  "pastorId": "uuid-do-pastor",
  "isKids": false,
  "sendViaWhatsApp": true
}
```

### Response da Edge Function

```json
{
  "success": true,
  "sent": 5,
  "failed": 0,
  "pending": 5,
  "total": 10,
  "leaders": [
    {
      "id": "uuid",
      "name": "João Silva",
      "phone": "5511999999999"
    }
  ]
}
```

### Payload para N8N

```json
{
  "type": "weekly_report_reminder",
  "leaders": [
    {
      "lider_id": "uuid",
      "name": "João Silva",
      "phone": "5511999999999",
      "celula": "Célula Teste",
      "fillLink": "https://...",
      "weekRange": "20/01/2025 a 26/01/2025"
    }
  ],
  "weekStartDate": "2025-01-20",
  "weekEndDate": "2025-01-26"
}
```

## URL do Webhook

A URL do webhook do N8N configurada é:
```
https://webhook.quantum-flow.tech/webhook/weekly-report-reminders
```

Esta URL deve ser configurada como valor da variável de ambiente `N8N_WEBHOOK_URL` no Supabase.

