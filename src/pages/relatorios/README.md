# Sistema de Relatórios Avançado

## Visão Geral

O Sistema de Relatórios Avançado é uma solução completa para gerenciamento de relatórios, cultos e acompanhamento de membros perdidos na igreja. O sistema conecta desde o líder até o pastor, garantindo que nenhuma informação seja perdida.

## Funcionalidades Principais

### 🎯 **Relatórios Hierárquicos**
- **Líderes**: Criam relatórios de suas células
- **Discipuladores**: Monitoram relatórios de sua rede de líderes
- **Pastores/Obreiros**: Visualizam todos os relatórios e aprovam submissões

### 📊 **Gestão de Cultos**
- Separação por tipo: Adultos, Jovens, Crianças, Especial
- Controle de presenças e visitantes
- Registro de conversões e ofertas
- Relatórios detalhados por culto

### 👥 **Lista de Membros Perdidos**
- Cadastro de membros que pararam de frequentar
- Sistema de prioridades (Baixa, Média, Alta, Urgente)
- Acompanhamento de tentativas de contato
- Histórico de comunicação

### 📈 **Dashboard Inteligente**
- KPIs em tempo real
- Gráficos de tendências
- Alertas e notificações
- Relatórios consolidados

## Estrutura de Arquivos

```
src/pages/relatorios/
├── Reports.tsx                 # Roteador principal por papel
├── ReportsAdmin.tsx           # Interface para Pastores/Obreiros
├── ReportsDiscipulador.tsx    # Interface para Discipuladores
├── ReportsLeader.tsx          # Interface para Líderes
└── README.md                  # Esta documentação

src/components/reports/
├── ReportForm.tsx             # Formulário de relatórios
├── CultoForm.tsx              # Formulário de cultos
└── LostMemberForm.tsx         # Formulário de membros perdidos

src/hooks/
└── useReports.ts              # Hooks personalizados para relatórios

src/integrations/supabase/
└── reports.ts                 # Serviços de integração com Supabase

src/types/
└── reports.ts                 # Definições de tipos TypeScript
```

## Banco de Dados

### Tabelas Principais

#### **cultos**
- Armazena informações dos cultos
- Tipos: adultos, jovens, crianças, especial
- Controle de presenças e ofertas

#### **culto_attendance**
- Registra presenças em cultos
- Diferencia membros e visitantes
- Controle de conversões

#### **lost_members**
- Lista de membros que pararam de frequentar
- Sistema de prioridades e status
- Acompanhamento de tentativas de contato

#### **contact_attempts**
- Histórico de tentativas de contato
- Métodos: telefone, WhatsApp, email, visita
- Registro de respostas e próximos passos

#### **reports**
- Relatórios hierárquicos
- Tipos: célula, culto, mensal, trimestral, anual
- Sistema de aprovação

#### **report_templates**
- Templates personalizáveis para relatórios
- Diferentes formatos por tipo de relatório

#### **report_submissions**
- Controle de submissões e aprovações
- Feedback e revisões

## Funcionalidades por Papel

### 👑 **Pastor/Obreiro**
- **Dashboard completo** com todos os KPIs
- **Aprovação de relatórios** de toda a igreja
- **Gestão de cultos** e presenças
- **Monitoramento de membros perdidos**
- **Relatórios consolidados** por período
- **Templates personalizados** para relatórios

### 👨‍💼 **Discipulador**
- **Visão da rede** de líderes sob sua responsabilidade
- **Acompanhamento de relatórios** dos líderes
- **Monitoramento de membros perdidos** da rede
- **Relatórios de performance** da rede
- **Alertas e notificações** sobre a rede

### 👨‍👩‍👧‍👦 **Líder**
- **Relatórios da célula** com dados detalhados
- **Registro de presenças** em cultos
- **Cadastro de membros perdidos** da célula
- **Ações rápidas** para gestão da célula
- **Histórico de atividades** da célula

## Tipos de Relatórios

### 📋 **Relatório de Célula**
- Total de reuniões realizadas
- Presenças e visitantes
- Conversões e batismos
- Desafios e vitórias
- Pedidos de oração
- Próximos objetivos

### ⛪ **Relatório de Culto**
- Nome e tipo do culto
- Data e horário
- Total de presenças
- Visitantes e conversões
- Ofertas coletadas
- Observações especiais

### 📅 **Relatórios Periódicos**
- **Mensal**: Consolidação mensal de atividades
- **Trimestral**: Análise trimestral de crescimento
- **Anual**: Relatório anual completo
- **Personalizado**: Período definido pelo usuário

## Sistema de Aprovação

### 🔄 **Fluxo de Aprovação**
1. **Líder** cria e submete relatório
2. **Discipulador** revisa e aprova/rejeita
3. **Pastor** recebe relatórios aprovados
4. **Feedback** é enviado em caso de rejeição

### 📊 **Status dos Relatórios**
- **Rascunho**: Em edição
- **Enviado**: Aguardando aprovação
- **Aprovado**: Aprovado pelo supervisor
- **Rejeitado**: Rejeitado, precisa de revisão

## Sistema de Membros Perdidos

### 🚨 **Prioridades**
- **Urgente**: Membro em risco, precisa de atenção imediata
- **Alta**: Membro importante, acompanhamento prioritário
- **Média**: Acompanhamento regular
- **Baixa**: Acompanhamento esporádico

### 📞 **Métodos de Contato**
- **Telefone**: Ligação direta
- **WhatsApp**: Mensagem via WhatsApp
- **Email**: Envio de email
- **Visita**: Visita presencial
- **Carta**: Envio de carta
- **Outros**: Outros métodos

### 📈 **Status de Acompanhamento**
- **Perdido**: Membro não frequenta mais
- **Contatado**: Já foi contatado
- **Retornou**: Voltou a frequentar
- **Transferido**: Foi transferido para outra igreja

## KPIs e Métricas

### 📊 **Métricas de Cultos**
- Total de cultos realizados
- Presença média por culto
- Taxa de conversão
- Total de ofertas
- Crescimento mensal

### 👥 **Métricas de Membros**
- Total de membros ativos
- Membros perdidos
- Taxa de retorno
- Tentativas de contato
- Efetividade do acompanhamento

### 📈 **Métricas de Relatórios**
- Relatórios entregues no prazo
- Taxa de aprovação
- Tempo médio de aprovação
- Qualidade dos relatórios

## Tecnologias Utilizadas

- **React 18** com TypeScript
- **Supabase** para banco de dados
- **React Hook Form** para formulários
- **Zod** para validação
- **Shadcn UI** para componentes
- **Recharts** para gráficos
- **Date-fns** para manipulação de datas

## Segurança e Permissões

### 🔐 **Row Level Security (RLS)**
- Políticas de acesso baseadas em papel
- Dados isolados por hierarquia
- Controle granular de permissões

### 👤 **Controle de Acesso**
- **Pastores**: Acesso total ao sistema
- **Obreiros**: Acesso administrativo
- **Discipuladores**: Acesso à rede
- **Líderes**: Acesso à célula

## Instalação e Configuração

### 1. **Migração do Banco**
```bash
npx supabase db push --include-all
```

### 2. **Configuração de Variáveis**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Instalação de Dependências**
```bash
npm install
# ou
yarn install
```

## Uso do Sistema

### 🚀 **Para Líderes**
1. Acesse a seção "Relatórios"
2. Clique em "Novo Relatório"
3. Preencha os dados da célula
4. Submeta para aprovação

### 👨‍💼 **Para Discipuladores**
1. Acesse a seção "Relatórios"
2. Visualize relatórios da rede
3. Aprove ou rejeite relatórios
4. Monitore membros perdidos

### 👑 **Para Pastores**
1. Acesse o dashboard principal
2. Visualize todos os KPIs
3. Aprove relatórios finais
4. Configure templates

## Manutenção e Suporte

### 🔧 **Manutenção Regular**
- Backup semanal do banco de dados
- Limpeza de dados antigos
- Atualização de templates
- Revisão de permissões

### 📞 **Suporte Técnico**
- Documentação completa
- Logs detalhados
- Monitoramento de erros
- Suporte via chat

## Roadmap Futuro

### 🚀 **Próximas Funcionalidades**
- **Notificações push** para alertas
- **Relatórios automáticos** por email
- **Integração com WhatsApp** para contatos
- **App mobile** para líderes
- **IA para análise** de tendências
- **Gamificação** para engajamento

### 📊 **Melhorias Planejadas**
- **Dashboard mais interativo**
- **Relatórios em PDF**
- **Exportação para Excel**
- **Integração com calendário**
- **Sistema de metas**

## Conclusão

O Sistema de Relatórios Avançado oferece uma solução completa e integrada para o gerenciamento de relatórios na igreja, conectando todos os níveis hierárquicos e garantindo que nenhuma informação seja perdida. Com interface intuitiva, funcionalidades robustas e segurança avançada, o sistema está preparado para atender às necessidades de igrejas de todos os tamanhos.

---

**Desenvolvido com ❤️ para a Videira Conectada**
