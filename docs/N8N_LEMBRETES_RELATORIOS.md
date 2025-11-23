# Como Configurar N8N para Enviar Lembretes de Relatórios Semanais

## O que é N8N?

**N8N** é uma ferramenta de automação que conecta diferentes serviços. Neste caso, ela vai:
1. Receber os dados dos líderes que precisam de lembrete
2. Enviar mensagens via WhatsApp para cada líder automaticamente

## Passo 1: Instalar N8N (se ainda não tiver)

### Opção A: N8N Cloud (Mais fácil - Recomendado)
1. Acesse: https://n8n.io/cloud
2. Crie uma conta gratuita
3. Você terá uma URL como: `https://seu-nome.n8n.cloud`

### Opção B: Self-hosted (Você hospeda)
```bash
# Via Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

## Passo 2: Criar Workflow no N8N

1. Acesse seu N8N
2. Clique em **"Workflows"** > **"Add Workflow"**
3. Clique em **"Import from File"**
4. Selecione o arquivo: `n8n/lembretes-relatorios-workflow.json`
5. O workflow será importado automaticamente

## Passo 3: Configurar Webhook no N8N

1. No workflow importado, clique no nó **"Webhook"**
2. Você verá uma URL como: `https://seu-n8n.com/webhook/lembretes-relatorios`
3. **Copie essa URL completa** - você vai precisar dela no próximo passo

## Passo 4: Configurar no Supabase

Execute este comando no terminal (substitua pela URL do seu webhook):

```bash
npx supabase secrets set N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/lembretes-relatorios
```

**Exemplo:**
```bash
npx supabase secrets set N8N_WEBHOOK_URL=https://videira.n8n.cloud/webhook/lembretes-relatorios
```

## Passo 5: Configurar WhatsApp (Evolution API)

### 5.1. Instalar Evolution API

A Evolution API é uma API que permite enviar mensagens WhatsApp. Você precisa:

1. **Opção A: Usar Evolution API Cloud** (mais fácil)
   - Acesse: https://evolution-api.com
   - Crie uma conta
   - Crie uma instância
   - Anote a URL da API e a API Key

2. **Opção B: Self-hosted** (você hospeda)
   - Siga a documentação: https://doc.evolution-api.com

### 5.2. Instalar Nó Evolution API no N8N

1. No N8N, vá em **Settings** > **Community Nodes**
2. Procure por: `@evolution-api/n8n-nodes-evolution-api`
3. Clique em **Install**
4. Aguarde a instalação

### 5.3. Configurar Credencial Evolution API

1. No N8N, vá em **Credentials** > **Add Credential**
2. Procure por **"Evolution API"**
3. Configure:
   - **Name**: `Evolution API Videira`
   - **API URL**: `https://sua-evolution-api.com` (URL da sua Evolution API)
   - **API Key**: `SUA_API_KEY` (chave da sua Evolution API)
4. Salve

### 5.4. Conectar WhatsApp na Evolution API

1. Acesse o painel da Evolution API
2. Crie uma nova instância
3. Escaneie o QR Code com seu WhatsApp
4. Anote o **Instance Name** (ex: `videira-igreja`)

## Passo 6: Configurar Variáveis de Ambiente no N8N

No N8N, vá em **Settings** > **Environment Variables** e adicione:

```env
EVOLUTION_INSTANCE_NAME=videira-igreja
```

(Substitua `videira-igreja` pelo nome da sua instância)

## Passo 7: Ativar o Workflow

1. No workflow do N8N, clique no botão **"Active"** (canto superior direito)
2. O workflow estará ativo e pronto para receber dados

## Passo 8: Testar

1. No dashboard do sistema, clique em **"Enviar Lembretes"**
2. Verifique no N8N se o webhook foi recebido (veja os logs)
3. Verifique se as mensagens foram enviadas no WhatsApp

## Como Funciona?

1. **Pastor clica em "Enviar Lembretes"** no dashboard
2. **Edge Function** identifica líderes que não preencheram
3. **Edge Function** envia dados para o **N8N** via webhook
4. **N8N** recebe os dados e processa
5. **N8N** envia mensagem individual para cada líder via **Evolution API**
6. **Líder recebe** mensagem no WhatsApp com link para preencher

## Estrutura da Mensagem Enviada

A mensagem que cada líder recebe será assim:

```
*LEMBRETE DE RELATÓRIO SEMANAL*

Olá *Nome do Líder*!

Você ainda não preencheu o relatório semanal da sua célula.

*Período:* 20/01/2025 a 26/01/2025

Clique no link abaixo para preencher:
[Link direto para preencher]

Que Deus abençoe!
```

## Troubleshooting

### Webhook não está recebendo dados
- Verifique se o workflow está **Active**
- Verifique se a URL do webhook está correta no Supabase
- Veja os logs do N8N em **Executions**

### Mensagens não estão sendo enviadas
- Verifique se a Evolution API está conectada (QR Code escaneado)
- Verifique se o **Instance Name** está correto
- Veja os logs do N8N para erros

### Erro "N8N webhook URL não configurada"
- Execute: `npx supabase secrets set N8N_WEBHOOK_URL=https://seu-webhook-url`
- Verifique se a URL está correta

## Próximos Passos

Depois de configurado, você pode:
- Agendar envios automáticos (via cron job)
- Personalizar as mensagens
- Adicionar mais canais (Email, SMS, etc.)

