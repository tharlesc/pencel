# ADR 0002: Interface Construída com React, TypeScript e Vite

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

A interface de um editor gráfico possui alta interatividade de estado (barras de ferramentas contextuais, painéis de inspeção que reagem à seleção, gerenciamento de temas e atalhos de teclado), exigindo composição declarativa de componentes e segurança estática rigorosa para coordenadas, dimensões e propriedades de camadas.

## Decisão

Adotar **React 19** com **TypeScript** em modo estrito (`strict: true`, `noUncheckedIndexedAccess: true`) e **Vite** como servidor de desenvolvimento e empacotador.

## Consequências

- **Positivas:** Verificação em tempo de compilação de contratos entre UI e `@pencel/editor-core`, inicialização instantânea em ambiente de desenvolvimento e ecossistema maduro de testes (`Vitest` + `Testing Library`).
- **Negativas / Cuidados:** Requer disciplina para não re-renderizar o palco do canvas desnecessariamente a cada mudança de estado da interface.
