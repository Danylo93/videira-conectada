# 🚨 CONFIGURAÇÃO RÁPIDA - Google Sheets Webhook

## O Problema
A sincronização está funcionando (4.9 segundos), mas o Google Sheets não atualiza porque a URL do webhook não está configurada.

## ✅ SOLUÇÃO EM 2 PASSOS:

### PASSO 1: Criar Google Apps Script (5 minutos)

1. **Abra sua planilha do Google Sheets**
   - Abra: https://docs.google.com/spreadsheets/d/1iiU5nCUfVIBaBw-80XgR9cs6irlk748kt3S4UMrc5yE/edit

2. **Abra o Google Apps Script**
   - Menu: **Extensões** > **Apps Script**

3. **Cole este código** (substitua tudo):

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
    const numRows = data.values.length;
    const numCols = data.values[0].length;
    sheet.getRange(1, 1, numRows, numCols).setValues(data.values);
    
    if (numRows > 0) {
      const headerRange = sheet.getRange(1, 1, 1, numCols);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Planilha atualizada com sucesso',
      rows: numRows,
      cols: numCols
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro no Google Apps Script:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. **Salvar** (Ctrl+S ou Cmd+S)

5. **Implementar como Web App**
   - Botão **Implementar** (canto superior direito) > **Nova implementação**
   - **Tipo**: Aplicativo Web
   - **Executar como**: Eu mesmo
   - **Quem tem acesso**: Qualquer pessoa
   - **Implementar** > **Autorizar acesso** > Escolher conta > **Avançado** > **Ir para... (não seguro)** > **Permitir**

6. **COPIE a URL** que aparece (algo como: `https://script.google.com/macros/s/AKfycby.../exec`)

---

### PASSO 2: Configurar no Supabase (2 minutos)

1. **Acesse**: https://app.supabase.com/project/wkdfeizgfdkkkyatevpc/settings/functions

2. **Vá em**: Edge Functions > **Secrets** (aba)

3. **Clique**: **Add new secret**

4. **Preencha**:
   - **Name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Cole a URL do Google Apps Script que você copiou
   - **Save**

5. **Pronto!** 🎉

---

## 🧪 TESTAR AGORA:

1. Clique no botão **"Sincronizar Agora"** na página de Batizantes
2. Aguarde 5-10 segundos
3. Atualize a planilha do Google Sheets (F5)
4. Os dados devem aparecer! ✅

---

## 🔍 Verificar Logs:

Se ainda não funcionar, veja os logs:
1. Supabase Dashboard > Edge Functions > sync-batizantes-google-sheets > **Logs**
2. Procure por mensagens que começam com:
   - ✅ = Está funcionando
   - ⚠️ = Webhook não configurado
   - ❌ = Erro no webhook
   - 📤 = Enviando dados
   - 📥 = Resposta recebida


