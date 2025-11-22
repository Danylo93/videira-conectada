# Como Configurar Autenticação no N8N para Supabase Edge Functions

## Problema Comum

Ao configurar o nó HTTP Request no N8N para chamar a Supabase Edge Function, você pode ver um aviso vermelho ao lado de "Select Credential" na seção de autenticação.

## Solução

**A Supabase Edge Function NÃO precisa de Basic Auth ou Generic Auth!**

### Passo a Passo

1. **Abra o nó "Buscar Status dos Líderes" (HTTP Request)**

2. **Na seção "Authentication":**
   - Selecione: **"None"** (não use Basic Auth, Generic Auth ou qualquer outra opção)
   - **Ignore o aviso vermelho** se aparecer - não é necessário configurar credencial

3. **Configure os Headers manualmente:**
   - Vá em **"Options"** (no final do formulário)
   - Expanda **"Headers"**
   - Clique em **"Add Header"**
   - Adicione os seguintes headers:

   **Header 1:**
   - **Name**: `apikey`
   - **Value**: `={{ $env.SUPABASE_ANON_KEY }}`

   **Header 2:**
   - **Name**: `Authorization`
   - **Value**: `Bearer {{ $env.SUPABASE_ANON_KEY }}`

4. **Configure a URL:**
   - **URL**: `={{ $env.SUPABASE_URL }}/functions/v1/weekly-reports-status`

5. **Configure Query Parameters:**
   - Ative **"Send Query"**
   - Adicione os parâmetros:
     - `date`: `={{ $now.toFormat('yyyy-MM-dd') }}`
     - `pastor_id`: `={{ $env.PASTOR_ID }}`
     - `is_kids`: `false`
     - `base_url`: `={{ $env.FRONTEND_URL }}`

## Configuração Visual

```
┌─────────────────────────────────────┐
│ HTTP Request Node                   │
├─────────────────────────────────────┤
│ URL: {{ $env.SUPABASE_URL }}/...    │
│                                     │
│ Authentication: None ✅             │
│                                     │
│ Send Query: ✅                      │
│ Query Parameters:                   │
│   - date: {{ $now.toFormat(...) }}  │
│   - pastor_id: {{ $env.PASTOR_ID }} │
│                                     │
│ Options > Headers:                   │
│   - apikey: {{ $env.SUPABASE_... }} │
│   - Authorization: Bearer {{ ... }}  │
└─────────────────────────────────────┘
```

## Por que não usar Basic Auth?

A Supabase Edge Function usa autenticação via headers (`apikey` e `Authorization`), não Basic Auth. Se você configurar Basic Auth, o N8N tentará adicionar um header `Authorization: Basic {base64}` que não é o formato esperado pela Supabase.

## Verificação

Após configurar, teste o nó:
1. Clique em **"Execute Node"**
2. Verifique se retorna dados (array de líderes)
3. Se retornar erro 401/403, verifique se os headers estão corretos
4. Se retornar erro 406, verifique se a URL está correta

## Exemplo de Configuração Correta

```json
{
  "parameters": {
    "url": "={{ $env.SUPABASE_URL }}/functions/v1/weekly-reports-status",
    "authentication": "none",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "date",
          "value": "={{ $now.toFormat('yyyy-MM-dd') }}"
        },
        {
          "name": "pastor_id",
          "value": "={{ $env.PASTOR_ID }}"
        }
      ]
    },
    "options": {
      "headers": {
        "headers": [
          {
            "name": "apikey",
            "value": "={{ $env.SUPABASE_ANON_KEY }}"
          },
          {
            "name": "Authorization",
            "value": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
          }
        ]
      }
    }
  }
}
```




