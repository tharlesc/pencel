# ADR 0004: Compartilhamento de Design Tokens via CSS Custom Properties e CSS Modules

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

O design system inspirado nas diretrizes da Apple requer controle fino de superfícies translúcidas, tipografia tabular, espaçamento em grade de 4px e alternância instantânea entre tema claro e tema escuro sem custo de runtime JavaScript.

## Decisão

Centralizar todos os tokens no pacote `@pencel/design-tokens` utilizando **CSS Custom Properties** (`tokens.css`, `theme-light.css`, `theme-dark.css`) e estilizar os componentes do frontend exclusivamente com **CSS Modules** (`*.module.css`).

## Consequências

- **Positivas:** Zero overhead de runtime JS para troca de tema (`data-theme="light|dark"`), escopo local automático de classes CSS e proibição de valores mágicos espalhados pelos componentes.
- **Negativas / Cuidados:** Não devem ser introduzidas bibliotecas paralelas de estilização (como Tailwind ou styled-components).
