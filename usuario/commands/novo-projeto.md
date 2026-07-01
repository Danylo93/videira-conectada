---
description: Inicializa o fluxo de specs (.specs/ + CLAUDE.md) num projeto novo, copiando do modelo em ~/.claude/modelo-projeto.
argument-hint: [nome-do-projeto]
allowed-tools: Bash(cp:*), Bash(mkdir:*), Bash(ls:*), Read, Write, Edit
disable-model-invocation: true
---

Você vai inicializar o fluxo de specs NESTE diretório. Não comece a programar nada.

## Passo 1 — copiar o modelo
!`cp -R ~/.claude/modelo-projeto/.specs ./ 2>/dev/null; cp -n ~/.claude/modelo-projeto/CLAUDE.md ./CLAUDE.md 2>/dev/null; echo "---"; ls -la; echo "---"; ls -la .specs`

## Passo 2 — personalizar
- Nome do projeto: **$ARGUMENTS** (se vazio, pergunte ao usuário antes de continuar).
- Edite o `CLAUDE.md` recém-criado preenchendo: nome do projeto, stack/linguagem e objetivo em uma frase. Pergunte o que não souber.
- NÃO crie nenhuma spec ainda.

## Passo 3 — fechar
Confirme em poucas linhas a estrutura criada e explique que o próximo passo é criar a primeira spec com `/nova-spec <descrição curta>`.
