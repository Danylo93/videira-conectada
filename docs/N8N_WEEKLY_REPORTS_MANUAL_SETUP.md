# Configuração N8N - Envio Manual de Relatórios Semanais via WhatsApp

Este documento descreve como configurar o workflow N8N para envio manual de mensagens WhatsApp para líderes pendentes de relatórios semanais.

## Pré-requisitos

1. **N8N instalado e configurado**
2. **Evolution API configurada** com instância ativa
3. **Supabase Edge Function deployada** (`send-weekly-reports-whatsapp`)
4. **Acesso ao projeto Supabase**

## Passo 1: Deploy da Edge Function

A Edge Function `send-weekly-reports-whatsapp` já está criada. Faça o deploy:

```bash
npx supabase functions deploy send-weekly-reports-whatsapp
```

### Configurar variáveis de ambiente no Supabase

No Supabase Dashboard:
1. Vá em **Project Settings** > **Edge Functions**
2. Clique em **Secrets**
3. Adicione:
   - `N8N_WEBHOOK_URL`: URL do webhook do N8N (ex: `https://seu-n8n.com/webhook/send-weekly-reports`)
   - `FRONTEND_URL`: URL do frontend (opcional, pode ser passado no body)

## Passo 2: Importar Workflow no N8N

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione: `n8n/weekly-reports-whatsapp-manual-workflow.json`
4. O workflow será importado

## Passo 3: Configurar Webhook no N8N

1. No workflow importado, clique no nó **"Webhook Manual"**
2. Copie a URL do webhook (ex: `https://seu-n8n.com/webhook/send-weekly-reports`)
3. Use esta URL na variável `N8N_WEBHOOK_URL` do Supabase

## Passo 4: Configurar Evolution API

1. No N8N, vá em **Credentials** > **Add Credential**
2. Procure por **Evolution API**
3. Configure:
   - **Name**: `Evolution API`
   - **API URL**: URL da sua Evolution API
   - **API Key**: Sua chave da Evolution API
   - **Instance Name**: Nome da sua instância (configure também como variável de ambiente)

## Passo 5: Configurar Variáveis de Ambiente

No N8N, configure:

```env
EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia
```

## Passo 6: Ativar o Workflow

1. No N8N, abra o workflow
2. Clique no botão **Active** no canto superior direito
3. O workflow estará pronto para receber chamadas da Edge Function

## Como Funciona

### Fluxo de Execução

1. **Pastor clica em "Enviar WhatsApp"** na interface
2. **Edge Function** (`send-weekly-reports-whatsapp`) é chamada
3. **Edge Function** busca líderes pendentes e prepara dados
4. **Edge Function** envia POST para o webhook do N8N
5. **N8N** processa e envia mensagens individuais via Evolution API
6. **N8N** retorna resultado para a Edge Function
7. **Interface** mostra resultado ao pastor

### Formato dos Dados

A Edge Function envia para o N8N:

```json
{
  "leaders": [
    {
      "liderId": "uuid",
      "liderName": "Nome do Líder",
      "liderPhone": "5511999999999",
      "fillLink": "https://dominio.com/preencher-relatorio?lider=uuid&date=2025-01-21"
    }
  ],
  "weekStartDate": "2025-01-21",
  "weekEndDate": "2025-01-27",
  "pastorId": "uuid",
  "isKids": false
}
```

### Formato da Mensagem WhatsApp

```
📋 *Relatório Semanal de Célula*

Olá *Nome do Líder*! 👋

Lembramos que ainda não recebemos o relatório semanal da sua célula.

📅 *Semana:* segunda-feira, 21 de janeiro de 2025

Por favor, preencha o relatório através do link abaixo:

🔗 https://dominio.com/preencher-relatorio?lider=uuid&date=2025-01-21

*Obrigado pela sua dedicação!* 🙏
```

## Testar Manualmente

Você pode testar o workflow diretamente no N8N:

1. Clique em **Execute Workflow**
2. No nó "Webhook Manual", clique em **Listen for Test Event**
3. Use o botão **"Send Test Request"** ou faça uma requisição POST:

```bash
curl -X POST https://seu-n8n.com/webhook/send-weekly-reports \
  -H "Content-Type: application/json" \
  -d '{
    "leaders": [
      {
        "liderId": "test-id",
        "liderName": "Líder Teste",
        "liderPhone": "5511999999999",
        "fillLink": "https://dominio.com/preencher-relatorio?lider=test-id&date=2025-01-21"
      }
    ],
    "weekStartDate": "2025-01-21",
    "weekEndDate": "2025-01-27",
    "pastorId": "test-pastor-id",
    "isKids": false
  }'
```

## Troubleshooting

### Erro: "N8N webhook URL não configurada"
- Verifique se a variável `N8N_WEBHOOK_URL` está configurada no Supabase
- Confirme que a URL está correta e acessível

### Erro: "Nenhum líder com telefone encontrado"
- Verifique se os líderes têm telefone cadastrado no perfil
- Confirme que o filtro de líderes está correto

### Mensagens não estão sendo enviadas
- Verifique se o Evolution API está configurado corretamente
- Confirme que a instância está ativa
- Verifique os logs do N8N para erros específicos

### Webhook não está recebendo requisições
- Verifique se o workflow está ativo no N8N
- Confirme que a URL do webhook está correta
- Teste o webhook diretamente com curl ou Postman

## Vantagens do Envio Manual

- ✅ **Controle total**: Pastor decide quando enviar
- ✅ **Apenas pendentes**: Envia somente para líderes que não preencheram
- ✅ **Feedback imediato**: Mostra quantos foram enviados
- ✅ **Sem spam**: Não envia mensagens desnecessárias
- ✅ **Flexível**: Pode ser usado a qualquer momento

## Diferença entre Workflows

- **Manual (este)**: Acionado pelo pastor via botão na interface
- **Automático (scheduled)**: Roda automaticamente a cada 15 minutos

Você pode usar ambos simultaneamente se desejar!

