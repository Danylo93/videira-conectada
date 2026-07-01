# Regras de nomenclatura

## Pastas de spec
Formato: `NNN-descricao-em-kebab-case`

- `NNN` = número sequencial de 3 dígitos (001, 002, 003...).
- Descrição curta, em kebab-case, em português, começando por verbo quando fizer sentido.
- Para specs que derivam de outra ou rodam em paralelo, use sufixo de letra: `011a-...`, `011b-...`, `012a-...`.

Exemplos: `003-login-usuario`, `007-cadastro-ideia`, `012a-dashboard-backend`, `012b-dashboard-frontend`.

## Arquivos dentro da pasta da spec
- `spec.md` — a especificação (obrigatório).
- `notas.md` — rascunhos e decisões locais (opcional).

## Status de uma spec
- `changes/` — pendente ou em andamento.
- `archive/` — concluída e arquivada.

## Commits (se usar git)
`spec(NNN): descrição curta do que foi feito`
