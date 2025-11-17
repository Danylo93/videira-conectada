# Sistema de Encontros com Deus

## Visão Geral

O sistema de encontros foi reformulado para funcionar com eventos pré-definidos. Agora os encontros são criados como eventos com datas específicas, e depois os pastores/discipuladores podem gerenciar as inscrições.

## Como Funciona

### 1. Criação de Eventos de Encontro

1. Acesse a página de **Eventos de Encontro** (`/encounters/events`)
2. Clique em **"Novo Evento de Encontro"**
3. Preencha os dados:
   - **Nome do Evento**: Ex: "Encontro com Deus - Jovens"
   - **Tipo de Encontro**: Jovens ou Adultos
   - **Descrição**: Descrição do evento
   - **Datas do Encontro**: Selecione múltiplas datas (ex: 26, 27 e 28/09)
   - **Local**: Onde será realizado
   - **Capacidade Máxima**: (opcional)

### 2. Gerenciamento de Inscrições

1. Acesse a página de **Encontros** (`/encounters`)
2. Clique em **"Novo Encontro"**
3. Selecione o **Evento de Encontro** desejado
4. Preencha os dados do participante:
   - Nome, telefone, email
   - Líder, discipulador, pastor responsável
   - Valor pago, observações
   - Status de comparecimento

## Estrutura de Dados

### Tabela `encounter_events`
- Armazena os eventos de encontro
- Contém múltiplas datas para cada evento
- Vinculado ao tipo de encontro (jovens/adultos)

### Tabela `encounter_with_god`
- Armazena as inscrições dos participantes
- Agora possui campo `event_id` para vincular ao evento
- A data do encontro é definida pelo evento selecionado

## Migração Necessária

Para ativar a funcionalidade, execute a migração:

```sql
-- Arquivo: supabase/migrations/20250115000006_encounter_events_system.sql
```

## Funcionalidades

### Para Pastores e Discipuladores:
- ✅ Criar eventos de encontro com múltiplas datas
- ✅ Gerenciar inscrições para eventos específicos
- ✅ Visualizar estatísticas por evento
- ✅ Editar e excluir eventos

### Para Participantes:
- ✅ Inscrever-se em eventos específicos
- ✅ Não precisam escolher data (definida pelo evento)
- ✅ Dados organizados por evento

## Benefícios

1. **Organização**: Encontros agrupados por evento
2. **Flexibilidade**: Múltiplas datas por evento
3. **Controle**: Pastores definem as datas
4. **Rastreabilidade**: Histórico por evento
5. **Estatísticas**: Relatórios por evento

## Próximos Passos

1. Execute a migração do banco de dados
2. Descomente o código nas funções de carregamento
3. Teste a criação de eventos
4. Teste as inscrições
5. Verifique as estatísticas



