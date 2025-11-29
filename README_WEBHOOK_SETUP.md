# Configuração Rápida do Webhook N8N

## Para Edge Functions do Supabase

Execute um dos comandos abaixo para configurar a variável de ambiente:

### Linux/Mac:
```bash
chmod +x setup-webhook-env.sh
./setup-webhook-env.sh
```

### Windows (PowerShell):
```powershell
.\setup-webhook-env.ps1
```

### Windows (Batch):
```batch
setup-webhook.bat
```

### Ou diretamente via CLI:
```bash
npx supabase secrets set N8N_WEBHOOK_URL=https://webhook.quantum-flow.tech/webhook/weekly-report-reminders
```

## Verificar se foi configurado:

```bash
npx supabase secrets list
```

Você deve ver a variável `N8N_WEBHOOK_URL` na lista.

## Próximos Passos:

1. ✅ Webhook configurado
2. ✅ Workflow do N8N ativo em: https://quantum-flow.tech
3. ✅ Testar enviando um lembrete pelo Dashboard

