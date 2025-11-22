# Como Atualizar a Edge Function

A Edge Function `weekly-reports-status` foi atualizada para buscar relatórios de **toda a semana** (segunda a domingo), não apenas da segunda-feira.

## Deploy Necessário

Para aplicar as correções, você precisa fazer o deploy novamente:

```bash
npx supabase functions deploy weekly-reports-status
```

## O que foi corrigido

1. **Busca de relatórios**: Agora busca relatórios de toda a semana (segunda a domingo)
2. **Múltiplos relatórios**: Se um líder tiver múltiplos relatórios na semana, usa o mais recente
3. **Validação de datas**: Melhor tratamento de datas inválidas

## Verificar se funcionou

Após o deploy:

1. Acesse o dashboard público:
   ```
   https://seu-dominio.com/dashboard-relatorios-semanais/SEU_PASTOR_ID
   ```

2. Clique em "Atualizar"

3. Verifique se os líderes que preencheram aparecem como "Preenchido" (verde)

## Se ainda não funcionar

1. Verifique os logs da Edge Function no Supabase Dashboard
2. Confirme que há relatórios na tabela `cell_reports_weekly` para a semana atual
3. Verifique se as datas dos relatórios estão no formato correto (YYYY-MM-DD)

## Teste direto da Edge Function

Você pode testar a Edge Function diretamente:

```bash
curl "https://wkdfeizgfdkkkyatevpc.supabase.co/functions/v1/weekly-reports-status?date=2025-11-17&pastor_id=SEU_PASTOR_ID&is_kids=false" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY"
```

Substitua:
- `2025-11-17` pela segunda-feira da semana atual
- `SEU_PASTOR_ID` pelo ID do pastor
- `SUA_ANON_KEY` pela sua chave anon do Supabase

