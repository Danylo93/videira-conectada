# Configuração de Lembretes Automáticos de Escalas

Este documento explica como configurar a automação de envio de lembretes de escalas semanais via WhatsApp para cada servo.

## Visão Geral

O sistema envia mensagens individuais para cada servo escalado, contendo apenas as suas escalas específicas para a semana selecionada.

## Componentes

1. **Edge Function**: `send-escalas-reminders` - Busca escalas e gera mensagens personalizadas
2. **N8N Workflow**: Processa e envia mensagens via Evolution API
3. **Frontend**: Botão "Enviar Lembretes" na página de Escalas

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

### 3. Configurar Webhook

1. No nó **"Webhook Receber Dados"**, copie a URL do webhook
2. Configure a variável de ambiente `N8N_WEBHOOK_URL` no Supabase com essa URL

### 4. Ativar Workflow

1. Ative o workflow no N8N
2. O webhook estará pronto para receber requisições

## Configuração no Supabase

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Supabase:

```bash
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/escalas-reminders
```

## Como Usar

### Envio Manual

1. Acesse a página **Escalas**
2. Selecione a semana desejada (sábado da semana)
3. Clique no botão **"Enviar Lembretes"**
4. O sistema irá:
   - Buscar todas as escalas da semana selecionada
   - Agrupar por servo
   - Gerar mensagem personalizada para cada servo
   - Enviar via WhatsApp através do N8N

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

## Requisitos

- Servos devem ter telefone cadastrado na tabela `servos`
- Telefone deve estar no formato brasileiro (com ou sem DDD)
- N8N deve estar configurado e ativo
- Evolution API deve estar funcionando

## Troubleshooting

### Nenhum servo recebeu mensagem

1. Verifique se os servos têm telefone cadastrado
2. Verifique se o N8N está ativo
3. Verifique os logs da edge function no Supabase
4. Verifique os logs do N8N

### Erro ao enviar

1. Verifique se a URL do webhook N8N está correta
2. Verifique se as credenciais da Evolution API estão corretas
3. Verifique se a instância do WhatsApp está ativa

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



