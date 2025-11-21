# Guia: Automação N8N para Status dos Relatórios Semanais

## Resumo

Este sistema permite:

1. **Verificar status dos relatórios semanais** - Lista todos os líderes e verifica quais não preencheram o relatório semanal
2. **Enviar mensagens via WhatsApp** - Envia mensagens individuais para cada líder pendente com link direto de preenchimento
3. **Links diretos** - Cada líder recebe um link personalizado que abre diretamente o formulário de preenchimento

### Workflows Disponíveis

1. **weekly-reports-whatsapp-scheduled-workflow.json** ⭐ **USE ESTE**
   - Verifica a cada 15 minutos
   - Envia mensagens para pendentes
   - Para quando todos preencherem
   - **Este é o workflow principal que você precisa**

2. **weekly-reports-status-workflow.json** (Opcional)
   - Retorna status via webhook (para consulta manual)
   - Não envia WhatsApp automaticamente
   - Use apenas se precisar consultar via API

3. **weekly-reports-whatsapp-workflow.json** (Opcional)
   - Envia uma vez por semana (segunda às 18h)
   - Não verifica continuamente
   - Use apenas se preferir envio único ao invés de contínuo

> 💡 **Recomendação**: Use apenas o workflow #1. Os outros 2 são opcionais e podem ser ignorados.
> 
> Veja mais detalhes em: [N8N_WORKFLOWS_EXPLANATION.md](./N8N_WORKFLOWS_EXPLANATION.md)

## Pré-requisitos

1. Supabase configurado com a tabela `cell_reports_weekly`
2. N8N instalado e configurado
3. Acesso ao Supabase Service Role Key

## Passo 1: Deploy da Supabase Edge Function

### 1.1 Criar a função

A função já está criada em `supabase/functions/weekly-reports-status/index.ts`.

### 1.2 Fazer deploy

```bash
# No diretório do projeto
npx supabase functions deploy weekly-reports-status
```

### 1.3 Configurar variáveis de ambiente

No Supabase Dashboard:
1. Vá em **Project Settings** > **Edge Functions**
2. Configure as variáveis:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase

## Passo 2: Importar Workflow no N8N

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione: `n8n/weekly-reports-status-workflow.json`
4. O workflow será importado

## Passo 3: Configurar Variáveis de Ambiente no N8N

No N8N, configure as seguintes variáveis de ambiente:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key
PASTOR_ID=uuid-do-pastor
FRONTEND_URL=https://seu-dominio.com
```

### Como obter os valores:

- **SUPABASE_URL**: Dashboard do Supabase > Settings > API > Project URL
- **SUPABASE_ANON_KEY**: Dashboard do Supabase > Settings > API > anon/public key
- **PASTOR_ID**: ID do perfil do pastor no Supabase (tabela `profiles`)
- **FRONTEND_URL**: URL do seu frontend (ex: `https://videira-conectada.com`)

## Passo 4: Testar o Workflow

### 4.1 Ativar o workflow

1. No N8N, abra o workflow importado
2. Clique em **Active** para ativar

### 4.2 Testar manualmente

1. Clique no nó **Webhook**
2. Copie a URL do webhook (ex: `https://seu-n8n.com/webhook/weekly-reports-status`)
3. Abra em um navegador ou use curl:

```bash
curl "https://seu-n8n.com/webhook/weekly-reports-status"
```

### 4.3 Verificar resposta

A resposta deve conter:
- Lista de todos os líderes
- Status de cada um (pendente/preenchido)
- Links diretos para os relatórios
- Quantidades de membros e frequentadores (se preenchido)

## Passo 5: Agendar Execução Automática (Opcional)

Para executar automaticamente:

1. Adicione um nó **Schedule Trigger** no início do workflow
2. Configure a frequência (ex: diariamente às 18h)
3. Conecte ao nó **Buscar Status dos Líderes**

## Passo 6: Enviar Mensagens Individuais via WhatsApp (Verificação Contínua)

### ⭐ Workflow Recomendado: Verificação a cada 15 minutos

Este workflow verifica automaticamente a cada 15 minutos quais líderes ainda não preencheram o relatório e envia mensagens apenas para os pendentes. Para quando todos estiverem preenchidos.

### 6.1 Importar Workflow de Verificação Contínua

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione: `n8n/weekly-reports-whatsapp-scheduled-workflow.json`
4. O workflow será importado

### 6.2 Configurar Agendamento

O workflow está configurado para verificar **a cada 15 minutos** (`*/15 * * * *`). 

Para alterar a frequência:
1. Abra o nó **Verificar a cada 15 minutos**
2. Configure o intervalo desejado:
   - `*/15 * * * *` - A cada 15 minutos
   - `*/30 * * * *` - A cada 30 minutos
   - `0 */1 * * *` - A cada 1 hora
   - `0 18 * * 1` - Toda segunda às 18h

### 6.3 Como Funciona

1. **A cada 15 minutos**: O workflow verifica o status de todos os líderes
2. **Conta status**: Calcula quantos preencheram e quantos estão pendentes
3. **Verifica se há pendentes**: 
   - Se **há pendentes**: Envia mensagens WhatsApp apenas para eles
   - Se **todos preencheram**: Não envia mensagens, apenas registra no log
4. **Continua verificando**: O workflow continua rodando a cada 15 minutos até o final da semana
5. **Adapta-se automaticamente**: Se alguém preencher entre verificações, para de enviar para ele na próxima verificação
6. **Log opcional**: Pode configurar um webhook para receber logs (Slack, Discord, etc.)

### 6.4 Fluxo de Execução

```
A cada 15 minutos:
  ↓
Buscar status dos líderes
  ↓
Processar e contar (pendentes vs preenchidos)
  ↓
Há pendentes?
  ├─ SIM → Enviar WhatsApp para cada pendente
  │         ↓
  │       Registrar envio
  │
  └─ NÃO → Registrar que todos preencheram
            (não envia mensagens)
  ↓
Aguardar 15 minutos e repetir
```

### 6.5 Vantagens

- ✅ Não envia mensagens duplicadas desnecessariamente
- ✅ Verifica continuamente até todos preencherem
- ✅ Adapta-se automaticamente (se alguém preencher, para de enviar para ele)
- ✅ Funciona 24/7 sem intervenção manual
- ✅ Para de enviar mensagens quando todos preencherem (mas continua verificando)

### 6.6 Nota Importante

⚠️ **O workflow continua rodando mesmo quando todos preencherem**. Isso é intencional para:
- Detectar se alguém deletou um relatório
- Verificar se novos líderes foram adicionados
- Manter o monitoramento ativo

Se quiser que o workflow pare completamente quando todos preencherem, você pode adicionar uma condição adicional ou desativar manualmente após verificar que todos preencheram.

---

## Passo 7: Enviar Mensagens Individuais via WhatsApp (Agendado - Alternativa)

Para enviar mensagens individuais para cada líder pendente:

### 7.1 Importar Workflow de WhatsApp (Agendado)

1. Abra o N8N
2. Vá em **Workflows** > **Import from File**
3. Selecione: `n8n/weekly-reports-whatsapp-workflow.json`
4. O workflow será importado

**Nota**: Este workflow envia apenas uma vez por semana (segunda às 18h). Para verificação contínua, use o workflow do Passo 6.

### 7.2 Instalar Nó Evolution API

1. No N8N, vá em **Settings** > **Community Nodes**
2. Procure por `@evolution-api/n8n-nodes-evolution-api`
3. Clique em **Install**
4. Aguarde a instalação concluir

### 7.3 Configurar Credenciais Evolution API

1. No N8N, vá em **Credentials** > **Add Credential**
2. Procure por **Evolution API** (ou crie uma nova)
3. Configure:
   - **Name**: `Evolution API`
   - **API URL**: `https://sua-evolution-api.com`
   - **API Key**: `SUA_API_KEY_DA_EVOLUTION`
   - Salve

### 7.4 Configurar Agendamento

O workflow está configurado para executar toda segunda-feira às 18h. Para alterar:

1. Abra o nó **Agendar (Segunda 18h)**
2. Configure o horário desejado
3. Use formato Cron: `0 18 * * 1` (segunda às 18h)

### 7.5 Formato da Mensagem

Cada líder receberá uma mensagem individual:

```
⏰ *Lembrete: Relatório Semanal*

Olá *Nome do Líder*! 👋

Você ainda não preencheu o relatório semanal da sua célula.

📅 *Semana:* segunda-feira, 20 de janeiro

Por favor, preencha o relatório através do link abaixo:

🔗 https://seu-dominio.com/relatorios-semanal?date=2025-01-20

_Se você já preencheu, pode ignorar esta mensagem._
```

### 7.6 Importante

- O workflow só envia mensagens para líderes que **não preencheram** o relatório
- Apenas líderes com **telefone cadastrado** receberão mensagens
- O link enviado é direto para o líder preencher (não precisa selecionar líder)

## Estrutura da Resposta

```json
{
  "message": "📊 Status dos Relatórios Semanais\n\n⏰ Pendentes (2):\n\n⏰ *João Silva* - Célula Central\n🔗 https://seu-dominio.com/relatorios-semanal?lider=uuid&date=2025-01-20\n\n✅ Preenchidos (3):\n\n✅ *Maria Santos* - Célula Norte\n👥 Membros: 5 | Frequentadores: 2\n",
  "pendentes": 2,
  "preenchidos": 3,
  "total": 5
}
```

## Parâmetros da API

A Supabase Edge Function aceita os seguintes parâmetros de query:

- `date` (opcional): Data do relatório no formato `YYYY-MM-DD`. Se não fornecido, usa a segunda-feira da semana atual.
- `pastor_id` (opcional): ID do pastor para filtrar apenas seus líderes.
- `is_kids` (opcional): `true` ou `false` para filtrar por modo Kids.
- `base_url` (opcional): URL base do frontend para gerar links. Padrão: `https://seu-dominio.com`

### Exemplo de chamada:

```
GET https://seu-projeto.supabase.co/functions/v1/weekly-reports-status?date=2025-01-20&pastor_id=uuid&is_kids=false&base_url=https://videira-conectada.com
```

## Troubleshooting

### Erro: "Function not found"
- Verifique se a função foi deployada corretamente
- Confirme o nome da função: `weekly-reports-status`

### Erro: "Unauthorized"
- Verifique se o `SUPABASE_ANON_KEY` está correto
- Confirme que a Service Role Key está configurada na função

### Nenhum líder retornado
- Verifique se há líderes cadastrados no Supabase
- Confirme o `PASTOR_ID` está correto
- Verifique os filtros `is_kids` se aplicável

## Melhorias Futuras

- [ ] Adicionar notificações por email
- [ ] Criar dashboard visual no N8N
- [ ] Adicionar histórico de status
- [ ] Integrar com Google Sheets para relatórios

