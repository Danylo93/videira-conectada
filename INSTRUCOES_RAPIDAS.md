# 🚀 INSTRUÇÕES RÁPIDAS: Sincronização Automática Google Sheets

## ⚠️ SITUAÇÃO ATUAL:
- ✅ Webhook criado e funcionando
- ✅ Edge Function sendo chamada
- ❌ Google Sheets NÃO atualiza porque falta o Google Apps Script

---

## 🔧 SOLUÇÃO EM 3 PASSOS (10 minutos):

### PASSO 1: Criar Google Apps Script

1. **Abra sua planilha do Google Sheets**
   ```
   https://docs.google.com/spreadsheets/d/1iiU5nCUfVIBaBw-80XgR9cs6irlk748kt3S4UMrc5yE/edit
   ```

2. **Abra Apps Script**
   - Menu: **Extensões** → **Apps Script**

3. **Cole este código** (apague tudo que estiver lá):
   ```javascript
   function doPost(e) {
     try {
       const data = JSON.parse(e.postData.contents);
       const ss = SpreadsheetApp.openById(data.sheet_id);
       let sheet = ss.getSheetByName(data.sheet_name || 'Batizantes');
       if (!sheet) sheet = ss.insertSheet(data.sheet_name || 'Batizantes');
       
       if (!data.values || data.values.length === 0) {
         return ContentService.createTextOutput(JSON.stringify({
           success: false, error: 'Nenhum dado recebido'
         })).setMimeType(ContentService.MimeType.JSON);
       }
       
       sheet.clear();
       sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);
       
       if (data.values.length > 0) {
         const headerRange = sheet.getRange(1, 1, 1, data.values[0].length);
         headerRange.setFontWeight('bold');
         headerRange.setBackground('#4285f4');
         headerRange.setFontColor('#ffffff');
       }
       
       return ContentService.createTextOutput(JSON.stringify({
         success: true, message: 'Planilha atualizada'
       })).setMimeType(ContentService.MimeType.JSON);
     } catch (error) {
       return ContentService.createTextOutput(JSON.stringify({
         success: false, error: error.toString()
       })).setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```

4. **Salve** (Ctrl+S)

5. **Implementar como Web App**
   - Botão **Implementar** (canto superior direito)
   - **Nova implementação**
   - Tipo: **Aplicativo Web**
   - Executar como: **Eu mesmo**
   - Quem tem acesso: **Qualquer pessoa**
   - **Implementar**
   - **Autorizar** quando solicitado
   - **COPIE A URL** que aparece (algo como: `https://script.google.com/macros/s/ABC.../exec`)

---

### PASSO 2: Configurar no Supabase

1. **Supabase Dashboard** → **Settings** (⚙️) → **Edge Functions** → **Secrets**

2. **Add new secret**:
   - **Name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Cole a URL do Passo 1
   - **Save**

---

### PASSO 3: Deploy da Edge Function

No terminal, execute:

```bash
npx supabase functions deploy sync-batizantes-google-sheets
```

---

## ✅ TESTAR

Execute este SQL no Supabase:

```sql
INSERT INTO public.batismo_registrations (
  nome_completo, 
  lider_id, 
  tamanho_camiseta
) VALUES (
  'Teste Automático',
  (SELECT id FROM profiles WHERE role = 'lider' LIMIT 1),
  'G'
);
```

**Aguarde 2-3 segundos e verifique o Google Sheets!** 🎉

---

## 📚 Documentação Completa

Veja `docs/PASSO_A_PASSO_GOOGLE_SHEETS.md` para instruções detalhadas.


