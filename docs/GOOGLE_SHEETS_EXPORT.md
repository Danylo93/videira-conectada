# Exportação para Google Sheets

A funcionalidade de exportação para Google Sheets permite que os dados dos batizantes sejam facilmente exportados para o Google Sheets.

## Como Usar

1. Na página de **Batizantes**, clique no botão **"Exportar Google Sheets"**
2. Um arquivo CSV será baixado automaticamente
3. Uma nova aba do Google Sheets será aberta
4. No Google Sheets, vá em **Arquivo > Importar > Fazer upload**
5. Selecione o arquivo CSV baixado
6. Escolha as opções de importação desejadas
7. Clique em **Importar dados**

## Configuração Avançada (Opcional)

Para uma integração automática direta com o Google Sheets (sem download manual), você pode configurar:

### Opção 1: Usar Edge Function com Webhook

1. Crie um webhook no N8N ou outro serviço que receba os dados e envie para Google Sheets
2. Configure a variável de ambiente `GOOGLE_SHEETS_WEBHOOK_URL` no Supabase
3. Faça deploy da Edge Function:

```bash
npx supabase functions deploy export-to-google-sheets
```

### Opção 2: Integração Direta com Google Sheets API

Para uma integração mais robusta, você precisará:

1. Criar um projeto no Google Cloud Console
2. Habilitar a Google Sheets API
3. Criar credenciais OAuth 2.0
4. Configurar as credenciais como secrets no Supabase
5. Modificar a Edge Function para usar a API do Google Sheets

## Estrutura dos Dados Exportados

O arquivo CSV contém as seguintes colunas:

- **Nome Completo**: Nome completo do batizante
- **Líder**: Nome do líder responsável
- **Tamanho Camiseta**: Tamanho da camiseta (P, M, G, GG)
- **Data de Cadastro**: Data em que o batizante foi cadastrado

## Notas

- O arquivo CSV usa encoding UTF-8 com BOM para garantir que caracteres especiais sejam exibidos corretamente
- Os dados exportados respeitam os filtros aplicados na tela (busca, líder, etc.)
- O arquivo é nomeado automaticamente com a data atual: `Batizantes_YYYY-MM-DD.csv`


