# Solução Rápida: Sincronização Automática com Google Sheets

## Problema

O webhook foi criado mas não está atualizando automaticamente porque a Edge Function precisa de um intermediário para atualizar o Google Sheets diretamente.

## Solução Mais Simples: Google Apps Script

### Passo 1: Criar Google Apps Script (5 minutos)

1. **Abra sua planilha do Google Sheets**
   - A que você já configurou: `1iiU5nCUfVIBaBw-80XgR9cs6irlk748kt3S4UMrc5yE`

2. **Vá em Extensões > Apps Script**

3. **Cole este código**:

**Código completo disponível no arquivo `GOOGLE_APPS_SCRIPT_CODE.js`**

Copie o código do arquivo `GOOGLE_APPS_SCRIPT_CODE.js` que está na raiz do projeto, ou use:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(data.sheet_id);
    let sheet = ss.getSheetByName(data.sheet_name || 'Batizantes');
    
    if (!sheet) {
      sheet = ss.insertSheet(data.sheet_name || 'Batizantes');
    }
    
    if (!data.values || data.values.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Nenhum dado recebido'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.clear();
    sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);
    
    // Formatar cabeçalho
    if (data.values.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, data.values[0].length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Planilha atualizada com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. **Salve o projeto** (Ctrl+S)
   - Dê um nome: "Sincronização Batizantes"

5. **Implementar como Web App**:
   - Clique em **Implementar > Nova implementação**
   - Tipo: **Aplicativo Web**
   - Executar como: **Eu mesmo**
   - Quem tem acesso: **Qualquer pessoa**
   - Clique em **Implementar**
   - **Copie a URL** que aparece (algo como: `https://script.google.com/macros/s/ABC123.../exec`)

### Passo 2: Configurar no Supabase

1. **No Supabase Dashboard**:
   - Vá em **Project Settings > Edge Functions > Secrets**
   - Clique em **Add new secret**
   - **Name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Cole a URL do Google Apps Script que você copiou
   - Clique em **Save**

### Passo 3: Testar

1. Cadastre um novo batizante na página pública
2. Aguarde 2-3 segundos
3. Verifique se aparece automaticamente no Google Sheets!

## Se não funcionar

1. Verifique os logs da Edge Function no Supabase
2. Verifique se o webhook está ativo
3. Teste o Google Apps Script manualmente usando Postman ou curl

## Resultado Esperado

✅ Webhook detecta mudanças  
✅ Edge Function é chamada automaticamente  
✅ Dados são enviados para Google Apps Script  
✅ Planilha é atualizada automaticamente  

