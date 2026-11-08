# ADR 0022 — Camera Raw Filter, Layer Grouping Extraction, Guide Layouts & Slices

## Status

Aprovado / Implementado

## Contexto

O usuário solicitou uma série de refinamentos de alta fidelidade baseados em suítes criativas avançadas de mercado (semelhante a outros no mercado) e no sistema Apple Pro Studio:

1. **Desagrupamento e Extração Individual de Camadas:** Na mecânica de camadas, elementos filhos dentro de um grupo (`FabricGroup`) não podiam ser selecionados ou extraídos isoladamente para a raiz do canvas mantendo suas coordenadas espaciais globais.
2. **Filtro Camera Raw:** Necessidade de um sistema de color grading e edição fotográfica avançada (Exposição, Contraste, Realces, Sombras, Temperatura, Tonalidade, Vibração, Saturação e Clareza) acessível tanto pelo HUD lateral esquerdo (ao selecionar imagem) quanto pela barra de ferramentas contextual.
3. **Novo Layout de Guia & Fatias pelas Guias:** Criação programática de layouts de guias (12 colunas web, carrosséis para Instagram de 3 e 5 telas, grid 3x3) e partição da prancheta em fatias retangulares exportáveis individualmente como PNG.
4. **Precisão de Réguas e Guias:** Alinhamento submétrico e pixel-a-pixel entre as linhas de guia e os marcadores da régua, além da resolução de evento de duplo clique para exclusão rápida de guias.
5. **Ergonomia Visual (Design Taste):** Aumento de 2x no tamanho do HUD flutuante do canvas (botões de 48px com cantos suaves e ícones `md`), expansão da largura do campo de título do arquivo e templates modernos inspirados no Open Design.

## Decisões Técnicas

### 1. Transformação de Espaço de Coordenadas no Agrupamento Fabric 7

No Fabric.js v7, objetos inseridos em um `FabricGroup` possuem coordenadas relativas ao centro ou topo-esquerda do grupo pai. Para extrair um elemento isoladamente:

- A função `findCanvasObjectAndGroup` busca recursivamente objetos em primeiro nível e dentro de `FabricGroup`.
- A extração é realizada via `util.sendObjectToPlane(child, parentGroup.calcTransformMatrix(), undefined)`, que decompõe a matriz afim e recalcula `left`, `top`, `angle`, `scaleX` e `scaleY` no plano absoluto da prancheta.
- O elemento é removido do grupo e adicionado à raiz do canvas (`fabricCanvas.add(child)`).
- Grupos que ficam vazios ou contendo apenas a âncora de suporte são automaticamente limpos da prancheta.

### 2. Motor de Processamento Fotográfico Camera Raw

Criado o subsistema `cameraRawEngine.ts` com filtros acelerados por WebGL:

- **Exposição & Contraste:** Mapeamento linear para `fabric.filters.Brightness` e `fabric.filters.Contrast`.
- **Temperatura & Tint:** Matriz 4x5 em `fabric.filters.ColorMatrix` aplicando multiplicação diferencial nos canais R, G e B.
- **Realces & Sombras:** Ajuste de curvas tonais via `fabric.filters.Gamma`.
- **Vibração & Saturação:** Saturação inteligente e global via `fabric.filters.Vibrance` e `fabric.filters.Saturation`.
- O modal `CameraRawModal.tsx` provê interface com preview ao vivo e aplicação não destrutiva.

### 3. Layout de Guias e Fatiamento Retangular (Slices)

Criado o subsistema `guideLayoutEngine.ts`:

- Função `generateGuideLayout` calcula colunas e linhas levando em consideração margens e gutters ópticos.
- Função `computeSlicesFromGuides` divide o plano da prancheta pelas interseções de guias cartesianas em retângulos de fatia (`CanvasSlice`).
- Função `exportGuideSlices` realiza o recorte e download de cada fatia individual em PNG para carrosséis sociais e web.

### 4. Limites Arquiteturais Rígidos

- Todos os módulos do motor gráfico em `apps/web/src/features/editor/engine/*` permanecem estritamente `<= 500` linhas.
- Componentes React `.tsx` permanecem `<= 300` linhas.
- Zero literais hexadecimais ou `rgba()` dispersos nos módulos CSS; todos os valores derivam de tokens centralizados.

## Consequências

- A manipulação de grupos e elementos aninhados agora espelha fielmente o comportamento profissional de ferramentas gráficas avançadas (semelhante a outros no mercado).
- Usuários podem graduar imagens fotográficas com o Filtro Camera Raw diretamente no navegador.
- Designers podem gerar carrosséis contínuos para Instagram de 3 ou 5 slides com divisão perfeita e exportação automática de fatias.
