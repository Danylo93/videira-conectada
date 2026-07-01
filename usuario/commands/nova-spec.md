---
description: Cria uma nova spec numerada em .specs/changes/ a partir do template, seguindo as regras de nomenclatura.
argument-hint: [descricao-curta]
allowed-tools: Bash(ls:*), Bash(mkdir:*), Read, Write, Edit
disable-model-invocation: true
---

Crie uma nova spec neste projeto.

## Contexto
Specs já existentes:
!`ls -1 .specs/changes 2>/dev/null | grep -v '^\.gitkeep$'`

Regras de nomenclatura do projeto:
@.specs/shared/regras-de-nomenclatura.md

Template da spec:
@.specs/templates/spec-template.md

## Tarefa
1. Descubra o próximo número sequencial de 3 dígitos olhando as specs acima (se não houver nenhuma, comece em 001).
2. Descrição curta pedida: **$ARGUMENTS** (se vazia, pergunte). Converta para kebab-case em português.
3. Crie a pasta `.specs/changes/NNN-descricao/` e, dentro dela, um `spec.md` baseado no template.
4. Preencha objetivo, escopo, fora-de-escopo e critérios de aceitação com base no que o usuário pediu. Faça perguntas se algo estiver ambíguo — uma spec mal definida estraga a execução depois.
5. Mostre o caminho criado e o conteúdo do `spec.md` para o usuário revisar.
