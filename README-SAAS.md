# Videira Conectada - SaaS Multi-Tenant

Sistema de gestão de células e relatórios da igreja transformado em SaaS multi-tenant com Next.js, Supabase e Stripe.

## 🚀 Funcionalidades

### Multi-Tenancy
- **Subdomínios**: Cada igreja acessa via `{tenant}.meudominio.com`
- **Isolamento de dados**: RLS (Row Level Security) no Supabase
- **Resolução automática**: Middleware resolve tenant por subdomínio

### Billing & Pagamentos
- **Assinaturas recorrentes**: Cartão de crédito via Stripe
- **Pagamento único**: Pix com 30 dias de acesso
- **Planos**: Starter (R$ 29), Standard (R$ 49), Pro (R$ 99)
- **Webhooks**: Processamento automático de pagamentos

### Autenticação & Autorização
- **Supabase Auth**: Login/cadastro com email
- **RLS Policies**: Isolamento automático por tenant
- **Roles**: Owner, Admin, Member por tenant

## 🛠 Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Pagamentos**: Stripe (Checkout + Webhooks)
- **UI**: shadcn/ui + Radix UI
- **Deploy**: Vercel (recomendado)

## 📋 Pré-requisitos

1. **Node.js** 18+ e npm/yarn
2. **Conta Supabase** com projeto criado
3. **Conta Stripe** com produtos e preços configurados
4. **Domínio** configurado para subdomínios wildcard

## ⚙️ Configuração

### 1. Clone e Instale Dependências

```bash
git clone <repo>
cd videira-conectada
npm install
```

### 2. Configure Variáveis de Ambiente

Copie `env.example` para `.env.local`:

```bash
cp env.example .env.local
```

Preencha as variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Domain
BASE_DOMAIN=meudominio.com
```

### 3. Configure Supabase

Execute as migrations:

```bash
npx supabase db push
```

As migrations incluem:
- Tabelas de tenancy (`tenants`, `profile_tenants`)
- Tabelas de billing (`tenant_billing`, `tenant_invoices`, `audit_payments`)
- RLS policies para isolamento
- Triggers e funções auxiliares

### 4. Configure Stripe

1. **Crie produtos e preços** no Stripe Dashboard:
   - Starter: R$ 29/mês
   - Standard: R$ 49/mês  
   - Pro: R$ 99/mês

2. **Configure webhook** em `https://seu-dominio.com/api/billing/webhook`:
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `payment_intent.succeeded`

3. **Copie os Price IDs** para as variáveis de ambiente

### 5. Configure Domínio

Para subdomínios wildcard, configure DNS:
```
*.meudominio.com -> CNAME -> seu-app.vercel.app
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório** no Vercel
2. **Configure variáveis de ambiente** no dashboard
3. **Configure domínio customizado** com wildcard
4. **Deploy automático** a cada push

### Outros Provedores

O sistema funciona em qualquer provedor que suporte:
- Next.js 14
- Variáveis de ambiente
- Domínios customizados

## 📱 Fluxo de Uso

### 1. Cadastro de Igreja
1. Usuário acessa `meudominio.com`
2. Cria conta e configura igreja
3. Escolhe subdomínio (ex: `videira-central.meudominio.com`)

### 2. Configuração de Billing
1. Acessa página de billing
2. Escolhe plano (Starter/Standard/Pro)
3. Paga com cartão (recorrente) ou Pix (30 dias)

### 3. Uso do Sistema
1. Acessa via subdomínio
2. Gerencia membros, células, eventos
3. Visualiza relatórios e estatísticas

## 🔒 Segurança

### RLS (Row Level Security)
- **Isolamento automático**: Usuários só veem dados do seu tenant
- **Políticas granulares**: Por tabela e operação
- **Validação server-side**: Nunca confiar em dados do cliente

### Autenticação
- **Supabase Auth**: JWT tokens seguros
- **Middleware**: Validação em todas as rotas
- **Service Role**: Apenas para webhooks e operações admin

## 💳 Billing

### Assinaturas (Cartão)
- **Checkout Session**: Stripe Checkout para pagamento
- **Renovação automática**: Cobrança mensal
- **Portal do cliente**: Gerenciamento de assinatura

### Pagamento Pix
- **Pagamento único**: 30 dias de acesso
- **Renovação manual**: Novo checkout necessário
- **QR Code**: Gerado automaticamente pelo Stripe

### Webhooks
- **Processamento automático**: Ativação/desativação de planos
- **Auditoria**: Log de todos os eventos
- **Retry logic**: Stripe retry automático

## 🧪 Testes

### Teste Local
```bash
npm run dev
```

### Teste de Billing
1. Use cartões de teste do Stripe
2. Configure webhook local com ngrok
3. Teste fluxo completo de pagamento

### Teste Multi-Tenant
1. Crie múltiplas igrejas
2. Verifique isolamento de dados
3. Teste acesso via subdomínios

## 📊 Monitoramento

### Logs
- **Audit Payments**: Todos os eventos de billing
- **Console Logs**: Erros e debug
- **Stripe Dashboard**: Transações e webhooks

### Métricas
- **Tenants ativos**: Via Supabase
- **Receita**: Via Stripe Dashboard
- **Performance**: Via Vercel Analytics

## 🔧 Manutenção

### Backup
- **Supabase**: Backup automático
- **Stripe**: Dados financeiros seguros
- **Código**: Git repository

### Updates
- **Dependências**: `npm update`
- **Migrations**: `npx supabase db push`
- **Deploy**: Push para main branch

## 🆘 Troubleshooting

### Problemas Comuns

1. **Subdomínio não resolve**
   - Verifique DNS wildcard
   - Confirme configuração no Vercel

2. **Webhook não funciona**
   - Verifique URL e secret
   - Confirme eventos configurados

3. **RLS bloqueia acesso**
   - Verifique policies no Supabase
   - Confirme membership em `profile_tenants`

4. **Billing não ativa**
   - Verifique webhook logs
   - Confirme processamento no Stripe

### Suporte
- **Documentação**: Este README
- **Issues**: GitHub Issues
- **Comunidade**: Discord/Slack

## 📈 Próximos Passos

### Funcionalidades Futuras
- [ ] Portal do cliente Stripe
- [ ] Notificações por email
- [ ] Relatórios de billing
- [ ] API para integrações
- [ ] App mobile

### Melhorias Técnicas
- [ ] Cache Redis
- [ ] CDN para assets
- [ ] Monitoring avançado
- [ ] Testes automatizados
- [ ] CI/CD pipeline

---

**Desenvolvido com ❤️ para igrejas conectadas**
