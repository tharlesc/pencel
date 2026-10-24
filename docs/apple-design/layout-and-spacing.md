# Layout e Espaçamento — Diretrizes Oficiais e Arquitetura de Tela

- **URL Oficial Consultada:** `https://developer.apple.com/design/human-interface-guidelines/layout`
- **Endpoint DocC:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/layout.json`
- **Data da Consulta:** 21 de outubro de 2026

---

## 1. Síntese do Conteúdo Oficial Consultado

### 1.1 Hierarquia Visual (_Visual Hierarchy_)

- **Ordem de leitura:** Posicionar os itens mais importantes próximos ao topo e à borda inicial (_leading side_) da janela.
- **Alinhamento e Agrupamento:** Itens alinhados são percebidos como relacionados; itens indentados são percebidos como subordinados. Utilizar espaço negativo, contêineres sutis ou linhas separadoras para distinguir grupos funcionais.
- **Contenção de Complexidade:** Interfaces com excesso de escolhas simultâneas dificultam a localização rápida de recursos. Utilizar menus, abas, seções expansíveis ou visualização contextual no inspetor para reduzir a carga cognitiva inicial.

### 1.2 Adaptação e Redimensionamento (_Adaptability_)

- A interface deve manter sua estrutura familiar quando a janela é redimensionada ou movida entre monitores de diferentes resoluções.
- Respeitar margens consistentes, áreas seguras e permitir que a área central de conteúdo absorva o espaço flexível enquanto barras laterais e inspetores mantêm larguras previsíveis.

---

## 2. Aplicação Arquitetural no Editor Gráfico Web

A estrutura de layout do editor segue o padrão clássico de aplicativos criativos para macOS (como Keynote, Pages e Freeform), dividida em 4 regiões coordenadas:

1. **Barra Superior (`TopToolbar` — altura `52px`):**
   - Região inicial (_leading_): Identidade do aplicativo, nome do documento editável e indicador discreto de status.
   - Região central: Modo de seleção/ferramentas essenciais e controle de zoom do palco (`Canvas`).
   - Região final (_trailing_): Alternador de tema (Claro/Escuro), visualização de estado e ação primária de exportação.
2. **Navegação Lateral (`SidebarNav` — largura `240px` combinando rail de categorias + painel de contexto):**
   - Acesso organizado a formatos de documento (Post de Instagram, Story, Banner, Flyer), elementos básicos e camadas, sem poluir a área de desenho.
3. **Palco Central (`CanvasWorkspace` — flexível `1fr`):**
   - Fundo neutro rebaixado (`--color-bg-canvas-stage`) que destaca a prancheta branca do documento com sombra sutil de elevação, cabeçalho de dimensões (`1080 × 1080 px`) e inicialização segura do motor gráfico isolado.
4. **Painel de Propriedades / Inspetor (`InspectorPanel` — largura `280px`):**
   - Exibe propriedades contextuais organizadas em grupos claros (Documento, Dimensões `W × H`, Plano de Fundo, Camadas e Alinhamento), utilizando separadores horizontais finos (`1px`) e grade de espaçamento múltipla de `4px`.
