/**
 * Google Apps Script para atualizar planilha automaticamente
 * 
 * INSTRUÇÕES:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código
 * 4. Salve (Ctrl+S)
 * 5. Clique em "Implementar" > "Nova implementação"
 * 6. Tipo: "Aplicativo Web"
 * 7. Executar como: "Eu mesmo"
 * 8. Quem tem acesso: "Qualquer pessoa"
 * 9. Clique em "Implementar"
 * 10. Copie a URL gerada e configure no Supabase como GOOGLE_SHEETS_WEBHOOK_URL
 */

function doPost(e) {
  try {
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Abrir a planilha pelo ID
    const ss = SpreadsheetApp.openById(data.sheet_id);
    
    // Obter a aba específica ou criar se não existir
    let sheet = ss.getSheetByName(data.sheet_name || 'Batizantes');
    
    if (!sheet) {
      // Se a aba não existir, criar
      sheet = ss.insertSheet(data.sheet_name || 'Batizantes');
    }
    
    // Verificar se há dados para atualizar
    if (!data.values || data.values.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Nenhum dado recebido'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Limpar dados existentes (opcional - remove se quiser manter histórico)
    sheet.clear();
    
    // Escrever os novos dados
    const numRows = data.values.length;
    const numCols = data.values[0].length;
    
    sheet.getRange(1, 1, numRows, numCols).setValues(data.values);
    
    // Formatar cabeçalho (opcional)
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
    // Log do erro para debug
    console.error('Erro no Google Apps Script:', error);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função de teste (opcional)
function testUpdate() {
  const testData = {
    sheet_id: '1iiU5nCUfVIBaBw-80XgR9cs6irlk748kt3S4UMrc5yE',
    sheet_name: 'Batizantes',
    values: [
      ['Nome Completo', 'Líder', 'Tamanho Camiseta', 'Data de Cadastro'],
      ['Teste', 'Líder Teste', 'M', '25/01/2025']
    ]
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}

