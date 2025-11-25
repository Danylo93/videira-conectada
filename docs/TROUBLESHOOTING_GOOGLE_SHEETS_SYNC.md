# Troubleshooting: Sincronização Automática não Funciona

## Problema: Webhook criado mas não atualiza automaticamente

### Passo 1: Verificar se a Edge Function está Deployada

Execute no terminal:

```bash
npx supabase functions deploy sync-batizantes-google-sheets
```

### Passo 2: Verificar os Logs do Webhook

1. No Supabase Dashboard, vá em **Database > Webhooks**
2. Clique no webhook `batizantes-google-sheets-sync`
3. Veja os logs de execução
4. Procure por erros ou requisições falhadas

### Passo 3: Verificar os Logs da Edge Function

1. No Supabase Dashboard, vá em **Edge Functions > sync-batizantes-google-sheets**
2. Clique na aba **Logs**
3. Veja se há chamadas sendo feitas quando você cadastra um novo batizante
4. Procure por erros

### Passo 4: Testar o Webhook Manualmente

No SQL Editor do Supabase, execute:

```sql
-- Inserir um registro de teste para verificar se o webhook é acionado
INSERT INTO public.batismo_registrations (
  nome_completo, 
  lider_id, 
  tamanho_camiseta
) VALUES (
  'Teste Webhook',
  (SELECT id FROM profiles WHERE role = 'lider' LIMIT 1),
  'M'
);
```

Depois, verifique:
- Os logs do webhook
- Os logs da Edge Function
- Se o Google Sheets foi atualizado

### Passo 5: Verificar a Configuração do Webhook

O webhook precisa ter:

1. **URL correta**: 
   ```
   https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/sync-batizantes-google-sheets
   ```

2. **Header de Authorization**:
   - Nome: `Authorization`
   - Valor: `Bearer SUA_SERVICE_ROLE_KEY`
   - Você encontra a Service Role Key em: Settings > API > service_role key

3. **Header Content-Type**:
   - Nome: `Content-Type`
   - Valor: `application/json`

### Passo 6: Problema Comum - Edge Function não atualiza Google Sheets diretamente

A Edge Function atual apenas **prepara os dados** mas não atualiza diretamente o Google Sheets. Ela precisa de um webhook intermediário (N8N) ou integração direta com a Google Sheets API.

**Solução Temporária**: Use o botão "Sincronizar Agora" na interface quando precisar atualizar.

**Solução Permanente**: Configure integração direta com Google Sheets API (ver próximo passo).

### Passo 7: Integração Direta com Google Sheets API (Recomendado)

Para sincronização automática real, você precisa:

1. **Configurar Google OAuth 2.0**
2. **Usar Google Sheets API diretamente**
3. **Atualizar a Edge Function**

Consulte: https://developers.google.com/sheets/api/quickstart/nodejs

Ou use um serviço intermediário como N8N para fazer a ponte.

## Verificações Rápidas

✅ Webhook criado? → Verifique em Database > Webhooks  
✅ Edge Function deployada? → Execute `npx supabase functions deploy sync-batizantes-google-sheets`  
✅ Configuração salva? → Verifique se o badge mostra "Google Sheets Ativo"  
✅ Headers configurados? → Verifique se Authorization e Content-Type estão no webhook  
✅ Logs mostrando chamadas? → Verifique os logs quando cadastrar um novo batizante  

## Próximos Passos

Se nada funcionar, a sincronização manual (botão "Sincronizar Agora") sempre funcionará. Para automatizar completamente, será necessário configurar a integração direta com a Google Sheets API.


