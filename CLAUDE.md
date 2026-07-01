# Videira São Miguel

> Stack: React (TS), Vite, TypeScript, TailwindCSS
> Objetivo: Sistema de gestão e acompanhamento de células da igreja Videira São Miguel.

## Fluxo de trabalho deste projeto
Este projeto usa **desenvolvimento orientado a specs**. Todo trabalho é quebrado em specs numeradas dentro de `.specs/changes/`.

- Cada spec é executada de forma isolada por um sub-agente limpo. Detalhes em `.specs/shared/como-executar.md`.
- Não implemente nada fora do escopo da spec atual.
- Decisões de arquitetura/produto ficam em `.specs/memory/decisoes.md` e devem ser respeitadas.
- Convenções de nomes em `.specs/shared/regras-de-nomenclatura.md`.

## Comandos
- `/nova-spec <descrição>` — cria a próxima spec numerada.
- `/executar-specs <nº|todas>` — executa specs pendentes, uma por sub-agente limpo.

## Convenções de código
- React (TS), Vite, TypeScript, TailwindCSS. Arquivo principal em `src/index.tsx`.
- Comentários e nomes de parâmetros em português.
