# 21. Mecânicas de Mesclagem, Modo Escuro Padrão, Alinhamento de Miniaturas e Refinamento do HUD

- **Status:** Aprovado
- **Data:** 25-10-2026
- **Contexto:** Solicitação de correção das mecânicas de mesclagem (blend modes: multiplicação, sobreposição, clareamento, etc.), definição do tema escuro como padrão oficial, resolução de sobreposição do HUD superior na régua, alinhamento exato da miniatura da prancheta na gaveta de páginas, simplificação do TopToolbar (exibição exclusiva do nome do arquivo) e reformulação visual do HUD flutuante em formato retangular arredondado conforme referência tátil profissional.

---

## 1. Contexto e Problemas Diagnosticados

1. **Falha nas Mecânicas de Mesclagem (Blend Modes):**
   - No motor gráfico Fabric.js, o canvas interativo era instanciado com `backgroundColor: 'transparent'`. A cor de fundo da prancheta estava aplicada exclusivamente no elemento DOM HTML externo (`.artboardFrame`).
   - Pela especificação do HTML5 Canvas 2D / W3C Compositing and Blending, todas as operações de composição (`multiply`, `screen`, `overlay`, `darken`, `lighten`, etc.) operam sobre os pixels já presentes no buffer do `<canvas>`.
   - Quando o destino possui $\alpha = 0$ (transparência completa), a fórmula de mesclagem $C_{out} = (1 - \alpha_{dst}) \cdot C_{src} + \dots$ resulta simplesmente na cor pura de origem $C_{src}$ sem mesclagem. Além disso, `updateSelectedObjectProperties` não propagava a propriedade `blendMode` para o objeto ativo do Fabric nem definia `dirty = true`.

2. **Miniatura da Prancheta Desalinhada da Realidade:**
   - Na exportação de dados para miniatura (`exportCanvasDataUrl`), a função realizava `ctx.drawImage(src, scaledMargin, scaledMargin, scaledWidth, scaledHeight, 0, 0, outW, outH)` utilizando coordenadas lógicas CSS sem considerar a densidade de pixels do buffer (`retinaScaling` / `devicePixelRatio`).
   - Em monitores com escalonamento de alta densidade (125%, 150% ou Retina), o retângulo de corte capturava uma região reduzida no canto superior esquerdo do buffer do canvas, fazendo com que objetos centralizados na prancheta fossem projetados no canto inferior direito da miniatura gerada.

3. **Sobreposição do HUD Superior e Números da Régua:**
   - No SVG da régua horizontal (`CanvasRulers.tsx`), o elemento `<text>` utilizava `y={2}` sem definir `dominantBaseline="hanging"`. Em SVG, o posicionamento padrão de texto ocorre a partir do baseline inferior, o que empurrava grande parte da altura dos números (ex.: 1200, 1400, 1600) para fora do limite do SVG (`overflow: hidden`), gerando a ilusão de corte e sobreposição pela barra superior.
   - Adicionalmente, a barra contextual (`ContextualToolbar`) herdava uma projeção de sombra exterior (`.glass-float`) que sombreava os números superiores da régua.

4. **Modo Escuro como Padrão do Sistema:**
   - O estado inicial da aplicação estava configurado como `'light'`, contrariando a identidade Apple Pro Studio com foco deferente ao canvas gráfico em ambiente dark por padrão.

5. **Exibição do Título no TopToolbar:**
   - O cabeçalho continha metadados secundários de preset e dimensões (`instagram-post • 1080 × 1080`) que poluíam a barra superior. O requisito determinou exibir exclusivamente o nome do arquivo, limpo e centralizado.

6. **HUD Flutuante em Formato Retangular:**
   - O HUD flutuante anterior utilizava formato de pílula (`--radius-pill`). A referência exigia formato retangular com cantos suavemente arredondados (`--radius-lg`), botões compactos e acabamento de vidro escuro translúcido tátil.

---

## 2. Decisões Arquiteturais e Técnicas

1. **Renderização de Background Direto no Buffer do Canvas:**
   - Implementada a função `renderArtboardBackground` acoplada ao listener `before:render` do Fabric.js.
   - Antes do desenho de qualquer objeto, o retângulo exato da prancheta `(0, 0, pageDimensions.width, pageDimensions.height)` é preenchido com a cor de fundo do documento (`page.backgroundColor`).
   - Todos os blend modes do Canvas 2D agora possuem pixels de destino reais para realizar a composição correta em tempo real, além de compor entre elementos empilhados.
   - Adicionado suporte completo a `props.blendMode` no `updateSelectedObjectProperties`, marcando `active.dirty = true` e atualizando seleções compostas.
   - Adicionado controle direto de Modo de Mesclagem na barra contextual (`ContextualAlignmentAndTrailing`), permitindo alternância ágil entre `multiply`, `overlay`, `screen`, `lighten`, `darken`, etc.

2. **Correção de Buffer e Retina Scaling na Exportação de Miniaturas:**
   - Em `historyAndPageEngine.ts`, `exportCanvasDataUrl` calcula dinamicamente o fator de conversão de buffer:
     ```ts
     const pixelRatioX = (src.width || 1) / canvasLogicalWidth;
     const pixelRatioY = (src.height || 1) / canvasLogicalHeight;
     ```
   - O recorte das coordenadas da prancheta é escalonado com precisão subpixel, garantindo paridade geométrica idêntica entre a tela interativa e as miniaturas da gaveta lateral.

3. **Eliminação de Sobreposição na Régua e Tipografia SVG:**
   - No `CanvasRulers.tsx`, configurado `dominantBaseline="hanging"` e `y={3}` nos elementos de texto horizontal e vertical, posicionando os números com folga e legibilidade visual absoluta.
   - Em `ContextualToolbar.module.css`, removida a sombra descendente (`box-shadow: none;`) e fixada borda sutil sem invasão do plano de trabalho da régua.

4. **Tema Escuro como Padrão:**
   - `ThemeProvider.tsx` inicializa com `useState<ThemeMode>('dark')` e aplica imediatamente `document.documentElement.setAttribute('data-theme', 'dark')`.

5. **Simplificação Visual do TopToolbar:**
   - Removido o bloco `.documentMeta` do `TopToolbar.tsx`, mantendo apenas o campo de texto editável do documento, centralizado com alinhamento vertical ótimo.

6. **Redesign do Floating Studio Toolbar:**
   - `FloatingStudioToolbar.module.css` atualizado com `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-xl)`, botões com cantos arredondados e divisores discretos em conformidade com o design token system do Pencel.

---

## 3. Consequências e Validação

- **Paridade Gráfica:** Blend modes (multiplicação, tela, sobreposição, luz suave/forte) funcionam instantaneamente tanto sobre o fundo da prancheta quanto entre camadas sobrepostas.
- **Confiabilidade das Miniaturas:** As miniaturas de todas as pranchetas refletem exatamente a posição central e dimensões reais dos objetos.
- **Conformidade de Qualidade:**
  - `npm run typecheck`: 0 erros em todos os pacotes.
  - `npm run lint`: 0 erros ou avisos ESLint.
  - `npm run format:check`: 100% dos arquivos compatíveis com Prettier.
  - `npm run test`: 129 testes aprovados (14 na API + 93 no Web + 22 no Core).
  - `npm run build`: Sucesso total em 1.33s.
