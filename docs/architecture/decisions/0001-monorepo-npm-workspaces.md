# ADR 0001: Adoção de Monorepositório com npm Workspaces

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

O editor gráfico web compreende múltiplos domínios que evoluem juntos: aplicação frontend (`web`), servidor backend (`api`), tokens do design system (`design-tokens`), núcleo de domínio do editor (`editor-core`) e contratos de tipos (`shared-types`). Manter repositórios separados introduziria atrito de sincronização de versões, enquanto colocar tudo em um único pacote monolítico impediria fronteiras arquiteturais claras.

## Decisão

Utilizar uma estrutura de monorepositório gerenciada nativamente por **npm Workspaces** (`apps/*` e `packages/*`), sem adicionar orquestradores externos pesados (como Nx ou Turborepo) nesta fase inicial.

## Consequências

- **Positivas:** Instalação única (`npm.cmd install`), compartilhamento imediato de pacotes locais (`@pencel/*`), scripts centralizados na raiz e zero dependências extras de infraestrutura.
- **Negativas / Cuidados:** A ordem de compilação/verificação entre pacotes deve ser explícita nos scripts da raiz (`npm run build`, `npm run typecheck`).
