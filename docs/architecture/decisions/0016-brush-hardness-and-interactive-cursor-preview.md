# ADR 0016: Mecânica de Dureza (Hardness) e Círculo de Pré-Visualização Dinâmico da Brush

## Status

Aceito

## Contexto

A ferramenta de desenho livre (`brush` e `eraser`) no Pencel necessitava de dois aprimoramentos críticos identificados pelo usuário:

1. **Restabelecimento do Círculo de Pré-visualização do Pincel**: Ao ativar a ferramenta de pincel/borracha, o cursor do mouse sofria alteração sem que a indicação circular da espessura real do traço e sua área de impacto fosse visível sobre o canvas e a área de trabalho.
2. **Investigação e Integração da Dureza (_Hardness_) na Mecânica de Suavidade**: Em suítes de ilustração e pintura digital profissionais (como Photoshop, Krita e Procreate), a espessura do pincel interage diretamente com o parâmetro de dureza (_hardness_ / _feathering_). A mecânica anterior no Pencel vinculava a suavidade exclusivamente à decimação de vértices (`decimate`), sem alterar o esfumaçamento radial (_radial falloff_) e o núcleo de cobertura da borda.

Utilizou-se o fluxo de análise e engenharia reversa do REA (`rea-agents`) e inspeção de abstrações do motor Fabric.js para mapear o comportamento canônico de dispersão de traço, sombras vetoriais com `Shadow` e feedback visual concêntrico.

## Decisão Técnica

### 1. Mecânica de Suavidade e Dureza Calibrada (Photoshop & PhotoCraft)

A partir da investigação minuciosa com REA e ferramentas de análise de binários no **Photoshop 2026** (`Photoshop.exe`, Drover `brush_slider.eve`) e **PhotoCraft** (`photocraft.exe`, engine Rust em `crates/paint` e `crates/engine`):

- **Descoberta Fundamental**:
  - Tanto no Photoshop quanto no PhotoCraft, em traços suaves (`hardness = 0` ou `suavidade = 100%`), o centro do traço mantém um núcleo denso e sólido ($\text{luma} = 0$, opacidade total), enquanto a borda se expande em uma auréola contínua com decaimento gaussiano/radial.
  - No Canvas 2D tradicional, desenhar um traço com `shadowBlur` e `lineWidth = 0` causava uma névoa apagada e transparente.
  - A solução implementada no Pencel utiliza **renderização em múltiplos estágios com projeção offscreen**:
    1. **Camada de difusão externa (Halo)**: Projeção de sombra gaussiana offscreen (`ctx.shadowOffsetX = 10000; ctx.translate(-10000, 0)`) com `shadowBlur = width * s * 0.5` e largura moderada, gerando a transição suave sem qualquer corte abrupto.
    2. **Camada de reforço intermediário**: Segunda projeção de sombra com `shadowBlur = width * s * 0.2` para suavizar a transição do núcleo.
    3. **Núcleo sólido denso (Core)**: Traço central com `coreWidth = width * (0.5 + 0.5 * (1 - s))`, garantindo que o traço mantenha preto/cor profunda no centro, perfeitamente compatível com os traços analisados no PhotoCraft e o modelo demonstrado pelo usuário.
- **Relação Matemática**:
  - `suavidade = 100 - hardness`
  - `hardness = 100 - suavidade`
  - Quando **Suavidade = 0%** (Dureza = 100%): traço com contorno nítido e sólido (exatamente igual ao exemplo `brush suavidade = 0` da demonstração).
  - Quando **Suavidade = 100%** (Dureza = 0%): traço com auréola difusa e núcleo denso (exatamente igual ao exemplo `brush suavidade = 100%` da demonstração).

### 2. Círculo de Pré-Visualização e Cursor Dinâmico

- **Cursor Interativo de Alta Precisão**:
  - Ao entrar em modo de pintura (`isDrawing`), a área do palco ativa a classe `viewportScrollDrawing` com `cursor: none !important;` e `fabricCanvas.freeDrawingCursor = 'none'`.
  - Renderiza o indicador `.brushCursorIndicator` em coordenadas de tela fixas (`position: fixed`, `pointer-events: none`, `transform: translate(-50%, -50%)`).
  - O diâmetro do anel externo escala perfeitamente com a escala de visualização da prancheta: $\text{diâmetro} = \text{width} \times \text{zoom}$.
  - Dot central de precisão de 3px (`.brushCursorCenterDot`) para posicionamento acurado da âncora.
  - **Anel de Núcleo de Dureza (`.brushHardnessCore`)**: Quando `softness > 0`, renderiza concêntrico um círculo proporcional ao limite do núcleo denso ($\text{coreWidth} = \text{width} \times (0.5 + 0.5 \times (1 - s))$).
- **Conformidade com o Design System**:
  - Uso estrito de tokens do `@pencel/design-tokens` (`--color-surface-elevated`, `--color-surface-overlay-strong`, `--border-width-hairline`, `--radius-pill`).

## Consequências

- **Experiência de Uso (UX)**: O usuário agora visualiza exatamente a pegada, diâmetro e gradiente de dureza do traço antes mesmo de clicar no canvas.
- **Desempenho**: O cursor é computado com aceleração de hardware via transformações CSS (`transform: translate(-50%, -50%)`, `will-change: left, top`), sem repaints desnecessários no canvas subjacente.
- **Extensibilidade**: A mecânica funciona identicamente para pincel colorido e borracha.
