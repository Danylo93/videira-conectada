# Passo a Passo: Configurar Sincronização Automática com Google Sheets

## ✅ O que já está funcionando:
- ✅ Webhook criado e funcionando
- ✅ Edge Function sendo chamada automaticamente
- ✅ Dados sendo preparados

## ❌ O que falta:
- ❌ Enviar os dados para o Google Sheets (precisa do Google Apps Script)

---

## 📝 PASSO A PASSO COMPLETO

### PASSO 1: Criar Google Apps Script (5 minutos)

1. **Abra sua planilha do Google Sheets**
   - URL: `https://docs.google.com/spreadsheets/d/1iiU5nCUfVIBaBw-80XgR9cs6irlk748kt3S4UMrc5yE/edit`
   - Ou acesse diretamente a planilha que você já configurou

2. **Abra o Google Apps Script**
   - No menu: **Extensões > Apps Script**
   - Isso abre uma nova aba com o editor de scripts

3. **Apague o código padrão** e cole este código:

```javascript
function doPost(e) {
  try {
    // Receber os dados do Supabase
    const data = JSON.parse(e.postData.contents);
    
    // Abrir a planilha pelo ID
    const ss = SpreadsheetApp.openById(data.sheet_id);
    
    // Obter ou criar a aba
    let sheet = ss.getSheetByName(data.sheet_name || 'Batizantes');
    if (!sheet) {
      sheet = ss.insertSheet(data.sheet_name || 'Batizantes');
    }
    
    // Verificar se há dados
    if (!data.values || data.values.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Nenhum dado recebido'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Limpar dados antigos e escrever novos
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

4. **Salvar o projeto**
   - Clique em **Salvar** (💾) ou pressione **Ctrl+S** (Windows) / **Cmd+S** (Mac)
   - Dê um nome ao projeto: `Sincronização Batizantes`

5. **Implementar como Aplicativo Web**
   - Clique no botão **Implementar** (no canto superior direito)
   - Selecione **Nova implementação**
   - Na janela que abrir:
     - **Tipo**: Selecione **Aplicativo Web**
     - **Nome da descrição**: Deixe o padrão ou dê um nome
     - **Executar como**: Selecione **Eu mesmo**
     - **Quem tem acesso**: Selecione **Qualquer pessoa**
   - Clique no botão **Implementar**
   - **AUTORIZAÇÃO**: 
     - Clique em **Autorizar acesso**
     - Escolha sua conta do Google
     - Clique em **Avançado** > **Ir para [nome do projeto] (não seguro)**
     - Clique em **Permitir**

6. **Copiar a URL do Web App**
   - Após autorizar, você verá uma tela com a URL
   - **COPIE essa URL** (algo como: `https://script.google.com/macros/s/AKfycby.../exec`)
   - **IMPORTANTE**: Você vai precisar dessa URL no próximo passo!

---

### PASSO 2: Configurar a URL no Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Adicionar Secret (Variável de Ambiente)**
   - No menu lateral: **Project Settings** (ícone de engrenagem ⚙️)
   - Clique em **Edge Functions** (no menu lateral esquerdo)
   - Clique na aba **Secrets**
   - Clique no botão **Add new secret**

3. **Configurar o Secret**
   - **Name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Cole a URL do Google Apps Script que você copiou no Passo 1
   - Clique em **Save**

---

### PASSO 3: Fazer Deploy da Edge Function (se ainda não fez)

Execute no terminal:

```bash
npx supabase functions deploy sync-batizantes-google-sheets
```

---

### PASSO 4: Testar

1. **Cadastre um novo batizante** na página pública de cadastro
   - Ou execute o SQL de teste no Supabase:
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

2. **Aguarde 2-3 segundos**

3. **Verifique o Google Sheets**
   - A planilha deve ser atualizada automaticamente com todos os dados!

---

## 🔍 Verificar se está funcionando

### Verificar Logs da Edge Function:
1. Supabase Dashboard > Edge Functions > sync-batizantes-google-sheets
2. Aba **Logs**
3. Deve aparecer chamadas quando você cadastrar batizantes

### Verificar se o Webhook está ativo:
1. Supabase Dashboard > Database > Webhooks
2. Verifique se o webhook `batizantes-google-sheets-sync` está **Active**

---

## 🐛 Problemas Comuns

### "Edge Function not found"
- Execute: `npx supabase functions deploy sync-batizantes-google-sheets`

### "Webhook failed"
- Verifique se a URL do Google Apps Script está correta
- Verifique se o Google Apps Script está implementado e autorizado

### "Nenhum dado recebido"
- Verifique se o formato dos dados está correto
- Verifique os logs da Edge Function

### Planilha não atualiza
- Verifique se o ID da planilha está correto na configuração
- Verifique se você deu permissão ao Google Apps Script para editar a planilha

---

## ✅ Resultado Final

Depois de configurado, o fluxo será:

1. **Usuário cadastra batizante** → Banco de dados
2. **Webhook detecta mudança** → Chama Edge Function
3. **Edge Function prepara dados** → Envia para Google Apps Script
4. **Google Apps Script atualiza** → Planilha do Google Sheets

Tudo automático! 🎉


