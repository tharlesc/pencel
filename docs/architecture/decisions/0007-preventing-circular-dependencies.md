# ADR 0007: Prevenção de Dependências Circulares entre Pacotes e Módulos

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

Em editores gráficos complexos, é comum surgir acoplamento bidirecional entre tipos de elementos, comandos de edição, estado da UI e componentes visuais, o que quebra a compilação incremental do TypeScript e degrada a arquitetura.

## Decisão

Estabelecer um grafo acíclico dirigido (DAG) estrito:

1. `@pencel/shared-types` (folha base, sem dependências internas).
2. `@pencel/editor-core` (depende apenas de `@pencel/shared-types`).
3. `@pencel/design-tokens` (folha puramente CSS).
4. `@pencel/web` e `@pencel/api` (consumidores finais no topo do grafo).
   Dentro de `apps/web/src/`, componentes em `components/ui/` nunca podem importar de `features/`.

## Consequências

- **Positivas:** Ordem de build determinística, pacotes testáveis isoladamente e ausência de ciclos de importação.
- **Negativas / Cuidados:** Qualquer tipo necessário tanto em `editor-core` quanto em `api` deve ser promovido para `shared-types` ou exportado de `editor-core`.
