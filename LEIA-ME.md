# Fluxo de Specs para Claude Code

Um modelo reutilizável de **desenvolvimento orientado a specs**: cada projeto é quebrado em specs numeradas, e cada spec roda num **sub-agente limpo** — o contexto é descartado entre uma spec e outra, então a qualidade não cai em projetos grandes.

## O que tem aqui

```
fluxo-specs/
├── usuario/              → vai para ~/.claude/ (vale em TODOS os seus projetos)
│   ├── commands/         → /novo-projeto, /nova-spec, /executar-specs
│   └── agents/           → o sub-agente executor-de-spec
└── modelo-projeto/       → vai para ~/.claude/modelo-projeto/
    ├── CLAUDE.md         → modelo de contexto do projeto
    └── .specs/           → estrutura que o /novo-projeto copia em cada projeto
        ├── changes/      → specs ativas (001-..., 002-...)
        ├── archive/      → specs concluídas
        ├── memory/       → decisoes.md (memória de arquitetura)
        ├── shared/       → como-executar.md, regras-de-nomenclatura.md
        ├── templates/    → spec-template.md
        └── EXECUTAR-TODAS.md
```

## Instalação (uma vez só)

```bash
# 1) comandos e agente, no nível de usuário (valem em todo projeto)
cp -R usuario/commands ~/.claude/
cp -R usuario/agents   ~/.claude/

# 2) o modelo que o /novo-projeto copia para cada projeto novo
cp -R modelo-projeto ~/.claude/modelo-projeto
```

## Uso

```bash
cd meu-projeto-novo
claude
```

Dentro do Claude Code:

1. `/novo-projeto Nome Do Projeto` — cria o `.specs/` e o `CLAUDE.md` neste diretório.
2. `/nova-spec login de usuário` — cria `003-login-usuario/` (o número é automático).
3. `/executar-specs todas` — roda as specs pendentes, uma por sub-agente limpo.

## Bom saber

- **Harness x método:** o Claude Code é o harness. Isto aqui é um *método* (spec-driven) montado em cima dele, como convenção de arquivos + comandos.
- **Skills não são herdadas:** um sub-agente não recebe automaticamente as skills da sessão principal — declare/cite o que ele precisa.
- **Comandos "legados":** arquivos em `~/.claude/commands/` continuam funcionando; se quiser, dá pra migrar cada um para `~/.claude/skills/<nome>/SKILL.md` (mesma invocação `/nome`, mais a auto-invocação pelo Claude).
- **Para um time:** dá pra empacotar `commands` + `agents` + o modelo como um **plugin** e instalar de uma vez em todo mundo.
- **Custo:** fluxos com muitos sub-agentes gastam bem mais tokens que uma sessão única (cada sub-agente tem o próprio contexto). É o preço de manter o contexto limpo.
