# ADR 0006: Separação entre Backend (`@pencel/api`) e Frontend (`@pencel/web`)

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

O editor gráfico precisa funcionar de forma ágil no navegador mesmo sem conectividade constante com servidor durante a edição local, enquanto o backend evoluirá posteriormente para gerenciar persistência de projetos, ativos de mídia e exportação assíncrona.

## Decisão

Construir a API como uma aplicação Node.js + Express + TypeScript independente (`apps/api`), desacoplada do ciclo de inicialização do frontend (`apps/web`), sem exigir banco de dados ativo ou credenciais externas para iniciar na etapa fundacional.

## Consequências

- **Positivas:** O frontend pode ser desenvolvido, testado e demonstrado autonomamente; a API possui ciclo próprio de deploy, testes (`Supertest`) e validação de ambiente.
- **Negativas / Cuidados:** Contratos de comunicação entre `web` e `api` devem ser sempre sincronizados via `@pencel/shared-types`.
