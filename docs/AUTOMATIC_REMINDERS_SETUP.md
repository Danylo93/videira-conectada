# Configuração de Lembretes Automáticos de Relatórios Semanais

Este documento explica como configurar os lembretes automáticos que são enviados:
- **Quinta-feira às 22:00h**
- **Sábado às 17:30h**

Os relatórios semanais das células são de **quinta a sábado**.

## Opção 1: Usando N8N (Recomendado)

### Passo 1: Criar Workflow de Agendamento no N8N

1. Acesse seu N8N
2. Crie um novo workflow chamado "Lembretes Automáticos - Relatórios Semanais"
3. Adicione os seguintes nós:

#### Nó 1: Cron (Quinta-feira 22:00h)
- **Tipo**: Cron
- **Cron Expression**: `0 22 * * 4` (toda quinta às 22:00h)
- **Timezone**: Seu timezone (ex: America/Sao_Paulo)

#### Nó 2: Cron (Sábado 17:30h)
- **Tipo**: Cron
- **Cron Expression**: `30 17 * * 6` (todo sábado às 17:30h)
- **Timezone**: Seu timezone (ex: America/Sao_Paulo)

#### Nó 3: HTTP Request (Chamar Edge Function)
- **Tipo**: HTTP Request
- **Method**: POST
- **URL**: `https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/send-weekly-reminders`
- **Headers**:
  - `Authorization`: `Bearer SEU_SERVICE_ROLE_KEY`
  - `Content-Type`: `application/json`
- **Body (JSON)**:
```json
{
  "sendViaWhatsApp": true,
  "sendViaEmail": false
}
```

**Nota**: Se você quiser enviar apenas para um pastor específico ou apenas para kids, adicione:
```json
{
  "pastorId": "uuid-do-pastor",
  "isKids": false,
  "sendViaWhatsApp": true,
  "sendViaEmail": false
}
```

### Passo 2: Conectar os Nós

1. Conecte ambos os nós Cron ao nó HTTP Request
2. Ative o workflow

### Passo 3: Testar

1. Use o botão "Execute Workflow" no N8N para testar
2. Verifique se os lembretes foram enviados corretamente

## Opção 2: Usando Supabase Cron Jobs (PostgreSQL)

Se você preferir usar o sistema de cron do Supabase diretamente no banco de dados:

### Passo 1: Criar Função SQL

Execute no SQL Editor do Supabase:

```sql
-- Função para enviar lembretes (chama a edge function)
CREATE OR REPLACE FUNCTION send_weekly_reminders_auto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
  response_body text;
BEGIN
  -- Chamar a edge function via HTTP
  -- Nota: Isso requer a extensão pg_net ou http
  -- Você pode usar pg_net se disponível
  PERFORM
    net.http_post(
      url := 'https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/send-weekly-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'sendViaWhatsApp', true,
        'sendViaEmail', false
      )
    );
END;
$$;
```

### Passo 2: Criar Cron Jobs

```sql
-- Lembrete de quinta-feira às 22:00h
SELECT cron.schedule(
  'weekly-reminder-thursday',
  '0 22 * * 4', -- Toda quinta às 22:00h
  $$
  SELECT send_weekly_reminders_auto();
  $$
);

-- Lembrete de sábado às 17:30h
SELECT cron.schedule(
  'weekly-reminder-saturday',
  '30 17 * * 6', -- Todo sábado às 17:30h
  $$
  SELECT send_weekly_reminders_auto();
  $$
);
```

**Nota**: Isso requer a extensão `pg_cron` e `pg_net` habilitadas no Supabase.

## Opção 3: Usando Serviços Externos (GitHub Actions, Vercel Cron, etc.)

### GitHub Actions Example

Crie `.github/workflows/weekly-reminders.yml`:

```yaml
name: Weekly Reminders

on:
  schedule:
    # Quinta-feira às 22:00h UTC (ajuste para seu timezone)
    - cron: '0 22 * * 4'
    # Sábado às 17:30h UTC (ajuste para seu timezone)
    - cron: '30 17 * * 6'
  workflow_dispatch: # Permite execução manual

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Thursday Reminder
        if: github.event.schedule == '0 22 * * 4'
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"sendViaWhatsApp": true, "sendViaEmail": false}' \
            https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/send-weekly-reminders
      
      - name: Send Saturday Reminder
        if: github.event.schedule == '30 17 * * 6'
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"sendViaWhatsApp": true, "sendViaEmail": false}' \
            https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/send-weekly-reminders
```

## Verificação

Após configurar, você pode verificar se está funcionando:

1. **Logs do N8N**: Verifique os logs de execução do workflow
2. **Logs do Supabase**: Vá para Edge Functions > send-weekly-reminders > Logs
3. **Tabela de Log**: Verifique a tabela `weekly_reminders_log` no banco de dados

## Troubleshooting

### Lembretes não estão sendo enviados

1. Verifique se o workflow está ativo no N8N
2. Verifique os logs da edge function no Supabase
3. Verifique se o webhook do N8N está configurado corretamente
4. Verifique se a variável de ambiente `N8N_WEBHOOK_URL` está configurada no Supabase

### Erro 401 na Evolution API

Consulte o documento `CORRIGIR_ERRO_401_EVOLUTION_API.md` para resolver problemas de autenticação.

## Notas Importantes

- Os lembretes são enviados apenas para líderes que **não preencheram** o relatório da semana atual
- A semana é calculada de **segunda a domingo**
- Os relatórios das células são de **quinta a sábado**
- O sistema verifica automaticamente se todos os líderes já preencheram e mostra "Relatórios em dia" no dashboard



