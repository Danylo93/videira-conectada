# Configuração de Lembretes Automáticos de Escalas

Este documento explica como configurar a automação de envio de lembretes de escalas semanais via WhatsApp para cada servo.

## Visão Geral

O sistema envia mensagens individuais para cada servo escalado, contendo apenas as suas escalas específicas para a semana selecionada.

## Componentes

1. **Edge Function**: `send-escalas-reminders` - Busca escalas e gera mensagens personalizadas, verifica envios anteriores
2. **N8N Workflow**: Processa e envia mensagens via Evolution API com delay de 90 segundos entre envios
3. **Tabela de Log**: `escalas_reminders_log` - Rastreia todos os envios para evitar duplicatas
4. **Frontend**: Botão "Enviar Lembretes" na página de Escalas

## Configuração do N8N

### 1. Importar Workflow

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione o arquivo `n8n/Lembretes Automáticos - Escalas Semanais.json`

### 2. Configurar Credenciais

#### Evolution API
1. No nó **"Enviar texto"**, configure as credenciais da Evolution API
2. Configure as variáveis de ambiente no N8N:
   - `EVOLUTION_API_URL`: URL da sua instância Evolution API (ex: `http://localhost:8080`)
   - `EVOLUTION_API_INSTANCE`: Nome da instância do WhatsApp
   - `EVOLUTION_API_KEY`: Chave de API da Evolution API

#### Supabase API
1. No nó **"Verificar se já foi enviado"** e **"Marcar como Enviado"**, configure as credenciais do Supabase
2. Crie uma credencial HTTP Header Auth com:
   - **Name**: `Supabase API`
   - **Header Name**: `apikey` e `Authorization`
   - **Header Value**: Use as variáveis de ambiente `$env.SUPABASE_ANON_KEY` e `$env.SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Webhook

1. No nó **"Webhook Receber Dados"**, copie a URL do webhook
2. Configure a variável de ambiente `N8N_WEBHOOK_URL` no Supabase com essa URL

### 4. Ativar Workflow

1. Ative o workflow no N8N
2. O webhook estará pronto para receber requisições

## Configuração no Supabase

### 1. Aplicar Migration

Primeiro, aplique a migration que cria a tabela de rastreamento:

```bash
npx supabase db push
```

Isso cria a tabela `escalas_reminders_log` para rastrear os envios.

### 2. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Supabase:

```bash
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/escalas-reminders
```

### 3. Variáveis de Ambiente no N8N

No N8N, configure as seguintes variáveis de ambiente:

```bash
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_INSTANCE=nome-da-instancia
EVOLUTION_API_KEY=sua-chave-api
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Importante:** A `SUPABASE_SERVICE_ROLE_KEY` é necessária para inserir registros na tabela de log, pois ela bypassa RLS (Row Level Security).

## Como Usar

### Envio Manual

1. Acesse a página **Escalas**
2. Selecione a semana desejada (sábado da semana)
3. Clique no botão **"Enviar Lembretes"**
4. O sistema irá:
   - Buscar todas as escalas da semana selecionada
   - Verificar quais servos já receberam lembrete (para evitar duplicatas)
   - Agrupar por servo (apenas os que ainda não receberam)
   - Gerar mensagem personalizada para cada servo
   - Enviar via WhatsApp através do N8N com delay de 90 segundos entre cada envio
   - Registrar cada envio na tabela de log para evitar duplicatas futuras

### Mensagem Enviada

Cada servo recebe uma mensagem personalizada contendo:

```
*Olá [Nome do Servo]!*

*LEMBRETE DE SUA ESCALA*

*[Data Sábado]* (Sábado) e *[Data Domingo]* (Domingo)

═══════════════════════

*Sábado ([Data])*
  - [Área]: [Função] (se aplicável)
  - [Área]

*Domingo ([Data])*
  - [Área]: [Função] (se aplicável)
  - [Área]

═══════════════════════
Que Deus abençoe você! 🙏
```

## Funcionalidades Implementadas

### Verificação de Envios Duplicados
- O sistema verifica automaticamente se um lembrete já foi enviado para um servo específico na semana
- Utiliza a tabela `escalas_reminders_log` para rastrear envios
- Evita envios duplicados mesmo que o botão seja clicado várias vezes

### Delay Entre Envios
- Aguarda 90 segundos entre cada envio individual
- Permite que o WhatsApp processe cada mensagem antes de enviar a próxima
- Evita bloqueios e problemas de rate limiting

### Rastreamento Completo
- Todos os envios são registrados na tabela `escalas_reminders_log`
- Inclui informações de servo, semana, data de envio e método (WhatsApp)
- Permite consultar histórico de envios

## Requisitos

- Servos devem ter telefone cadastrado na tabela `servos`
- Telefone deve estar no formato brasileiro (com ou sem DDD)
- N8N deve estar configurado e ativo
- Evolution API deve estar funcionando
- Tabela `escalas_reminders_log` deve existir (criada via migration)

## Troubleshooting

### Nenhum servo recebeu mensagem

1. Verifique se os servos têm telefone cadastrado
2. Verifique se o N8N está ativo
3. Verifique os logs da edge function no Supabase
4. Verifique os logs do N8N
5. Verifique se a migration foi aplicada (tabela `escalas_reminders_log` deve existir)

### Erro ao enviar

1. Verifique se a URL do webhook N8N está correta
2. Verifique se as credenciais da Evolution API estão corretas
3. Verifique se a instância do WhatsApp está ativa
4. Verifique se as variáveis de ambiente do Supabase estão configuradas no N8N

### Servos não recebem mesmo não tendo recebido antes

1. Verifique a tabela `escalas_reminders_log` para ver se há registros anteriores
2. Se necessário, delete os registros da semana específica:
   ```sql
   DELETE FROM escalas_reminders_log 
   WHERE semana_inicio = '2025-01-25'; -- Substitua pela data desejada
   ```
3. Verifique os logs do workflow no N8N para ver se a verificação está funcionando

### Delay não está funcionando

1. Verifique se o nó "Aguardar 90 segundos" está corretamente configurado
2. Verifique se o workflow está processando um item por vez (não em paralelo)
3. Considere aumentar o delay se houver problemas de rate limiting

## Estrutura de Dados

### Request para Edge Function

```json
{
  "semana_inicio": "2025-11-22"
}
```

### Response da Edge Function

```json
{
  "success": true,
  "sent": 5,
  "servos": [
    {
      "name": "João Silva",
      "phone": "5511999999999"
    }
  ]
}
```

### Payload para N8N

```json
{
  "servos": [
    {
      "phone": "5511999999999",
      "message": "*Olá João Silva!*\n\n...",
      "name": "João Silva"
    }
  ],
  "semana_inicio": "2025-11-22"
}
```



