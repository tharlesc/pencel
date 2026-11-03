# 15. Navegador Espacial Escalonado de Pranchetas (Staggered Spatial Artboard Reel)

- **Status:** Aprovado
- **Data:** 2026-10-24
- **Autores:** Agente de Engenharia de Design e Arquitetura UI Pencel

---

## Contexto e Problema

Em editores gráficos modernos, a navegação entre múltiplas pranchetas (_artboards_) costuma ser delegada a gavetas planas com listas genéricas em grade ou barras horizontais inferiores que poluem o palco de desenho.
O usuário solicitou uma experiência de visualização inspirada em uma trilha espacial vertical escalonada (_staggered spatial reel_):

1. A **prancheta em visualização** atual deve ser o elemento focal mais proeminente, com projeção para a frente e alinhamento à esquerda em direção à prancheta do canvas.
2. As pranchetas **anteriores** e **posteriores** imediatas devem estar recuadas e escalonadas para a direita, permitindo identificação contextual imediata sem oclusão do espaço de trabalho.
3. Pranchetas mais distantes no documento devem ser suavemente diminuídas e esmaecidas.
4. Toda a navegação deve suportar navegação bidirecional por teclado (<kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Esc</kbd>) e auto-centralização contínua.

---

## Decisão Tomada

1. **Arquitetura de Estado e Componente:**
   - Criado o componente [`ArtboardThumbnailsDrawer.tsx`](file:///apps/web/src/features/editor/components/ArtboardThumbnailsDrawer.tsx) gerenciado de forma controlada através de `CanvasWorkspace`.
   - Adicionada a folha de estilos orientada a tokens [`ArtboardThumbnailsDrawer.module.css`](file:///apps/web/src/features/editor/components/ArtboardThumbnailsDrawer.module.css), em conformidade estrita com a regra de ausência total de literais `px` e literais hexadecimais brutos.

2. **Comportamento Espacial e Escalonamento Dinâmico:**
   - Para cada card renderizado na trilha, calcula-se o deslocamento relativo `diff = index - activePageIndex`:
     - `diff === 0` (**Em visualização**): `transform: translateX(0) scale(1)`, `opacity: 1`, anel de foco `var(--color-primary)` e badge ativo `● Em visualização`.
     - `diff === -1` (**Anterior**): `transform: translateX(calc(var(--space-lg) * 1.1)) scale(0.92)`, `opacity: 0.82`, badge `↑ Anterior`.
     - `diff === 1` (**Posterior**): `transform: translateX(calc(var(--space-lg) * 1.1)) scale(0.92)`, `opacity: 0.82`, badge `↓ Posterior`.
     - `|diff| > 1` (**Distantes**): `transform: translateX(calc(var(--space-xl) * 1.2)) scale(0.85)`, `opacity: 0.60`.

3. **Auto-Scroll e Acessibilidade:**
   - Ao alterar de prancheta ou ao abrir o navegador, o card ativo é centralizado suavemente na visão via `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
   - Suporte completo a atalhos de teclado: <kbd>ArrowUp</kbd> para prancheta anterior, <kbd>ArrowDown</kbd> para próxima prancheta, <kbd>Escape</kbd> para fechar.
   - Ações integradas de duplicação, exclusão e criação de nova prancheta.

---

## Consequências

- **Positivas:**
  - Identificação imediata da prancheta ativa sem necessidade de ler números pequenos.
  - Fluidez visual e profundidade espacial aderentes aos princípios do design Apple Pro Studio (deference to content, optical alignment, depth).
  - Componentes limpos e modulares, todos abaixo do limite de 300 linhas.
  - Zero dependências externas adicionadas.
- **Ressalvas:**
  - Em ambientes de teste de renderização sintética (JSDOM), chamadas a `scrollIntoView` devem ser protegidas por verificação de existência para evitar exceções.
