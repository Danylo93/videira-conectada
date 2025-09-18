# Videira Conectada

Sistema de Gestão de Células da Igreja Videira São Miguel - Uma aplicação moderna e robusta para gerenciar células, líderes, relatórios e eventos.

## 🚀 Características

- ⚡️ [Vite](https://vitejs.dev/) - Build tool e servidor de desenvolvimento ultra-rápido
- ⚛️ [React 18](https://react.dev/) - Biblioteca de interface moderna
- 🔷 [TypeScript](https://www.typescriptlang.org/) - Segurança de tipos
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first
- 🧩 [shadcn/ui](https://ui.shadcn.com/) - Componentes reutilizáveis baseados em Radix UI
- 🔐 [Supabase](https://supabase.com/) - Backend como serviço com autenticação
- 📊 [React Query](https://tanstack.com/query) - Gerenciamento de estado do servidor
- 📱 Design responsivo e acessível
- 🎯 Imports absolutos com prefixo `@/`
- 🔧 ESLint + Prettier para qualidade de código

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização
- Sistema de login seguro com Supabase Auth
- Controle de acesso baseado em roles (Pastor, Obreiro, Discipulador, Líder)
- Transições suaves entre estados de autenticação
- Proteção de rotas

### 📊 Dashboard Inteligente
- Visão geral personalizada por role
- Métricas em tempo real
- Gráficos interativos de crescimento
- Indicadores de performance

### 👥 Gestão de Pessoas
- Cadastro e gerenciamento de líderes
- Controle de discipuladores
- Gestão de membros de células
- Histórico de presenças

### 📋 Relatórios de Células
- Criação de relatórios semanais
- Aprovação e correção de relatórios
- Acompanhamento de fases das células
- Relatórios consolidados

### 🎓 Sistema de Cursos
- Inscrições em cursos
- Acompanhamento de progresso
- Gestão de pagamentos

### 📅 Eventos
- Criação e gestão de eventos
- Inscrições online
- Controle de capacidade

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Estado**: React Query, Context API
- **UI**: shadcn/ui, Radix UI, Lucide Icons
- **Gráficos**: Recharts
- **Build**: Vite
- **Linting**: ESLint, Prettier

## 🚀 Como Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/) ou [pnpm](https://pnpm.io/)

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd videira-conectada
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

5. Abra [http://localhost:8080](http://localhost:8080) no navegador.

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run build:dev` - Build para desenvolvimento
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige automaticamente problemas do ESLint
- `npm run type-check` - Verifica tipos TypeScript
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica formatação do código

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui
│   ├── auth/           # Componentes de autenticação
│   ├── layout/         # Componentes de layout
│   └── ...
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── lib/                # Funções utilitárias
├── pages/              # Componentes de página
├── types/              # Definições de tipos TypeScript
├── constants/          # Constantes da aplicação
├── config/             # Configurações
├── integrations/       # Integrações externas
└── ...
```

## 🎨 Design System

O sistema utiliza um design system baseado em:
- **Cores**: Paleta inspirada em uvas e vinho
- **Tipografia**: Inter como fonte principal
- **Componentes**: shadcn/ui com customizações
- **Animações**: Transições suaves e micro-interações
- **Acessibilidade**: WCAG 2.1 AA compliant

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

### Supabase

O projeto utiliza Supabase para:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Real-time subscriptions
- Storage de arquivos

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 📱 Dispositivos móveis (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Telas grandes (1440px+)

## ♿ Acessibilidade

- Navegação por teclado
- Leitores de tela
- Contraste adequado
- Skip links
- ARIA labels
- Foco visível

## 🚀 Performance

- Code splitting automático
- Lazy loading de componentes
- Otimização de imagens
- Cache inteligente
- Bundle otimizado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório.

---

Desenvolvido com ❤️ para a Igreja Videira São Miguel