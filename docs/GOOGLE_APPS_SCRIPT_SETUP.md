# Configurar Google Apps Script para Atualizar Planilha Automaticamente

A melhor solução para sincronização automática é criar um Google Apps Script que recebe os dados via webhook e atualiza a planilha.

## Passo 1: Criar o Google Apps Script

1. Abra sua planilha do Google Sheets
2. Vá em **Extensões > Apps Script**
3. Cole o seguinte código:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheet_name || 'Batizantes');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Limpar dados existentes (opcional - pode comentar se quiser manter histórico)
    // sheet.clear();
    
    // Escrever headers
    if (data.values && data.values.length > 0) {
      sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Sheet updated successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Salve o script (Ctrl+S ou Cmd+S)
5. Clique em **Implementar > Nova implementação**
6. Selecione:
   - **Tipo**: Aplicativo Web
   - **Executar como**: Eu mesmo
   - **Quem tem acesso**: Qualquer pessoa
7. Clique em **Implementar**
8. Copie a URL do Web App (algo como: `https://script.google.com/macros/s/...`)

## Passo 2: Configurar a URL do Webhook na Edge Function

1. No Supabase Dashboard, vá em **Project Settings > Edge Functions > Secrets**
2. Adicione a variável de ambiente:
   - **Name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Cole a URL do Google Apps Script que você copiou

## Passo 3: Testar

1. Cadastre um novo batizante
2. Aguarde alguns segundos
3. Verifique se aparece automaticamente no Google Sheets

## Alternativa Simples: Usar Make.com ou Zapier

Se preferir uma solução mais simples sem código:

1. Crie uma conta no Make.com (gratuito para até 1000 operações/mês)
2. Configure:
   - **Trigger**: Webhook (recebe do Supabase)
   - **Action**: Google Sheets > Update Spreadsheet Row
3. Configure o webhook do Supabase para chamar o Make.com

Esta é a solução mais simples e não requer código!


