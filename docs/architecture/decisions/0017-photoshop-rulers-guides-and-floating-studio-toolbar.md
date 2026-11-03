# ADR 0017: Sistema de Réguas e Linhas Guias Photoshop e Menu Flutuante Studio Glass

## Status

Aceito

## Contexto

O editor Pencel requeria aprimoramento na precisão espacial da prancheta e evolução na ergonomia de ferramentas de estúdio.

1. **Ferramental de precisão:** Como em aplicações profissionais como Adobe Photoshop e Figma, o usuário necessita de réguas milimetricamente adaptativas à escala de zoom com marcações principais/secundárias (major/medium/minor ticks), indicação em tempo real da posição do cursor e capacidade de puxar linhas guias (guias magnéticas) diretamente das réguas vertical e horizontal com suporte a snap magnético nos limites e centro da prancheta.
2. **HUD & Hierarquia Visual (Apple HIG & Design Taste):** Os botões de seleção de ferramentas (`select`, `directSelect`, `pen`, `brush`, `eraser`, `shapeBuilder`, etc.) anteriormente ocupavam a extremidade esquerda do rodapé (`CanvasBottomHud`). Conforme demonstração visual aprovada, o rodapé inferior deve reservar sua superfície para telemetria de documento (dimensões e contagem de elementos), controles de zoom/enquadramento e navegação de pranchetas, enquanto as ferramentas de desenho e criação ganham destaque em uma barra flutuante (`FloatingStudioToolbar`) centralizada imediatamente acima do HUD inferior, estruturada sob a camada de material de vidro translúcido (`Material Pencel Float System` / `.glass-float`).

## Decisão Técnica

### 1. Modelo de Domínio e Matemática Pura em `@pencel/editor-core`

- Criado o módulo [`packages/editor-core/src/math/rulerAndGuides.ts`](../../../../packages/editor-core/src/math/rulerAndGuides.ts) sem nenhuma dependência de React, DOM ou Fabric.js.
- Implementado cálculo dinâmico de passos (`getRulerStep`) e ticks (`calculateRulerTicks`) calibrados contra a escala contínua de zoom, garantindo densidade ótima de rótulos numéricos (`NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, ...]`).
- Implementada a função de atração magnética (`snapGuidePosition`) que analisa distâncias em coordenadas de documento relativas ao zoom e alinha instantaneamente às bordas (0, largura/altura), centro da prancheta e guias pré-existentes quando o limiar de proximidade (threshold em pixels de tela) for atingido.

### 2. Camada de Renderização e Interação (`apps/web`)

- **`CanvasRulers` (`apps/web/src/features/editor/components/Ruler/CanvasRulers.tsx`):**
  - Renderiza a caixa de junção de origem (`px`) clicável no vértice superior esquerdo (24px × 24px) para redefinir o ponto zero do palco.
  - Réguas horizontais e verticais vetorizadas em SVG de alta nitidez subpixel, com linhas de marcação e rótulos tipográficos tabulares (`font-variant-numeric: tabular-nums`).
  - Hairlines rastreadoras que acompanham o movimento do cursor do mouse em tempo real em ambos os eixos.
  - Evento de início de arraste (`onMouseDown`) nas réguas para instanciar novas guias diretamente na prancheta.
- **`CanvasGuidesOverlay` (`apps/web/src/features/editor/components/Ruler/CanvasGuidesOverlay.tsx`):**
  - Renderiza guias horizontais e verticais em cor de destaque ciano/azul com hit-targets confortáveis.
  - Permite reposicionamento por arraste, exclusão intuitiva ao arrastar a guia de volta para fora da prancheta/régua e exclusão por clique duplo.
  - Tooltip/badge flutuante em tempo real exibindo a coordenada atual e o alvo de atração magnética (ex.: `Y: 540 px • Centro da prancheta`).
- **`FloatingStudioToolbar` (`apps/web/src/features/editor/components/FloatingStudioToolbar.tsx`):**
  - Componente flutuante no estilo pílula com vidro fosco Apple (`glass-float`, `var(--material-float-bg)`, `var(--material-float-border)`, `var(--material-float-shadow)`).
  - Posicionamento absoluto imediatamente acima do rodapé (`calc(var(--control-height-lg) + var(--space-3))`).
  - Agrupa atalhos diretos: Seleção (V), Seleção Direta (A), Caneta Bézier (P), Pincel Livre (B), Borracha (E), Construtor de Formas (Shift+M), Forma Retângulo (R), Pranchetas/Recorte, Zoom, Ajustar palco, Alternar Réguas (Ctrl+R / ⌘R) e Excluir elemento.
- **Hook de Orquestração (`useCanvasGuides`):**
  - Desacoplou estado de viewport, réguas e arraste de guias para preservar o teto arquitetural de 300 linhas em `CanvasWorkspace.tsx`.

## Conformidade e Qualidade

- **Tokens de Design:** Estilização 100% tokenizada via CSS Modules (`packages/design-tokens`), com zero literais hexadecimais, zero `rgba()` soltos, zero literais `px` em CSS e total paridade entre tema claro e tema escuro.
- **Acessibilidade:** 100% dos botões possuem `aria-label`, `aria-pressed`, `title` e foco acessível (:focus-visible).
- **Atalhos Globais:** Suporte a `Ctrl+R` / `Cmd+R` para alternar réguas e `Ctrl+;` / `Cmd+;` para alternar linhas guias.
- **Suíte de Testes:** Todos os 117 testes automatizados passaram (`vitest run`).
