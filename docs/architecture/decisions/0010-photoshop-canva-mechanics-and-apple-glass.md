# ADR 0010: Mecânicas Avançadas de Manipulação, Multi-Artboard Engine e Apple Liquid Glass

- **Status:** Aprovado
- **Data:** 2026-10-23
- **Contexto:** Solicitação de evolução arquitetural com base nas mecânicas de manipulação de suítes de criação profissional (semelhante a outros no mercado), incorporando materiais translúcidos de vidro (Apple HIG), seleção múltipla nas camadas via tecla `Shift`, integração de figurinhas estáticas do GIPHY e sistema de múltiplas pranchetas.

---

## 1. Contexto e Problema

O editor necessitava de refinamentos essenciais para atingir paridade com suítes profissionais:

1. **Materiais Apple HIG:** Elementos sobrepostos (menus, popovers, barras flutuantes) necessitavam de acabamento de vidro fosco (`backdrop-filter: blur(16px-28px)`, bordas especulares, sombras multicamadas), substituindo o `<select>` nativo de fontes por um seletor visual estilizado.
2. **Seleção múltipla de camadas:** Permitir seleção conjunta com `Shift` no painel de camadas e sincronização bidirecional com o `ActiveSelection` do Fabric.js.
3. **Mecânicas profissionais de estúdio:**
   - Ferramenta de Pincel (`B`) e Borracha (`E`) com composição `destination-out`.
   - Sistema de alinhamento duplo (elemento-para-elemento e elemento-para-prancheta) e distribuição equitativa.
   - Guias inteligentes de encaixe magnético (_smart snapping_).
   - Criador de dimensões customizadas (_Criar Novo_) com conversão de unidades (px, cm, mm, in) e DPI.
   - Atalhos de teclado estendidos (`V`, `B`, `E`, `I`, `Ctrl+C`, `Ctrl+V`, `Ctrl+D`).
4. **Figurinhas Estáticas do GIPHY:** Utilização de imagens estáticas (_stills_) para máxima nitidez e zero sobrecarga no canvas, com chave dedicada e cache local de 24 horas.
5. **Múltiplas Pranchetas / Páginas:** Gerenciamento de páginas no modelo de domínio `@pencel/editor-core` e navegação fluida no rodapé HUD do palco.

---

## 2. Decisões Arquiteturais

### 2.1. Seletor de Tipografia e Materiais Apple HIG

- Implementação do `FontSelectorPopover` em `ContextualToolbar.tsx`, aplicando tokens de vidro líquido (`--surface-glass-bg`, `--surface-glass-border`, `--surface-glass-specular`, `--surface-glass-shadow`).
- Exibição de fontes categorizadas (Sans-Serif, Serif, Display, Script, Monospace) renderizadas em suas próprias famílias tipográficas com carregamento dinâmico via Google Fonts API.

### 2.2. Seleção Múltipla nas Camadas

- `LayersPanel.tsx` captura `MouseEvent.shiftKey` para seleção aditiva ou por intervalo contínuo.
- O motor `FabricCanvasAdapter.selectObjectsByNames()` instancia `ActiveSelection` no Fabric.js, sincronizando caixas de dimensão conjuntas no palco.

### 2.3. Mecânica de Pincel e Borracha

- `setDrawingMode(enabled, mode, options)` comuta `fabric.Canvas.isDrawingMode`.
- No evento `path:created`, traços da borracha recebem `globalCompositeOperation = 'destination-out'`, apagando pixels de traços e camadas limpas com fidelidade profissional.

### 2.4. Alinhamento e Guias Inteligentes

- Métodos `alignSelected()` e `distributeSelected()` calculam coordenadas baseando-se no tipo de seleção:
  - Seleção única: alinhamento relativo às bordas e ao centro da prancheta.
  - Seleção múltipla (`ActiveSelection`): alinhamento relativo à caixa envolvente coletiva e distribuição equidistante.
- Encaixe magnético no evento `object:moving` com limiar de 6px para centro e bordas.

### 2.5. Múltiplas Pranchetas (Estilo Pranchetas Múltiplas)

- Expansão de `@pencel/editor-core/documentFactory`: `addPageToDocument`, `duplicateActivePage`, `deletePageFromDocument`, `setActivePageInDocument`.
- `FabricCanvasAdapter` armazena serializações JSON em mapa em memória (`pageStates`), restaurando o estado do canvas instantaneamente na troca de página.
- Rodapé HUD no `CanvasWorkspace.tsx` com contador `Página X de Y`, navegação anterior/próxima e botões de adicionar, duplicar e excluir prancheta.

---

## 3. Consequências

- **Positivas:**
  - Fluxo de trabalho idêntico a suítes de alto nível (semelhante a outros no mercado).
  - Alto desempenho gráfico e economia de requisições externas com cache local.
  - Conformidade estrita com as regras do monorepo e 100% de cobertura nos testes automatizados.
- **Limitações:**
  - A API nativa `EyeDropper` depende de suporte do navegador (Chromium/Edge); em navegadores sem suporte, a ativação falha silenciosamente sem quebrar a aplicação.
