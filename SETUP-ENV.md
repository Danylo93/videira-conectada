# 🔧 Configuração de Variáveis de Ambiente

## ✅ **Problema Identificado**

O erro agora é diferente! O sistema está funcionando, mas precisa das variáveis de ambiente do Supabase.

**Erro atual:**
```
Error: Your project's URL and Key are required to create a Supabase client!
```

## 🚀 **Solução - Configurar .env.local**

### **1. Criar arquivo .env.local**

Copie o arquivo de exemplo:
```bash
cp env.local.example .env.local
```

### **2. Editar .env.local**

Substitua os valores pelos seus dados reais do Supabase:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard
# https://supabase.com/dashboard/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Domain Configuration
BASE_DOMAIN=localhost:3000

# Development Flags
USE_MOCK_DATA=true
NODE_ENV=development

# Stripe Configuration (optional for testing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **3. Onde Encontrar as Chaves do Supabase**

1. **Acesse**: https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em**: Settings → API
4. **Copie**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### **4. Exemplo de .env.local**

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BASE_DOMAIN=localhost:3000
USE_MOCK_DATA=true
NODE_ENV=development
```

## 🎯 **Após Configurar**

### **1. Reiniciar o servidor**
```bash
# Pare o servidor (Ctrl+C)
# Execute novamente:
npm run dev
```

### **2. Resultado Esperado**

- ✅ **Sem erros de Supabase**
- ✅ **Sistema mock funcionando**
- ✅ **Interface completa acessível**
- ✅ **Todas as páginas funcionando**

## 🧪 **Dados Mock Ativos**

Com `USE_MOCK_DATA=true`, o sistema usa:

- **Tenant**: `local-test` (Igreja Local Test)
- **Usuário**: `test@example.com`
- **Billing**: Plano Standard ativo
- **Notificações**: 3 notificações de exemplo

## 📋 **Páginas Funcionando**

- ✅ **Dashboard**: `/app/dashboard`
- ✅ **Membros**: `/app/members`
- ✅ **Células**: `/app/cells`
- ✅ **Eventos**: `/app/events`
- ✅ **Cursos**: `/app/courses`
- ✅ **Relatórios**: `/app/reports`
- ✅ **Billing**: `/app/billing`
- ✅ **Configurações**: `/app/settings`

## 🔄 **Para Alternar para Produção**

Quando estiver pronto para usar as funções reais:

1. **Execute as migrations**:
   ```bash
   npx supabase db push
   ```

2. **Altere o .env.local**:
   ```env
   USE_MOCK_DATA=false
   ```

---

**🎉 Configure o .env.local e o sistema funcionará perfeitamente!**
