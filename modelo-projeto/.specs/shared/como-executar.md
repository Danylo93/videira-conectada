# Como executar uma spec

Regras que todo sub-agente executor deve seguir.

## Princípios
1. **Uma spec por vez, em contexto limpo.** Cada spec roda num sub-agente próprio. O contexto da spec anterior é descartado — de propósito.
2. **Só o escopo da spec.** Nada de refactor fora do escopo, nada de antecipar specs futuras, nada de "melhorar de passagem" o que não foi pedido.
3. **Respeite as decisões.** Leia `../memory/decisoes.md` antes de começar. Não contrarie decisões registradas; se for necessário mudar uma, registre a nova decisão lá.
4. **Devolva resumo, não despejo.** O executor devolve um resumo curto (o que fez, arquivos tocados, pendências). Logs, diffs e conteúdo de arquivos ficam no contexto dele.

## Passo a passo
1. Ler este arquivo + `regras-de-nomenclatura.md`.
2. Ler o `spec.md` da spec (objetivo, escopo, fora-de-escopo, critérios de aceitação).
3. Ler `../memory/decisoes.md`.
4. Implementar apenas o escopo.
5. Validar contra os critérios de aceitação.
6. Marcar a spec como concluída no `spec.md` e registrar decisões novas em `../memory/decisoes.md`.
7. (Opcional, ao final do ciclo) mover a spec concluída para `../archive/`.

## Skills
Sub-agentes NÃO herdam as skills da sessão principal. Se a spec precisar de uma skill específica, o orquestrador deve citá-la no prompt e o executor deve invocá-la explicitamente.
