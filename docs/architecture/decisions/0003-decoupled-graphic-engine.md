# ADR 0003: Separação entre o Motor Gráfico (Fabric.js) e a Interface React

- **Status:** Aceito
- **Data:** 21 de outubro de 2026

## Contexto

Bibliotecas de canvas imperativas como `Fabric.js` mantêm estado mutável próprio sobre elementos DOM (`<canvas>`). Se os componentes React ou o modelo de documento dependerem diretamente das classes internas do `Fabric.js`, o código torna-se difícil de testar em Node.js, propenso a vazamentos de memória e impossível de migrar futuramente para WebGL/CanvasKit/PixiJS.

## Decisão

1. Manter o modelo de documento, elementos, comandos e serialização em `@pencel/editor-core` em TypeScript puro, sem qualquer dependência de `fabric` ou React.
2. Isolar toda a integração com `Fabric.js` exclusivamente na camada `apps/web/src/features/editor/engine/` por meio de um adaptador (`FabricCanvasAdapter`) com ciclo explícito de inicialização (`mount`) e limpeza (`dispose`).

## Consequências

- **Positivas:** `@pencel/editor-core` pode ser testado rapidamente em Node.js e compartilhado com a API; o motor de renderização pode ser substituído no futuro alterando apenas `features/editor/engine/`.
- **Negativas / Cuidados:** Exige funções tradutoras claras entre o `DesignDocument` e os objetos renderizados no canvas.
