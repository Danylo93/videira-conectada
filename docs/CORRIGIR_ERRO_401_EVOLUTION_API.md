# Como Corrigir Erro 401 (Unauthorized) na Evolution API

## Problema
O erro `401 - Unauthorized` significa que as credenciais da Evolution API não estão configuradas corretamente no N8N.

## Solução Passo a Passo

### 1. Verificar Credenciais da Evolution API

No painel da Evolution API (evolution.quantum-flow.tech):
1. Acesse a instância "agencia" (ou a que você está usando)
2. Vá em **Configurations** > **API**
3. Copie:
   - **API URL**: Exemplo: `https://evolution.quantum-flow.tech`
   - **API Key**: A chave de autenticação

### 2. Configurar Credencial no N8N

1. No N8N, vá em **Credentials** (ícone de chave no menu lateral)
2. Procure por **"Evolution API"** ou clique em **"Add Credential"**
3. Se já existe uma credencial chamada "Pessoal":
   - Clique nela para editar
   - Verifique se está correta
4. Se não existe ou precisa criar nova:
   - Clique em **"Add Credential"**
   - Procure por **"Evolution API"** na lista
   - Se não encontrar, procure por **"HTTP Request"** ou **"Custom API"**
   - Configure:
     - **Name**: `Evolution API Videira` (ou qualquer nome)
     - **API URL**: Cole a URL da sua Evolution API
     - **API Key**: Cole a chave de autenticação
     - **Authentication**: Selecione **"Header Auth"** ou **"API Key"**
       - **Header Name**: `apikey` ou `Authorization`
       - **Header Value**: Cole a API Key aqui

### 3. Atualizar o Nó "Enviar texto" no Workflow

1. No workflow, clique no nó **"Enviar texto"**
2. Em **"Credential to connect with"**:
   - Selecione a credencial que você acabou de criar/editar
3. Em **"Nome Da Instancia"**:
   - Verifique se está igual ao nome da instância na Evolution API
   - Exemplo: `agencia` (sem espaços, minúsculo)
4. Salve o workflow

### 4. Verificar Variável de Ambiente (Opcional)

Se você está usando variável de ambiente para o nome da instância:

1. No N8N, vá em **Settings** > **Environment Variables**
2. Verifique se existe:
   - `EVOLUTION_INSTANCE_NAME=agencia`
3. Se não existe, adicione

### 5. Testar Novamente

1. No workflow, clique em **"Execute Workflow"** (ou aguarde um webhook real)
2. Verifique se o erro 401 desapareceu
3. Se ainda der erro, veja os logs detalhados

## Formato Correto das Credenciais

### Opção 1: Usando Header Auth
```
Header Name: apikey
Header Value: SUA_API_KEY_AQUI
```

### Opção 2: Usando Authorization Bearer
```
Header Name: Authorization
Header Value: Bearer SUA_API_KEY_AQUI
```

### Opção 3: Usando Query Parameter (menos comum)
```
URL: https://evolution.quantum-flow.tech?apikey=SUA_API_KEY_AQUI
```

## Verificar se a Instância está Conectada

1. No painel da Evolution API, verifique se a instância "agencia" está:
   - **Status**: "Connected" (verde)
   - **QR Code**: Se não estiver conectado, escaneie o QR Code novamente

## Troubleshooting

### Erro persiste após configurar credenciais
1. Verifique se a API Key está correta (sem espaços extras)
2. Verifique se a URL da API está correta
3. Teste a API diretamente usando Postman ou curl:
   ```bash
   curl -X GET "https://evolution.quantum-flow.tech/instance/fetchInstances" \
     -H "apikey: SUA_API_KEY"
   ```

### Instância não encontrada
- Verifique se o nome da instância no N8N está **exatamente** igual ao nome na Evolution API
- Nomes são case-sensitive (maiúsculas/minúsculas importam)

### Ainda não funciona
- Veja os logs detalhados no N8N em **Executions**
- Copie a mensagem de erro completa
- Verifique a documentação da Evolution API: https://doc.evolution-api.com

