# 🧪 Desenvolvimento Local - Sem Migrations

Este guia te permite testar o sistema SaaS localmente **sem executar as migrations** e sem modificar seu banco de dados existente.

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp env.local.example .env.local
```

Edite `.env.local` com suas configurações:

```env
# Supabase (use seu projeto existente)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (use chaves de teste)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Desenvolvimento
BASE_DOMAIN=localhost:3000
USE_MOCK_DATA=true
NODE_ENV=development
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

Acesse: `http://localhost:3000`

## 🔧 Como Funciona o Modo Mock

### Dados Simulados

O sistema usa dados mockados para simular:

- **Tenant**: `local-test` (Igreja Local Test)
- **Usuário**: `test@example.com` (Usuário Teste)
- **Billing**: Plano Standard ativo por 30 dias
- **Notificações**: 3 notificações de exemplo

### Funcionalidades Disponíveis

✅ **Todas as páginas funcionam**:
- Dashboard
- Membros
- Células  
- Eventos
- Cursos
- Relatórios
- Billing
- Configurações

✅ **Sistema de notificações**:
- Bell no header com notificações mockadas
- Contador de não lidas

✅ **Navegação completa**:
- Sidebar funcional
- Header com notificações
- Todas as rotas acessíveis

### Dados Mockados

#### Tenant
```json
{
  "id": "mock-tenant-id",
  "slug": "local-test", 
  "name": "Igreja Local Test",
  "active": true
}
```

#### Billing
```json
{
  "plan": "standard",
  "status": "active",
  "current_period_end": "30 dias no futuro",
  "payment_method_type": "card"
}
```

#### Notificações
- Bem-vindo ao sistema
- Assinatura ativa
- Relatório pendente

## 🎯 Testando Funcionalidades

### 1. Dashboard
- Acesse `/app/dashboard`
- Veja estatísticas mockadas
- Teste navegação entre seções

### 2. Billing
- Acesse `/app/billing`
- Veja status da assinatura
- Teste botões de ação (não funcionam sem Stripe real)

### 3. Notificações
- Clique no sino no header
- Veja notificações mockadas
- Teste marcar como lida

### 4. Páginas de Conteúdo
- **Membros**: `/app/members`
- **Células**: `/app/cells`
- **Eventos**: `/app/events`
- **Cursos**: `/app/courses`
- **Relatórios**: `/app/reports`

## 🔄 Alternando Entre Modos

### Modo Mock (Desenvolvimento)
```env
USE_MOCK_DATA=true
NODE_ENV=development
```

### Modo Produção (com migrations)
```env
USE_MOCK_DATA=false
NODE_ENV=production
```

## 📁 Estrutura dos Arquivos Mock

```
src/lib/
├── tenant-dev.ts          # Funções de tenant mockadas
├── auth-dev.ts            # Funções de auth mockadas  
├── notifications-dev.ts   # Notificações mockadas
├── config-dev.ts          # Configurações de desenvolvimento
└── index.ts               # Exporta versão correta baseada no ambiente
```

## 🚨 Limitações do Modo Mock

### O que NÃO funciona:
- ❌ Criação real de tenants
- ❌ Pagamentos reais (Stripe)
- ❌ Persistência de dados
- ❌ Webhooks do Stripe
- ❌ Exportação real de dados
- ❌ Backup real

### O que funciona:
- ✅ Interface completa
- ✅ Navegação
- ✅ Componentes UI
- ✅ Fluxo de usuário
- ✅ Notificações
- ✅ Responsividade

## 🎨 Personalizando Dados Mock

Edite os arquivos em `src/lib/` para personalizar:

### Alterar Tenant Mock
```typescript
// src/lib/tenant-mock.ts
const MOCK_TENANT: MockTenant = {
  id: 'mock-tenant-id',
  slug: 'minha-igreja',        // ← Altere aqui
  name: 'Minha Igreja',        // ← Altere aqui
  // ...
}
```

### Alterar Notificações Mock
```typescript
// src/lib/notifications-dev.ts
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    title: 'Sua notificação',  // ← Adicione aqui
    message: 'Mensagem...',    // ← Adicione aqui
    // ...
  }
]
```

## 🔍 Debugging

### Verificar Modo Ativo
No console do navegador, você verá:
```
🔧 Using development/mock implementations
```

### Logs de Mock
As funções mockadas fazem log no console:
```
Mock: Marking notification as read
Mock: Creating tenant notification
```

## 🚀 Próximos Passos

1. **Teste a interface** - Navegue por todas as páginas
2. **Personalize dados** - Edite os mocks conforme necessário
3. **Teste responsividade** - Verifique em diferentes tamanhos
4. **Quando estiver pronto** - Execute as migrations para produção

## ❓ Problemas Comuns

### Página não carrega
- Verifique se `USE_MOCK_DATA=true` no `.env.local`
- Reinicie o servidor: `npm run dev`

### Dados não aparecem
- Verifique o console para logs de mock
- Confirme que está em modo desenvolvimento

### Erro de importação
- Verifique se todos os arquivos mock estão criados
- Confirme que `src/lib/index.ts` está correto

---

**🎉 Agora você pode testar todo o sistema localmente sem modificar seu banco de dados!**
