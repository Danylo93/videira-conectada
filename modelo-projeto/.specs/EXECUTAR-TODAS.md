# Executar todas as specs

Ponto de entrada para rodar o projeto inteiro de uma vez.

No Claude Code, rode:

    /executar-specs todas

O orquestrador vai, para cada spec pendente em `changes/` (ordem numérica crescente):

1. Abrir um sub-agente **limpo** (`executor-de-spec`).
2. Passar só o caminho da spec.
3. Receber de volta um resumo curto.
4. Descartar o contexto e seguir para a próxima.

É isso que mantém a qualidade alta em projetos grandes: nenhuma spec carrega o "ruído" das anteriores.

## Ordem / dependências
<!-- Marque o que já foi concluído e fixe dependências, se houver -->

- [ ] 001-...
- [ ] 002-...
- [ ] 003-...
