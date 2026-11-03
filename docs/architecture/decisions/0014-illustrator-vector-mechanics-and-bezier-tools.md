# ADR 0014: Mecânicas Vetoriais do Adobe Illustrator: Caneta Bézier, Seleção Direta e Painel de Aparência

- **Status:** Aprovado
- **Data:** 2026-10-24
- **Contexto:** Clonagem e integração das mecânicas vetoriais centrais inspiradas no Adobe Illustrator (Caneta Bézier `P`, Seleção Direta de âncoras `A`, Construtor de Formas `Shift+M` e Painel de Aparência Vetorial), adaptadas visualmente ao padrão Apple Pro Studio do Pencel.

---

## 1. Contexto e Problema

1. **Ausência de ferramentas de desenho vetorial com controle de nós:** A aplicação permitia inserir apenas primitivas fixas (retângulos, círculos, triângulos e texto) e traçados livres (`PencilBrush`), sem capacidade de traçar curvas de Bézier cúbicas interativas com pontos de âncora e alças tangentes.
2. **Impossibilidade de edição sub-elemento:** O usuário não conseguia editar nós e vértices de formas vetoriais existentes (equivalente à ferramenta Seleção Direta / `Direct Selection Tool` do Illustrator).
3. **Limitação de traçado (Stroke) em formas:** Formas vetoriais suportavam apenas cor sólida contínua sem controle de estilo tracejado/pontilhado, arremates de extremidade (`lineCap`) ou junções de vértices (`lineJoin`).
4. **Governança de limites de linhas (AGENTS.md):** `FabricCanvasAdapter.ts` e componentes React estavam próximos dos limites estritos (500 linhas para arquivos de engine, 300 linhas para componentes `.tsx`), exigindo decomposição em facades e sub-módulos coesos.

---

## 2. Decisões Arquiteturais

### 2.1. Módulo Especializado de Caneta e Âncoras (`penToolEngine.ts`)

- Criação de `apps/web/src/features/editor/engine/penToolEngine.ts` (499 linhas) desacoplado do ciclo de vida React:
  - **Caneta Bézier (`P`):**
    - Clique para criar nós angulares/lineares (`L`).
    - Clique e arraste para projetar alças tangentes simétricas (`C cp1 cp2 target`).
    - Linha elástica (_rubber-band_) em tempo real do último ponto até o cursor.
    - Fechamento automático de caminho ao clicar próximo ao nó inicial (raio de atração de 14px) ou via tecla `Enter`.
    - Finalização de caminho aberto (linha/curva com stroke) via tecla `Escape`.
  - **Seleção Direta (`A`):**
    - Mapeamento bidirecional exato entre coordenadas de cena do canvas e espaço local do `FabricPath` utilizando `calcTransformMatrix` e `invertTransform`.
    - Renderização limpa de âncoras quadradas estilo Illustrator (7x7px com borda azul `#0071E3`) e alças tangentes em `after:render` diretamente no contexto 2D, sem poluir a lista de camadas (`canvas.getObjects()`).
    - Suporte a arrasto de nós e alças atualizando `path.path` e recalculando dimensões com `_calcDimensions()`.

### 2.2. Facade de Camadas (`canvasLayerFacade.ts`)

- Para acomodar os novos métodos de controle vetorial e manter `FabricCanvasAdapter.ts` rigorosamente abaixo de 500 linhas (483 linhas finais):
  - Todas as 17 operações de camadas (reordenação, visibilidade, bloqueio, opacidade, mesclagem, renomeação, agrupamento e adição de camada limpa) foram isoladas em `CanvasLayerFacade`.

### 2.3. Painel de Aparência Vetorial (`ContextualVectorControls.tsx`)

- Extração dos controles de forma de `ContextualToolbar.tsx` para o novo componente `ContextualVectorControls.tsx` (146 linhas):
  - Controle de preenchimento (`fill`) com `ContextualColorPopover`.
  - Controle de traçado (`stroke`) e espessura (0 a 48px) com slider de precisão e leitura tabular (`tabular-nums`).
  - Predefinições de traçado: Sólido, Tracejado (`[8, 6]`), Pontilhado (`[2, 4]`) e Traço-Ponto (`[12, 6, 2, 6]`).
  - Junção de cantos (`strokeLineJoin`): Ângulo (`miter`), Redondo (`round`) e Chanfrado (`bevel`).

### 2.4. Integração na Barra de Ferramentas Inferior (`CanvasBottomHud.tsx`) e Atalhos de Teclado

- Adição dos botões na barra de ferramentas inferior:
  - Seleção (`V`)
  - Seleção Direta (`A`)
  - Caneta Bézier (`P`)
  - Pincel (`B`)
  - Borracha (`E`)
  - Construtor de Formas / Unir (`Shift+M`)
  - Conta-gotas (`I`)
- Atalhos universais do Illustrator integrados em `useCanvasShortcuts.ts` com proteção de foco em campos de texto (`isEditableTarget`).

---

## 3. Consequências

- **Conformidade de Licenciamento:** Respeito integral à regra 7 do `AGENTS.md`. Nenhuma linha de código ou recurso proprietário do binário do Illustrator foi copiado; a implementação foi reconstruída do zero em TypeScript puro e APIs abertas do Fabric.js.
- **Performance e Integridade:** As alças de nós da Seleção Direta e guias da Caneta não poluem o modelo do documento nem o JSON/SVG serializado.
- **Qualidade e Testes:** Cobertura de testes unitários adicionada em `tests/penToolAndVectorEngine.test.ts`. Todos os 90 testes passam com 100% de sucesso e os 5 portões de qualidade (typecheck, lint, format:check, test, build) foram plenamente validados.
