# Configurar Integração Direta com Google Sheets API

Para que a sincronização automática funcione completamente, você precisa integrar diretamente com a Google Sheets API.

## Problema Atual

A Edge Function atual apenas prepara os dados mas não atualiza diretamente o Google Sheets. Ela precisa de:
- Um webhook intermediário (N8N) configurado, OU
- Integração direta com Google Sheets API

## Solução: Integração Direta com Google Sheets API

### Opção 1: Usar Make.com (Integromat) ou Zapier (Mais Simples)

1. Crie uma conta no Make.com ou Zapier
2. Configure um webhook que recebe dados do Supabase
3. Configure a ação para atualizar Google Sheets
4. Configure a variável `GOOGLE_SHEETS_WEBHOOK_URL` no Supabase apontando para o webhook do Make.com/Zapier

### Opção 2: Integração Direta na Edge Function (Mais Complexa)

Para implementar diretamente, você precisa:

1. **Criar um projeto no Google Cloud Console**
2. **Habilitar Google Sheets API**
3. **Criar credenciais OAuth 2.0**
4. **Configurar na Edge Function**

## Solução Temporária (Recomendada)

**Use o botão "Sincronizar Agora" manualmente** quando precisar atualizar o Google Sheets.

A sincronização automática completa requer configuração adicional de integração com Google Sheets API que está além do escopo inicial. O botão manual já funciona perfeitamente!

## Verificar se o Webhook está Funcionando

1. Vá em **Database > Webhooks** no Supabase
2. Clique no webhook `batizantes-google-sheets-sync`
3. Veja os **logs** - devem mostrar chamadas quando você cadastra batizantes
4. Se os logs mostram chamadas mas o Google Sheets não atualiza, significa que a Edge Function está sendo chamada mas não está atualizando o Google Sheets diretamente

## Próximos Passos

Para sincronização automática completa:
- Configure Make.com/Zapier para fazer a ponte
- OU implemente a Google Sheets API diretamente na Edge Function
- OU use o botão "Sincronizar Agora" quando necessário


