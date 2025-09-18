# Sistema de Eventos

Este módulo implementa o sistema de gerenciamento de eventos da Videira Conectada, com diferentes níveis de acesso baseados no papel do usuário.

## Funcionalidades

### Para Pastores e Obreiros
- **Criar eventos**: Criar novos eventos com todas as informações necessárias
- **Editar eventos**: Modificar informações de eventos existentes
- **Remover eventos**: Desativar eventos (soft delete)
- **Visualizar todos os eventos**: Acesso completo à lista de eventos
- **Gerenciar inscrições**: Ver e gerenciar todas as inscrições

### Para Discipuladores
- **Visualizar eventos**: Ver todos os eventos ativos
- **Inscrever-se**: Fazer inscrição em eventos disponíveis
- **Gerenciar inscrições**: Ver e cancelar suas próprias inscrições
- **Verificar capacidade**: Sistema verifica automaticamente se há vagas disponíveis

### Para Líderes
- **Visualizar eventos**: Apenas visualização dos eventos ativos
- **Sem inscrições**: Não podem se inscrever em eventos

## Estrutura de Arquivos

```
src/pages/eventos/
├── Events.tsx              # Roteador principal baseado no papel do usuário
├── EventsAdmin.tsx         # Interface para pastores e obreiros
├── EventsDiscipulador.tsx  # Interface para discipuladores
├── EventsLeader.tsx        # Interface para líderes (apenas visualização)
└── README.md              # Esta documentação

src/components/events/
├── EventCard.tsx          # Componente de card de evento reutilizável
├── EventForm.tsx          # Formulário de criação/edição de eventos
└── RegistrationForm.tsx   # Formulário de inscrição em eventos

src/hooks/
└── useEvents.ts           # Hook personalizado para gerenciar eventos

src/integrations/supabase/
└── events.ts              # Serviço de integração com Supabase

src/types/
└── event.ts               # Tipos TypeScript para eventos
```

## Tipos de Eventos

- **Conferência**: Eventos de grande porte com palestras
- **Retiro**: Eventos de imersão espiritual
- **Workshop**: Eventos práticos e educativos
- **Culto**: Eventos de adoração
- **Outro**: Outros tipos de eventos

## Campos do Evento

- **Nome**: Título do evento
- **Descrição**: Detalhes sobre o evento
- **Data**: Data e hora do evento
- **Local**: Local onde será realizado
- **Tipo**: Categoria do evento
- **Capacidade Máxima**: Limite de participantes (opcional)

## Segurança

O sistema implementa Row Level Security (RLS) no Supabase para garantir que:

1. **Pastores e Obreiros** têm acesso completo aos eventos e inscrições
2. **Discipuladores** podem ver eventos ativos e gerenciar suas próprias inscrições
3. **Líderes** têm apenas acesso de visualização aos eventos
4. **Inscrições** são controladas por função e usuário

## Estados dos Eventos

- **Próximo**: Evento futuro
- **Hoje**: Evento no dia atual
- **Finalizado**: Evento passado

## Validações

- Verificação de capacidade máxima antes da inscrição
- Prevenção de inscrições duplicadas
- Validação de dados obrigatórios
- Controle de acesso baseado em papel do usuário

## Uso

O sistema é acessado através da rota `/eventos` e automaticamente redireciona para a interface apropriada baseada no papel do usuário logado.
