# 20. Resolução de Sobreposições do HUD, Alinhamento Sub-pixel de Réguas/Guias e Fallback de Mídias

- **Status:** Aprovado
- **Data:** 2026-10-25
- **Contexto:** Correção de sobreposição do HUD superior (`ContextualToolbar`) em telas menores, eliminação da colisão da gaveta de pranchetas (`ArtboardThumbnailsDrawer`) com a régua horizontal, alinhamento sub-pixel das linhas guias com a régua, clique duplo confiável para exclusão de guias, restauração do clique em fotos na galeria (Lorem Picsum / Unsplash) e robustez do catálogo de figurinhas GIPHY com fallbacks vetoriais offline.

---

## 1. Contexto e Problemas Identificados

1. **Clique Bloqueado em Fotos da Galeria:** O elemento de sobreposição `.photoHoverOverlay` no `SidebarNav.module.css` recebia `pointer-events: auto;` ao passar o mouse, cobrindo o botão `<button className={styles.photoThumb}>` e absorvendo cliques sem acionar `onAddImage`.
2. **Sobreposição do HUD Superior (`ContextualToolbar`):** Em larguras compactas (especialmente com a gaveta de 380px aberta), o HUD contextual possuía `justify-content: space-between; overflow: visible;` sem contenção de flex-shrink, fazendo com que os grupos de controles (alinhamento, tipografia, opacidade e botões de ação) colidissem e se sobrepusessem. Além disso, cliques fora dos popovers no canvas Fabric.js eram suprimidos pelo stopPropagation do motor.
3. **Miniaturas das Pranchetas Cortadas pela Régua:** O `.drawerOverlay` iniciava com `top: calc(var(--control-height-xl) + var(--space-2))` (52px), colidindo diretamente com a barra horizontal da régua (que se estende de 44px a 68px), cortando a parte superior dos cartões.
4. **Endpoint e Fallback do GIPHY:** O endpoint no backend apontava para `/v1/gifs/search` em vez de figurinhas com fundo transparente (`/v1/stickers/search`), e quando a chave `GIPHY_API_KEY` estava ausente ou ocorria erro de rede, a interface exibia um estado vazio sem alternativas.
5. **Clique Duplo em Guias Inoperante:** No `CanvasGuidesOverlay`, o evento `onMouseDown` iniciava o estado de arrasto (`activeGuideDrag`) imediatamente, desmarcando e desmontando o elemento da guia estática no DOM. Com o nó desmontado entre o primeiro e o segundo clique, o navegador cancelava o disparo do evento nativo `dblclick`.
6. **Precisão da Régua e Guias:** O contêiner `.viewportScroll` continha padding assimétrico inferior (84px contra 32px no topo), fazendo com que o centro real do palco no DOM ficasse 26 pixels abaixo do cálculo puramente teórico `viewportHeight / 2`, desalinhando a marca de 0 px da régua com a borda da prancheta e com as linhas guias.

---

## 2. Decisões Técnicas e Implementação

### 2.1 Desbloqueio dos Cliques em Fotos da Galeria

- Em `SidebarNav.module.css`, `.photoThumbWrapper:hover .photoHoverOverlay` foi configurado com `pointer-events: none;`, e apenas os links de atribuição do fotógrafo mantêm `pointer-events: auto;`.
- Todos os cliques na miniatura atravessam a camada de gradiente e acionam diretamente o botão de inserção.

### 2.2 Reorganização do HUD Superior e Fechamento Confiável de Popovers

- Em `ContextualToolbar.module.css`, `.bar` adota `justify-content: flex-start; gap: var(--space-2); flex-shrink: 0; min-width: 0;`, e `.trailingGroup` utiliza `margin-left: auto; flex-shrink: 0;`, eliminando colisões de layout.
- O fechamento de popovers foi migrado para a fase de captura do DOM (`window.addEventListener('pointerdown', handlePointerDown, true)`), garantindo que cliques dentro da superfície do Fabric.js fechem popovers mesmo quando o canvas intercepta o evento.

### 2.3 Descolamento da Gaveta de Pranchetas em Relação à Régua

- Em `ArtboardThumbnailsDrawer.module.css`, o topo do `.drawerOverlay` foi redefinido para `top: calc(var(--control-height-xl) + 1.5rem + var(--space-2));` (76px) com `z-index: var(--z-modal);`, iniciando estritamente abaixo da régua de 24px e evitando qualquer sobreposição ou corte nos cartões.

### 2.4 GIPHY Stickers e Catálogo Offline Vetorial

- Em `apps/api/src/modules/media/media.service.ts`, os endpoints foram corrigidos para `https://api.giphy.com/v1/stickers/search` e `https://api.giphy.com/v1/stickers/trending`.
- Em `apps/web/src/features/editor/services/mediaProvider.ts`, foi implementado o catálogo offline `CURATED_FALLBACK_STICKERS` com 12 figurinhas vetoriais SVG de alta resolução com fundo transparente (estrelas, fogo, foguete, coração, troféu, festa, coroa, etc.), garantindo experiência imediata mesmo sem chave de API.

### 2.5 Detecção Confiável de Duplo Clique em Linhas Guias

- Em `CanvasGuidesOverlay.tsx`, foi implementada detecção temporal de clique duplo (`lastClickRef.current && e.timeStamp - lastClickRef.current.time < 350`) com `useCallback` puro sem chamadas impuras durante renderização. O duplo clique aciona imediatamente `onDeleteGuide(guide.id)`.

### 2.6 Precisão Sub-pixel da Régua e Alinhamento com a Prancheta

- Em `CanvasWorkspace.module.css`, o padding do `.viewportScroll` foi simetrizado para `var(--space-8)` em todos os 4 lados.
- Em `useCanvasGuides.ts`, `artboardOrigin` mede as coordenadas físicas reais via `getBoundingClientRect()` do `artboardRef` em relação ao `viewportRef`, compartilhando a mesma origem com `CanvasRulers.tsx`. O tick de 0 px coincide perfeitamente com a aresta da prancheta e com as coordenadas das linhas guias.

---

## 3. Conformidade e Validação de Qualidade

- **TypeScript:** `strict: true`, zero erros com `npm.cmd run typecheck`.
- **ESLint:** Regras do React 19 Compiler (`react-hooks/purity`) validadas sem avisos com `npm.cmd run lint`.
- **Prettier:** 100% formatado com `npm.cmd run format:check`.
- **Testes Automatizados:** 129 testes aprovados (14 na API, 93 na Web, 22 no editor-core).
- **Build de Produção:** Vite 8 compilou todos os pacotes com sucesso em 2.69s.
