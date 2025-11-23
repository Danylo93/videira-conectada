# Como Debugar o Workflow N8N

## Problema: "No output data returned"

Se o nó "Processar Dados" não está retornando dados, siga estes passos:

### 1. Verificar os Dados Recebidos

1. No N8N, clique no nó **"Webhook Receber Dados"**
2. Clique em **"Execute Node"** (ou aguarde uma execução real)
3. Veja o painel **OUTPUT** à direita
4. Verifique se os dados estão chegando

### 2. Verificar o Formato dos Dados

Os dados podem vir em diferentes formatos:

**Formato 1 (mais comum):**
```json
{
  "body": {
    "type": "weekly_report_reminder",
    "leaders": [...]
  }
}
```

**Formato 2:**
```json
{
  "type": "weekly_report_reminder",
  "leaders": [...]
}
```

### 3. Ajustar o Código do Nó "Processar Dados"

Se os dados não estão sendo processados, ajuste o código:

```javascript
// Opção 1: Se os dados vêm em body
const body = $input.item.json.body;

// Opção 2: Se os dados vêm diretamente
const body = $input.item.json;

// Opção 3: Tentar ambos
const inputData = $input.item.json;
const body = inputData.body || inputData;
```

### 4. Usar Console.log para Debug

Adicione logs no código:

```javascript
console.log('Input completo:', JSON.stringify($input.item.json, null, 2));
console.log('Body:', JSON.stringify(body, null, 2));
console.log('Type:', body.type);
console.log('Leaders:', body.leaders);
```

### 5. Ver os Logs

1. No N8N, vá em **Executions**
2. Clique na execução que falhou
3. Clique no nó "Processar Dados"
4. Veja a aba **"Logs"** para ver os console.log

### 6. Testar Manualmente

Você pode testar enviando dados manualmente:

1. No nó "Webhook Receber Dados", copie a URL do webhook
2. Use Postman ou curl para enviar:

```bash
curl -X POST https://seu-n8n.com/webhook/lembretes-relatorios \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weekly_report_reminder",
    "leaders": [
      {
        "name": "Teste",
        "phone": "5511999999999",
        "fillLink": "https://exemplo.com",
        "weekRange": "20/01/2025 a 26/01/2025"
      }
    ],
    "weekStartDate": "2025-01-20",
    "weekEndDate": "2025-01-26"
  }'
```

### 7. Verificar se o Workflow está Ativo

Certifique-se de que o workflow está **Active** (botão no canto superior direito)

### 8. Verificar a Edge Function

Verifique se a edge function está enviando os dados corretamente:

1. Veja os logs da edge function no Supabase Dashboard
2. Verifique se o formato JSON está correto

## Solução Rápida

Se nada funcionar, tente este código mais simples no nó "Processar Dados":

```javascript
// Pegar todos os dados
const allData = $input.item.json;

// Tentar encontrar os dados em diferentes lugares
let leaders = null;
let weekStartDate = null;
let weekEndDate = null;

if (allData.body && allData.body.leaders) {
  leaders = allData.body.leaders;
  weekStartDate = allData.body.weekStartDate;
  weekEndDate = allData.body.weekEndDate;
} else if (allData.leaders) {
  leaders = allData.leaders;
  weekStartDate = allData.weekStartDate;
  weekEndDate = allData.weekEndDate;
}

if (leaders && Array.isArray(leaders) && leaders.length > 0) {
  return leaders.map(leader => ({
    json: {
      name: leader.name,
      phone: leader.phone,
      celula: leader.celula || '',
      fillLink: leader.fillLink,
      weekRange: leader.weekRange,
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate
    }
  }));
}

return [];
```

