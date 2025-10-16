# Sistema de Cursos Avançado - Videira Conectada

Este módulo implementa um sistema completo de gerenciamento de cursos para a Videira Conectada, com funcionalidades avançadas e controle de acesso baseado em papéis.

## 🚀 Funcionalidades Principais

### Para Pastores e Obreiros
- **Gestão Completa de Cursos**: Criar, editar, excluir e gerenciar cursos
- **Módulos e Aulas**: Organizar conteúdo em módulos e aulas estruturadas
- **Instrutores**: Designar e gerenciar instrutores para cada curso
- **Analytics Avançados**: Relatórios detalhados de progresso e performance
- **Controle de Presenças**: Sistema completo de chamada e controle de frequência
- **Gestão Financeira**: Controle de pagamentos e receitas
- **Certificados**: Emissão e gerenciamento de certificados

### Para Discipuladores
- **Acompanhamento de Rede**: Visualizar progresso dos líderes da sua rede
- **Controle de Presenças**: Marcar presenças e gerenciar frequência
- **Relatórios de Progresso**: Acompanhar evolução dos alunos
- **Dashboard Personalizado**: Visão geral da performance da rede

### Para Líderes
- **Inscrição de Membros**: Inscrever membros da célula nos cursos
- **Acompanhamento Individual**: Visualizar progresso de cada membro
- **Gestão de Pagamentos**: Registrar e acompanhar pagamentos
- **Relatórios da Célula**: Estatísticas de participação da célula

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- **courses**: Informações dos cursos
- **course_modules**: Módulos de cada curso
- **course_lessons**: Aulas de cada módulo
- **course_instructors**: Instrutores designados
- **course_registrations**: Inscrições dos alunos
- **course_attendance**: Controle de presenças
- **course_payments**: Pagamentos e receitas
- **course_assessments**: Avaliações e provas
- **course_grades**: Notas dos alunos
- **course_certificates**: Certificados emitidos

### Recursos Avançados
- **Row Level Security (RLS)**: Controle de acesso baseado em papéis
- **Índices Otimizados**: Performance otimizada para consultas
- **Validações Robustas**: Constraints e validações de dados
- **Auditoria Completa**: Rastreamento de todas as operações

## 🎯 Tipos de Cursos Suportados

### Categorias
- **Espiritual**: Desenvolvimento espiritual e crescimento cristão
- **Liderança**: Formação de líderes e discipulado
- **Ministério**: Treinamento para ministérios específicos
- **Bíblico**: Estudos bíblicos e teologia
- **Prático**: Aplicação prática da fé cristã

### Níveis de Dificuldade
- **Iniciante**: Para novos convertidos e iniciantes
- **Intermediário**: Para cristãos com experiência
- **Avançado**: Para líderes e ministros experientes

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Shadcn UI**: Componentes de interface
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **Lucide React**: Ícones

### Backend
- **Supabase**: Backend como serviço
- **PostgreSQL**: Banco de dados
- **Row Level Security**: Controle de acesso
- **Real-time**: Atualizações em tempo real

### Hooks Personalizados
- **useCourses**: Gerenciamento de cursos
- **Controle de Acesso**: Baseado no role do usuário
- **useCourseStats**: Estatísticas e analytics
- **useCourseDashboard**: Dados do dashboard

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── course.ts                 # Tipos TypeScript
├── integrations/supabase/
│   └── courses.ts               # Serviços de integração
├── hooks/
│   └── useCourses.ts            # Hooks personalizados
├── components/courses/
│   ├── CourseCard.tsx           # Card de curso
│   ├── CourseForm.tsx           # Formulário de curso
│   ├── CourseStats.tsx          # Estatísticas
│   └── StudentProgress.tsx      # Progresso dos alunos
├── pages/cursos/
│   ├── Courses.tsx              # Roteador principal
│   ├── CoursesAdmin.tsx         # Interface administrativa
│   ├── CoursesDiscipulador.tsx  # Interface do discipulador
│   ├── CoursesLeader.tsx        # Interface do líder
│   └── README.md               # Esta documentação
└── supabase/migrations/
    └── 20250115000002_enhanced_courses_system.sql
```

## 🚀 Como Usar

### 1. Configuração Inicial
```bash
# Aplicar migrações do banco
npx supabase db push --include-all

# Instalar dependências
npm install
```

### 2. Acesso por Papel
- **Pastor/Obreiro**: Acesso completo ao sistema
- **Discipulador**: Acompanhamento da rede
- **Líder**: Inscrição e acompanhamento de membros

### 3. Funcionalidades Principais

#### Criar Curso
1. Acesse a interface administrativa
2. Clique em "Novo Curso"
3. Preencha as informações básicas
4. Configure módulos e aulas
5. Designe instrutores

#### Inscrever Aluno
1. Acesse a interface do líder
2. Clique em "Inscrever Membro"
3. Selecione o membro e curso
4. Configure pagamento
5. Confirme a inscrição

#### Marcar Presença
1. Acesse a interface do discipulador
2. Selecione o curso e aula
3. Marque presenças dos alunos
4. Visualize relatórios de frequência

## 📈 Analytics e Relatórios

### Métricas Disponíveis
- **Taxa de Conclusão**: Percentual de alunos que completam o curso
- **Presença Média**: Frequência média dos alunos
- **Receita Total**: Valor arrecadado com os cursos
- **Satisfação**: Avaliação dos alunos (quando disponível)
- **Progresso Individual**: Acompanhamento detalhado de cada aluno

### Relatórios por Papel
- **Pastor**: Visão geral completa do sistema
- **Discipulador**: Performance da rede de líderes
- **Líder**: Progresso dos membros da célula

## 🔒 Segurança e Controle de Acesso

### Row Level Security (RLS)
- **Políticas de Acesso**: Cada papel tem acesso apenas aos dados permitidos
- **Validação de Dados**: Constraints no banco de dados
- **Auditoria**: Log de todas as operações

### Controle de Acesso por Papel
- **Pastor/Obreiro**: Acesso total ao sistema
- **Discipulador**: Acesso aos dados da sua rede
- **Líder**: Acesso aos dados da sua célula

## 🎨 Interface e UX

### Design System
- **Componentes Reutilizáveis**: Biblioteca de componentes consistente
- **Responsividade**: Interface adaptável a todos os dispositivos
- **Acessibilidade**: Seguindo padrões de acessibilidade
- **Performance**: Otimizado para carregamento rápido

### Experiência do Usuário
- **Navegação Intuitiva**: Interface clara e fácil de usar
- **Feedback Visual**: Confirmações e notificações claras
- **Loading States**: Indicadores de carregamento
- **Error Handling**: Tratamento de erros amigável

## 🔮 Funcionalidades Futuras

### Próximas Implementações
- **Sistema de Notificações**: Alertas e lembretes
- **Integração com Pagamentos**: Gateway de pagamento
- **Mobile App**: Aplicativo móvel nativo
- **IA e Machine Learning**: Recomendações personalizadas
- **Integração com Zoom**: Aulas online integradas
- **Sistema de Avaliações**: Feedback dos alunos
- **Gamificação**: Sistema de pontos e conquistas

### Melhorias Planejadas
- **Performance**: Otimizações de consultas
- **Caching**: Sistema de cache inteligente
- **Offline Support**: Funcionalidade offline
- **Multi-idioma**: Suporte a múltiplos idiomas

## 📞 Suporte e Contribuição

### Como Contribuir
1. Fork do repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um Pull Request

### Reportar Bugs
- Use o sistema de issues do GitHub
- Inclua logs e screenshots
- Descreva os passos para reproduzir

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a Videira Conectada**
