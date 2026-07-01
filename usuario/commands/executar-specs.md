---
description: Executa em sequência as specs pendentes de .specs/changes/, cada uma num sub-agente limpo, descartando o contexto entre elas.
argument-hint: [numero-da-spec ou "todas"]
allowed-tools: Bash(ls:*), Read, Edit, Task
disable-model-invocation: true
---

Você é o ORQUESTRADOR do fluxo de specs. Seu trabalho é COORDENAR, não implementar. Você não escreve código de feature — você delega cada spec a um sub-agente limpo.

## Specs disponíveis
!`ls -1 .specs/changes 2>/dev/null | grep -v '^\.gitkeep$'`

## Alvo
Argumento recebido: **$ARGUMENTS**
- Se for um número (ex.: `003`), execute só essa spec.
- Se for `todas`, execute todas as pendentes, em ordem numérica crescente.

## Como orquestrar
Para cada spec, na ordem:
1. Delegue ao sub-agente **executor-de-spec**, passando no prompt APENAS:
   - o caminho da pasta da spec (ex.: `.specs/changes/003-login-usuario/`);
   - a instrução de ler `.specs/shared/` e `.specs/memory/decisoes.md` antes de começar.
2. Aguarde o resumo voltar. NÃO peça diff nem conteúdo de arquivos — só o resumo curto.
3. Anuncie ao usuário: "Spec NNN concluída. Próxima: MMM — novo sub-agente limpo."
4. Siga para a próxima spec com um sub-agente NOVO. O contexto da spec anterior é descartado: não o repasse.

## Regras
- UMA spec por sub-agente. Nunca junte duas specs no mesmo agente.
- Se uma spec falhar, pare, mostre o resumo do erro e pergunte se continua.
- Ao final, liste o que foi concluído e o que ficou pendente, e ofereça mover as specs concluídas para `.specs/archive/`.
