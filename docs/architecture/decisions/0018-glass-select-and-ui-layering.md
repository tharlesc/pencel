# 18. Apple Pro Studio Glass Select Component & Canvas Layering Stacking Architecture

- **Status:** Aprovado
- **Data:** 2026-10-25
- **Contexto:** Solicitação de refatoração do design dos seletores de lista (dropdowns genéricos/nativos), background glass nas miniaturas das pranchetas, correção de empilhamento da régua e guias no palco, correção dos ícones de alinhamento e fluxo de criação de novo documento.

---

## 1. Contexto e Motivação

1. **Seletores nativos genéricos (`<select>`):** Os elementos `<select>` nativos do navegador renderizavam com fundos opacos e menus de sistema operacional sem suporte ao design escuro translúcido com glassmorphism, destoando da identidade visual Apple Pro Studio (inspirada no popover de fontes).
2. **Empilhamento de réguas e guias:** A régua possuía `z-index: var(--z-toolbar)` (25), o que competia com menus contextuais, popovers e barras de ferramentas superiores, sobrepondo-se incorretamente aos elementos essenciais de controle da interface.
3. **Background das miniaturas das pranchetas:** A gaveta de pranchetas (`ArtboardThumbnailsDrawer`) utilizava cartões opacos em vez do efeito de vidro translúcido (`glass-float`) elogiado no HUD flutuante.
4. **Criação de Novo Documento:** No painel de templates, a criação de documentos com dimensões personalizadas não limpava o canvas anterior nem recalculava o zoom recomendado (`computeRecommendedZoom`), provocando visualização fora de enquadramento.
5. **Ícones de alinhamento trocados:** Os alinhamentos horizontais (esquerda, centro horizontal, direita) estavam referenciando glifos de barra guia horizontal (`AlignStartHorizontal`), e os verticais (topo, meio vertical, base) estavam com glifos de barra guia vertical (`AlignStartVertical`), invertendo o significado visual dos botões no toolbar.

---

## 2. Decisões Técnicas

### 2.1 Componente Reutilizável `Select` (`apps/web/src/components/ui/Select/`)

- Criado o componente `Select<T>` encapsulado em CSS Modules com `composes: glass-float from global;`.
- Suporte a acessibilidade completa: atributos `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"` e `aria-selected`.
- Navegação completa por teclado via setas para cima/baixo, Enter e Escape para fechamento.
- Indicador ativo com glifo `check` e destaque semântico de seleção (`--color-selection-bg`).
- Substituídos todos os `<select>` nativos em `ContextualVectorControls.tsx` (estilo de traçado, junção de cantos), `TemplatesPanel.tsx` (unidade de medida, DPI) e `LayersPanel.tsx` (filtro de tipo de camada).

### 2.2 Hierarquia de Stacking e z-index

- Ajustado o z-index dos contêineres:
  - `CanvasGuidesOverlay`: `z-index: var(--z-raised)` (2).
  - `CanvasRulers`: `z-index: var(--z-overlay)` (5).
  - `FloatingStudioToolbar`: `z-index: var(--z-toolbar)` (25).
  - `CanvasBottomHud`: `z-index: var(--z-toolbar)` (25).
  - `ContextualToolbar`: `position: relative; z-index: var(--z-header)` (30).
  - `Select` / `Popover` / Menus: `z-index: var(--z-popover)` (200).
- Desta forma, réguas e guias ficam sempre acima do canvas (`--z-base`), porém estritamente abaixo de todas as barras de ferramentas, drawers e popovers suspensos.

### 2.3 Background Glass nas Miniaturas das Pranchetas

- Cartões (`.card`) da gaveta espacial de pranchetas (`ArtboardThumbnailsDrawer.module.css`) agora compõem `glass-float from global;` com `--material-float-bg` e sombras táteis (`var(--shadow-glass-float)`).
- O contêiner de pré-visualização (`.previewBox`) adota fundo translúcido `--material-float-bg` com borda sutil hairline.

### 2.4 Fluxo de "Criar Novo Documento"

- Criado método `createNewDocument(dimensions)` em `useEditorSession`, que:
  1. Cria novo documento limpo (`createEmptyDocument`).
  2. Atualiza dimensões da prancheta ativa com limite seguro (64 a 8000 px).
  3. Recalcula e ajusta automaticamente o nível de zoom ideal com `computeRecommendedZoom(dimensions)`.
  4. Executa `engine.clearCanvas()` para limpar formas ou imagens do documento anterior.

### 2.5 Correção dos Ícones de Alinhamento

- Em `iconRegistry.ts`:
  - `objectAlignLeft`: `AlignStartVertical` (guia vertical à esquerda).
  - `objectAlignCenter`: `AlignVerticalJustifyCenter` (guia vertical no centro).
  - `objectAlignRight`: `AlignEndVertical` (guia vertical à direita).
  - `alignTop`: `AlignStartHorizontal` (guia horizontal no topo).
  - `alignMiddle`: `AlignHorizontalJustifyCenter` (guia horizontal no meio).
  - `alignBottom`: `AlignEndHorizontal` (guia horizontal na base).

---

## 3. Consequências e Conformidade

- **Design System:** Paridade total com o padrão Apple HIG e `tokens.css`, sem hexadecimais literais ou propriedades fora do sistema de tokens.
- **Componentes:** Todos os arquivos `.tsx` mantidos abaixo de 300 linhas de código e menos de 15 hooks.
- **Qualidade:** 123 testes unitários e de integração passando 100%, TypeScript estrito sem alertas, ESLint limpo e build de produção executado com sucesso.
