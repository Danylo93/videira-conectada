# Dashboard Público de Relatórios Semanais

Esta página permite que o pastor acompanhe o status dos relatórios semanais sem precisar fazer login.

## Como Acessar

Acesse a URL com o ID do pastor no caminho:

```
https://videirasaomiguel.vercel.app/dashboard-relatorios-semanais/UUID_DO_PASTOR
```

### Formato da URL

- **Modo Normal**: `/dashboard-relatorios-semanais/:pastorId`
- **Modo Kids**: `/dashboard-relatorios-semanais/:pastorId/kids`

### Exemplos

**Modo Normal:**
```
https://videirasaomiguel.vercel.app/dashboard-relatorios-semanais/123e4567-e89b-12d3-a456-426614174000
```

**Modo Kids:**
```
https://videirasaomiguel.vercel.app/dashboard-relatorios-semanais/123e4567-e89b-12d3-a456-426614174000/kids
```

### Vantagens da Nova URL

- ✅ URL mais limpa e amigável
- ✅ Mais fácil de compartilhar
- ✅ Melhor para SEO
- ✅ Sem parâmetros na query string

## Funcionalidades

### 1. Estatísticas Gerais
- Total de líderes
- Quantidade de relatórios preenchidos
- Quantidade de relatórios pendentes
- Taxa de preenchimento com barra de progresso

### 2. Gráficos

#### Gráfico de Pizza
- Mostra a distribuição entre preenchidos e pendentes
- Cores: Verde (preenchido) e Amarelo (pendente)
- Percentuais visuais

#### Gráfico de Barras
- Visualização individual de cada líder
- Mostra status (preenchido/pendente) por líder
- Facilita identificar quem ainda não preencheu

### 3. Lista Detalhada
- Lista completa de todos os líderes
- Status visual (ícone de check ou relógio)
- Informações de membros e frequentadores (quando preenchido)
- Badges coloridos para status

## Dados Exibidos

A página mostra dados da **semana atual** (segunda a domingo):
- Calcula automaticamente o início da semana (segunda-feira)
- Busca relatórios da semana inteira
- Atualiza em tempo real quando a página é recarregada

## Segurança

⚠️ **Importante**: Esta página é pública, mas requer o `pastor_id` correto para funcionar.

**Recomendações:**
- Compartilhe o link apenas com pessoas autorizadas
- Considere adicionar autenticação adicional se necessário
- O `pastor_id` pode ser obtido no Supabase Dashboard ou via API

## Como Obter o pastor_id

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** > **profiles**
3. Encontre o perfil do pastor
4. Copie o `id` (UUID)

### Opção 2: Via Código (se já estiver logado)
```javascript
const { user } = useAuth();
console.log(user.id); // Este é o pastor_id
```

## Personalização

A página pode ser personalizada editando:
- `src/pages/PublicWeeklyReportsDashboard.tsx`

### Cores dos Gráficos
As cores podem ser alteradas na constante `COLORS`:
```typescript
const COLORS = {
  preenchido: "#10b981", // Verde
  pendente: "#f59e0b",   // Amarelo
};
```

## Troubleshooting

### Erro: "Parâmetro pastor_id é obrigatório"
- Verifique se o `pastorId` está presente no caminho da URL
- Confirme que o UUID está correto
- A URL deve ser: `/dashboard-relatorios-semanais/UUID_DO_PASTOR`

### Erro: "Erro ao buscar status dos relatórios"
- Verifique se a Edge Function `weekly-reports-status` está deployada
- Confirme que as variáveis de ambiente estão configuradas
- Verifique os logs do Supabase

### Dados não aparecem
- Verifique se há líderes cadastrados para o pastor
- Confirme que o `is_kids` está correto (true/false)
- Verifique se a semana atual tem relatórios

### Página em branco
- Abra o console do navegador (F12) para ver erros
- Verifique se todas as dependências estão instaladas
- Confirme que a rota está configurada no `App.tsx`

## Atualização Automática

A página **não atualiza automaticamente**. Para ver dados atualizados:
- Recarregue a página (F5)
- Ou adicione um botão de atualização manual (pode ser implementado)

## Integração com WhatsApp

Esta página pode ser usada em conjunto com o sistema de envio de WhatsApp:
1. Pastor acessa o dashboard
2. Vê quem está pendente
3. Pode usar o botão "Enviar WhatsApp" na interface autenticada
4. Ou compartilhar o link do dashboard para acompanhamento

## Próximas Melhorias Possíveis

- [ ] Atualização automática a cada X segundos
- [ ] Filtro por semana específica
- [ ] Exportação de dados
- [ ] Histórico de semanas anteriores
- [ ] Notificações quando todos preencherem
- [ ] Autenticação opcional com token

