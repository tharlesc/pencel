# ADR 0011: Sistema Material Pencel (Hierarquia de Vidro em 3 Camadas e Tokens Semânticos)

- **Status:** Aprovado
- **Data:** 2026-10-24
- **Contexto:** Consolidação visual do editor Pencel para eliminar valores literais (`hex`, `rgba()`, `px` avulsos), duplicatas de tokens (`--ease-apple`, `--radius-full`) e declarações dispersas de `backdrop-filter` nos CSS Modules.

---

## 1. Contexto e Problema

O diagnóstico do código identificou:

1. Uso disperso de `backdrop-filter` em cerca de 12 módulos CSS, incluindo `blur(12px)` fora dos tokens em `Dialog.module.css`.
2. Cores hexadecimais, `rgba()` e medidas em `px` hardcoded nos módulos CSS (`ContextualToolbar`, `LayersPanel`, `SidebarNav`).
3. Tokens redundantes (`--ease-apple` duplicando `--ease-out`, e `--radius-full` duplicando `--radius-pill`).
4. Ausência de fallbacks padronizados para navegadores sem suporte a `backdrop-filter` ou usuários com preferência ativa por transparência reduzida (`prefers-reduced-transparency: reduce`).

---

## 2. Decisões Arquiteturais

### 2.1. Hierarquia de Material em Três Camadas

O palco do canvas permanece sempre opaco e neutro (`--color-bg-canvas-stage`); apenas superfícies que estruturam o cromo ou flutuam sobre o conteúdo recebem material translúcido controlado por tokens com paridade 1:1 entre `theme-light.css` e `theme-dark.css`:

1. **Camada 1 — Chrome (`--material-chrome-*` / `.glass-chrome`):**
   - Aplicada à barra superior (`TopToolbar`) e ao rail lateral.
   - `blur(24px) saturate(180%)`, opacidade de superfície ~72%, hairline inferior e realce especular de `1px` no topo.
2. **Camada 2 — Float (`--material-float-*` / `.glass-float`):**
   - Aplicada à `ContextualToolbar`, popovers, menus e tooltips.
   - `blur(32px) saturate(185%)`, sombra tintada em duas camadas, raio concêntrico ao conteúdo e transição de entrada de `150ms–200ms`.
3. **Camada 3 — Sheet (`--material-sheet-*` / `.glass-sheet`):**
   - Aplicada a diálogos modais (`Dialog`, `ExportDialog`) sobre scrim (`--material-sheet-scrim`).
   - `blur(40px) saturate(190%)`, foco preso, fechamento por `Escape` e entrada com escala de `0.98` para `1`.

### 2.2. Utilitários de Vidro e Fallbacks Obrigatórios

- As classes utilitárias globais `.glass-chrome`, `.glass-float` e `.glass-sheet` em `@pencel/design-tokens` são os únicos pontos que declaram `backdrop-filter` e `-webkit-backdrop-filter`.
- Em `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` e `@media (prefers-reduced-transparency: reduce)`, os materiais convertem-se automaticamente em superfícies sólidas (`--material-*-fallback-bg`) preservando contraste WCAG AA.

### 2.3. Higiene de Tokens e Escalas Semânticas

- Remoção das duplicatas `--ease-apple` (consolidado em `--ease-out`) e `--radius-full` (consolidado em `--radius-pill`).
- Adição de escalas explícitas de opacidade (`--opacity-*`), tamanhos de ícone (`--icon-size-xs` a `--icon-size-xl`) e dimensões estruturais para eliminar números mágicos nos módulos CSS.

---

## 3. Consequências

- **Positivas:**
  - Zero declarações de `backdrop-filter` fora de `@pencel/design-tokens`.
  - Paridade estrita entre os temas claro e escuro com contraste mínimo WCAG AA auditável.
  - Desempenho previsível e respeito integral às preferências de acessibilidade do sistema operacional.
- **Limitações:**
  - Exige disciplina contínua no code review e nos testes automatizados para impedir regressão de valores literais em `.module.css`.
