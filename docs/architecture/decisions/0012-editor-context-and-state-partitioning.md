# ADR 0012: Particionamento de Contexto do Editor e Modularização da Sidebar

- **Status:** Aprovado
- **Data:** 2026-10-24
- **Contexto:** Eliminação de prop drilling severo (~35 props repassadas de `EditorRoute` para `SidebarNav`) e decomposição de componentes monolíticos (`SidebarNav.tsx` com 1.823 linhas).

---

## 1. Contexto e Problema

1. O único contexto React existente na aplicação era o `ThemeContext`.
2. `EditorRoute.tsx` concentrava o estado da sessão, seleção, camadas e callbacks do motor gráfico, repassando cerca de 35 propriedades diretamente para `SidebarNav`, `TopToolbar`, `ContextualToolbar` e `InspectorPanel`.
3. `SidebarNav.tsx` acumulava 1.823 linhas e mais de 30 hooks misturando estado de templates, formas, tipografia, busca de mídia, paletas de cores e camadas, além de ler e gravar diretamente no `localStorage`.

---

## 2. Decisões Arquiteturais

### 2.1. `EditorProvider` com Contextos Separados por Domínio

Em vez de um único contexto monolítico que causaria re-renderizações globais a cada alteração no canvas, `EditorProvider` (`apps/web/src/features/editor/state/EditorProvider.tsx`) divide o estado em quatro contextos independentes com hooks seletores dedicados:

1. **`EditorSessionContext` (`useEditorSession`):** Documento ativo, página ativa, zoom, modo de ferramenta (`select`, `brush`, `eraser`), estado da gaveta lateral (`activeCategory`, `isDrawerOpen`) e histórico (`canUndo`, `canRedo`).
2. **`EditorSelectionContext` (`useEditorSelection`):** Elemento ativo (`selectedElement`), contagem de elementos selecionados (`selectedCount`) e estado de edição de texto.
3. **`EditorLayersContext` (`useEditorLayers`):** Lista ordenada de camadas da página ativa (`layers`), IDs selecionados (`selectedLayerIds`) e ações de reordenação, visibilidade, bloqueio e agrupamento.
4. **`EditorEngineContext` (`useEditorEngine`):** Referência estável de comandos imperativos do adaptador de canvas (inserção de elementos, alinhamento, exportação, filtros e remoção de fundo), evitando re-renderizações em componentes que apenas disparam ações.

### 2.2. Decomposição da `SidebarNav` em Painéis por Categoria

- `SidebarNav.tsx` passa a receber apenas propriedades de apresentação e delega o conteúdo da gaveta para painéis especializados em `apps/web/src/features/editor/components/sidebar/`:
  - `TemplatesSidebarPanel.tsx` + `useTemplatesPanel.ts`
  - `ElementsSidebarPanel.tsx` + `useElementsPanel.ts`
  - `TextSidebarPanel.tsx` + `useTextPanel.ts`
  - `MediaSidebarPanel.tsx` + `useMediaPanel.ts`
  - `ColorsSidebarPanel.tsx` + `useColorsPanel.ts`
  - `LayersSidebarPanel.tsx` (integrando `LayersPanel`)
- Cada componente respeita o limite máximo de 300 linhas e 15 hooks.

### 2.3. Persistência Local Tipada (`useLocalStorage`)

- Criação do hook genérico `useLocalStorage<T>` em `apps/web/src/hooks/useLocalStorage.ts` com validação segura de JSON, tratamento de falhas de cota/privacidade e sincronização de estado.
- Migração das paletas de cores salvas pelo usuário para `useLocalStorage`.

---

## 3. Consequências

- **Positivas:**
  - `EditorRoute.tsx` enxuto, atuando apenas como compositor de layout e provedor de contexto.
  - Isolamento de re-renderizações: alterações de seleção no canvas não re-renderizam a barra lateral de mídia ou templates.
  - Facilidade para aplicar `React.lazy()` nos painéis de mídia pesados.
- **Limitações:**
  - Componentes do editor que utilizam `useEditor*` devem ser renderizados dentro da árvore do `<EditorProvider>` (inclusive em testes de integração).
